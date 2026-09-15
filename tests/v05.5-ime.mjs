import {_electron as electron} from 'playwright';
import {spawn,execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
execFileSync('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe',['/nologo','/platform:x64','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/out:'+path.resolve('native/bin/InputTarget.exe'),path.resolve('tests/InputTarget.cs')]);
const app=await electron.launch({args:process.env.PROTOTYPE_EXE?['--test']:['.','--test'],env,...(process.env.PROTOTYPE_EXE?{executablePath:process.env.PROTOTYPE_EXE}:{}),timeout:60000});let target;
const delay=ms=>new Promise(r=>setTimeout(r,ms)),report=[];
try{
 let page;for(let n=0;n<120&&!page;n++){page=app.windows().find(w=>w.url().endsWith('settings.html'));if(!page)await delay(100);}await page.waitForSelector('body[data-ready="true"]');
 let handle='',text='',language='',profileLocale='',profileResult='',compositions=0,reads=0,middleDown=0;
 target=spawn(path.resolve('native/bin/InputTarget.exe'),[],{windowsHide:false,stdio:['pipe','pipe','pipe']});
 createInterface({input:target.stdout}).on('line',l=>{if(l.startsWith('READY:'))handle=l.slice(6);if(l.startsWith('TEXT:')){text=Buffer.from(l.slice(5),'base64').toString();reads++;}if(l.startsWith('LANGUAGE:'))language=l.slice(9);if(l.startsWith('PROFILE:')){const parts=l.slice(8).split(':');profileLocale=parts.shift();profileResult=parts.join(':');}if(l.startsWith('COMPOSITIONS:'))compositions=Number(l.slice(13));if(l.startsWith('MOUSE:'))middleDown=Number(l.slice(6).split(',')[3]);});
 const until=async(fn,label)=>{for(let i=0;i<100;i++){if(await fn())return;await delay(50);}throw Error('Timeout: '+label);};
 await until(()=>!!handle,'fixture startup');target.stdin.write('focus\n');await until(()=>app.evaluate((_e,h)=>global.__test.packet()?.target===h,handle),'fixture foreground');
 const packet={connected:true,slot:0,target:handle,pid:target.pid,x:0,y:0,rx:0,ry:0,buttons:0};
 const feed=async(buttons,axes={})=>{await app.evaluate((_e,p)=>global.__test.feed(p),{...packet,...axes,buttons});await delay(50);};
 const press=async(b,axes={})=>{await feed(b,axes);await feed(0,axes);};
 const read=async()=>{const count=reads;target.stdin.write('read\n');await until(()=>reads>count,'fixture read');return text;};
 const letters='abcdefghijklmnopqrstuvwxyz,.';
 const type=async value=>{for(const c of value){const i=letters.indexOf(c),sector=Math.floor(i/4),radians=(sector+1)*Math.PI/4,axes={x:.95*Math.sin(radians),y:-.95*Math.cos(radians)};await feed(0,axes);await press([32768,4096,16384,8192][i%4],axes);}};
 for(const [locale,word,pattern] of [['en-US','hello',/^hello$/],['zh-CN','nihao',/[\u3400-\u9fff]/],['ja-JP','ohayou',/^おはよう$/]]){
  await app.evaluate(()=>global.__test.stop());target.stdin.write('language:'+locale+'\n');await until(()=>language===locale&&profileLocale===locale,'installed '+locale);if(locale!=='en-US')assert.equal(profileResult,'ok',locale+' activates the Windows default TSF profile');target.stdin.write('clear\n');await delay(250);if(locale==='ja-JP'){target.stdin.write('hiragana\n');await delay(500);}
  await feed(0);await feed(0);await press(64);assert.equal((await app.evaluate(()=>global.__test.state())).active,true,JSON.stringify(await app.evaluate(()=>({state:global.__test.state(),packet:global.__test.packet()}))));await type(word);
  if(locale==='zh-CN'){await press(1);await press(2);await delay(300);}if(locale==='ja-JP'){await press(2);await delay(300);}
  const value=await read();console.log('IME DEBUG',locale,{value,profileResult,compositions});report.push({locale,text:value,profile:profileResult,compositions});assert.match(value,pattern,locale+' uses Windows text conversion');if(locale!=='en-US')assert.ok(compositions>0,locale+' receives genuine IME composition messages');
 }
 await app.evaluate(()=>global.__test.stop());target.stdin.write('language:en-US\n');await until(()=>language==='en-US'&&profileLocale==='en-US','reset English');target.stdin.write('clear\n');await delay(250);await feed(0);await feed(0);await read();
 let previous=language;const beforeMiddle=middleDown;const switched=[];let nativeJapanese='';
 for(let i=0;i<3;i++){await feed(0);await feed(0);const before=(await app.evaluate(()=>global.__test.imeEvidence())).length;await press(128);await press(128);await press(128);await until(async()=>{await read();return language!==previous;},'triple R3 changes Windows input language');await until(async()=>(await app.evaluate(()=>global.__test.imeEvidence())).length>before,'native IME acknowledgement');const ack=(await app.evaluate(()=>global.__test.imeEvidence())).at(-1);assert.equal(ack.ok,true);switched.push(language);console.log('SWITCH',language,ack);previous=language;await delay(650);await feed(0);
  if(language==='ja-JP'){target.stdin.write('clear\nhiragana\n');await delay(500);await feed(0);await feed(0);await press(64);assert.equal((await app.evaluate(()=>global.__test.state())).active,true);await type('ohayou');await press(2);await delay(300);nativeJapanese=await read();assert.equal(nativeJapanese,'おはよう','native R3 switch activates Japanese TSF composition');await app.evaluate(()=>global.__test.stop());}
 }
 assert.equal(new Set(switched).size,3);assert.equal(nativeJapanese,'おはよう','native R3 switch reaches Japanese IME');await read();assert.equal(middleDown,beforeMiddle,'language shortcut does not click middle');report.push({tripleSwitches:switched,nativeJapanese,middleLeak:0});
 target.stdin.write('language:en-US\n');await delay(100);await mkdir('tests/artifacts-v05.5',{recursive:true});await writeFile('tests/artifacts-v05.5/ime-report.json',JSON.stringify(report,null,2));console.log('PASS real English, Chinese and Japanese Windows IME composition, three installed-language switches, no middle-click leak.');
}finally{if(target){target.stdin.write('close\n');target.stdin.end();}await app.close();}
