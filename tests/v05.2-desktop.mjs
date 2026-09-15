import {_electron as electron} from 'playwright';import assert from 'node:assert/strict';import {spawn,execFileSync} from 'node:child_process';import {createInterface} from 'node:readline';import {writeFile} from 'node:fs/promises';import path from 'node:path';
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
execFileSync('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe',['/nologo','/target:exe','/platform:x64','/reference:System.Windows.Forms.dll','/reference:System.Drawing.dll','/out:'+path.resolve('native/bin/InputTarget.exe'),path.resolve('tests/InputTarget.cs')]);
const app=await electron.launch({args:process.env.PROTOTYPE_EXE?['--test']:['.','--test'],env,...(process.env.PROTOTYPE_EXE?{executablePath:process.env.PROTOTYPE_EXE}:{}),timeout:60000});let target;
try{
 let settings;for(let i=0;i<120&&!settings;i++){settings=app.windows().find(p=>p.url().endsWith('settings.html'));if(!settings)await new Promise(r=>setTimeout(r,250));}assert.ok(settings,'settings window loads');
 await settings.waitForSelector('body[data-ready="true"]');await app.evaluate(()=>{if(!global.__test)throw Error('Missing test controller');});
 const errors=[];settings.on('pageerror',e=>errors.push(e.message));await app.evaluate(()=>global.__test.openSettings());
 await settings.waitForFunction(()=>document.querySelector('#desktop-image').src.startsWith('data:image/'));
 await settings.evaluate(()=>window.desktop.setAppearance({keyboardMode:'single'}));
 assert.equal(await settings.locator('#sectors .disc-layer.active .letter').count(),28);
 await settings.locator('[data-opacity="50"]').click();await settings.waitForFunction(()=>document.querySelector('#opacity-value').textContent==='50%');
 await settings.locator('[data-ink="white"]').click();assert.equal((await settings.evaluate(()=>window.desktop.getAppearance())).ink,'white');
 await settings.locator('[data-opacity="15"]').click();await settings.locator('[data-ink="original"]').click();await settings.waitForFunction(()=>document.querySelector('[data-ink="original"]').getAttribute('aria-pressed')==='true');await settings.waitForTimeout(250);
 const shot=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.fromId(global.__test.settings).webContents.capturePage()).toPNG().toString('base64'));await writeFile('../../outputs/设置面板-v05.2.png',Buffer.from(shot,'base64'));
 assert.equal(await settings.locator('#practice-text,[data-tab="practice"]').count(),0);assert.equal(await settings.locator('#preview-wheel').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
 // Keep settings OPEN behind another app: this must never disable the global L3 shortcut.
 console.log('PASS settings desktop capture, live opacity/ink, exact 28 glyphs and appearance-only preview.');

 await settings.locator('[data-tab="appearance"]').click();await settings.locator('#custom-style').click();
 await settings.locator('#outline-color').fill('#ff3366');await settings.locator('#outline-color').dispatchEvent('input');
 await settings.waitForFunction(()=>document.documentElement.style.getPropertyValue('--selection-color')==='#ff3366');
 assert.equal(await settings.locator('#sectors .disc-layer.active .sector.selected .selection-outline').count(),1);
 await settings.locator('#reset-style').click();await settings.waitForFunction(()=>document.documentElement.style.getPropertyValue('--selection-color')==='#1058f9');
 const outline=await settings.locator('#sectors .disc-layer.active .sector.selected .selection-outline path').evaluate(e=>({stroke:getComputedStyle(e).stroke,width:getComputedStyle(e).strokeWidth,fill:getComputedStyle(e).fill}));assert.deepEqual(outline,{stroke:'rgb(16, 88, 249)',width:'3px',fill:'none'});
 await settings.locator('[data-tab="controller"]').click();await settings.locator('#custom-buttons').click();await settings.locator('[data-bind-mode="typing"]').click();await settings.locator('#binding-Y').selectOption('X');
 assert.equal((await settings.evaluate(()=>window.desktop.getAppearance())).bindings.typing.Y,'X');await settings.locator('#reset-bindings').click();
 await settings.waitForFunction(()=>document.querySelector('#binding-Y').value==='Y');
 const expandedArrow=await settings.locator('#custom-buttons>span').evaluate(e=>getComputedStyle(e).transform);assert.equal(expandedArrow,'matrix(0, 1, -1, 0, 0, 0)');await settings.locator('#custom-buttons').click();await settings.waitForTimeout(180);assert.equal(await settings.locator('#custom-buttons').getAttribute('aria-expanded'),'false');assert.equal(await settings.locator('#custom-buttons>span').evaluate(e=>getComputedStyle(e).transform),'none');
 assert.equal(await settings.locator('#mouse-speed').getAttribute('max'),'6400');await settings.locator('#mouse-speed').fill('6400');await settings.locator('#mouse-speed').dispatchEvent('input');await settings.waitForFunction(()=>document.querySelector('#mouse-speed-value').textContent==='6400');assert.equal((await settings.evaluate(()=>window.desktop.getAppearance())).mouseSpeed,6400);await settings.locator('#mouse-speed').fill('850');await settings.locator('#mouse-speed').dispatchEvent('input');
 await settings.locator('[data-tab="appearance"]').click();await settings.locator('main').evaluate(e=>e.scrollTop=0);
 const customShot=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.fromId(global.__test.settings).webContents.capturePage()).toPNG().toString('base64'));await writeFile('../../outputs/设置面板-v05.2.png',Buffer.from(customShot,'base64'));
 console.log('PASS editable bindings, Figma blue outline, custom colors and restore defaults.');

 target=spawn(path.resolve('native/bin/InputTarget.exe'),[],{windowsHide:false,stdio:['pipe','pipe','pipe']});let yielded=false,handle='',text='',shift=false,ctrl=false,mouseOnTarget=false,media=0,vertical=0,reads=0,mouse=[];
 createInterface({input:target.stdout}).on('line',l=>{if(l==='YIELDED')yielded=true;if(l.startsWith('READY:'))handle=l.slice(6);if(l.startsWith('TEXT:')){text=Buffer.from(l.slice(5),'base64').toString();reads++;}if(l.startsWith('MOUSE:'))mouse=l.slice(6).split(',').map(Number);if(l.startsWith('SHIFT:'))shift=l.slice(6)==='True';if(l.startsWith('CTRL:'))ctrl=l.slice(5)==='True';if(l.startsWith('VERTICAL:'))vertical=Number(l.slice(9));if(l.startsWith('MEDIA:'))media=Number(l.slice(6));if(l.startsWith('MOUSEONTARGET:'))mouseOnTarget=l.slice(14)==='True';});
 const until=async(fn,label)=>{for(let i=0;i<100;i++){if(await fn())return;await new Promise(r=>setTimeout(r,50));}console.log('FOREGROUND DIAGNOSTICS',label,handle,target?.exitCode,await app.evaluate(()=>global.__test.packet()));throw Error('Timeout: '+label);};
 await until(()=>!!handle,'target starts');target.stdin.write('focus\n');await until(async()=>{const ready=await app.evaluate((_electron,h)=>global.__test.packet()?.target===h,handle);if(!ready)target.stdin.write('focus\n');return ready;},'target foreground');
 const packet={connected:true,slot:0,x:.8,y:-.8,target:handle,pid:target.pid};
 const feed=async (buttons,axes={})=>{const s=await app.evaluate((_electron,p)=>global.__test.feed(p),{...packet,...axes,buttons});await new Promise(r=>setTimeout(r,65));return s;};
 const press=async b=>{await feed(b);await feed(0);};const read=async()=>{const old=reads;target.stdin.write('read\n');await until(()=>reads>old,'target read');return text;};
 assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.fromId(global.__test.settings).isVisible()),true,'settings deliberately stays visible behind the external target');
 await feed(0);await feed(0);await press(64);assert.equal(await app.evaluate(()=>global.__test.state().active),true,'L3 must open globally even with settings still visible');
 assert.equal(await app.evaluate((_electron,h)=>global.__test.packet().target===h,handle),true,'overlay must not take foreground focus');
 const overlayEvidence=await app.evaluate(async({BrowserWindow})=>{const win=BrowserWindow.fromId(global.__test.overlay),image=await win.webContents.capturePage();return {focusable:win.isFocusable(),visible:win.isVisible(),alpha:image.toBitmap()[3]};});assert.deepEqual(overlayEvidence,{focusable:false,visible:true,alpha:0});
 for(const b of [32768,4096,16384,8192])await press(b);assert.equal(await read(),'abcd');
 await press(4);await press(1);await press(2);assert.equal(await read(),'abc \r\n');
 await feed(8);await feed(8|32768);await feed(0);assert.equal(await read(),'abc \r\nA');assert.equal(shift,false);
 await feed(8);await feed(8|64);await feed(0);assert.equal(await app.evaluate(()=>global.__test.state().active),false);await read();assert.equal(shift,false,'hide must release physical Shift');
 await press(32768);assert.equal(await read(),'abc \r\nA','hidden wheel must never input');
 await press(64);await app.evaluate(()=>global.__test.feed({connected:false,slot:0,buttons:0}));assert.equal(await app.evaluate(()=>global.__test.state().active),false);
 await feed(0);await feed(0);await press(64);assert.equal(await app.evaluate(()=>global.__test.state().active),true);await app.evaluate(()=>global.__test.feed({connected:true,slot:0,buttons:0,target:'0',pid:0,x:0,y:0}));assert.equal(await app.evaluate(()=>global.__test.state().active),false);

 const neutral={x:0,y:0,rx:0,ry:0};target.stdin.write('focus\n');await until(()=>app.evaluate((_e,h)=>global.__test.packet()?.target===h,handle),'mouse fixture foreground');
 await feed(0,neutral);await feed(0,neutral);await read();const start=mouse.slice();
 await feed(0,{...neutral,x:1});await feed(0,{...neutral,x:1});await feed(0,neutral);await read();assert.ok(mouse[0]>start[0],'idle LEFT stick moves real cursor');
 target.stdin.write('focus\n');await new Promise(r=>setTimeout(r,100));await until(async()=>{await read();return mouseOnTarget;},'mouse is over fixture before scroll');const beforeScroll=mouse[2];
 for(let n=0;n<8;n++)await feed(0,{...neutral,rx:1});await feed(0,neutral);await read();if(!(mouse[2]>beforeScroll))console.log('SCROLL DIAGNOSTICS',mouse,beforeScroll,await app.evaluate(()=>({state:global.__test.state(),packet:global.__test.packet(),events:global.__test.pointerEvidence()})));assert.ok(mouse[2]>beforeScroll,'idle RIGHT stick sends real WM_MOUSEHWHEEL');
 const beforeVertical=vertical;for(let n=0;n<8;n++)await feed(0,{...neutral,ry:-1});await feed(0,neutral);await read();assert.ok(vertical>beforeVertical,'right stick UP sends positive WM_MOUSEWHEEL');const afterUp=vertical;target.stdin.write('focus\n');await until(async()=>{await read();return mouseOnTarget;},'mouse over fixture before downward scroll');for(let n=0;n<8;n++)await feed(0,{...neutral,ry:1});await feed(0,neutral);await read();if(!(vertical<afterUp))console.log('VERTICAL DIAGNOSTICS',{beforeVertical,afterUp,vertical,mouseOnTarget},await app.evaluate(()=>global.__test.pointerEvidence()));assert.ok(vertical<afterUp,'right stick DOWN sends negative WM_MOUSEWHEEL');
 await feed(128,neutral);await read();assert.equal(mouse[5],1,'R3 holds middle button');await feed(0,neutral);await read();assert.equal(mouse[5],0);assert.ok(mouse[3]>0&&mouse[4]>0,'fixture receives middle down and up');
 await feed(64,neutral);await feed(0,neutral);assert.equal(await app.evaluate(()=>global.__test.state().active),true);await read();const beforeLeft=mouse.slice();
 await feed(0,{...neutral,x:1});await feed(0,{...neutral,x:1});await feed(0,neutral);await read();assert.deepEqual(mouse.slice(0,2),beforeLeft.slice(0,2),'typing LEFT stick does not move cursor');
 await feed(0,{...neutral,rx:1});await feed(0,{...neutral,rx:1});await feed(0,neutral);await read();assert.ok(mouse[0]>beforeLeft[0],'typing RIGHT stick moves real cursor');assert.equal(mouse[2],beforeLeft[2],'typing RIGHT stick does not scroll');
 await feed(128,neutral);await app.evaluate(()=>global.__test.feed({connected:false,slot:0,buttons:0}));await read();assert.equal(mouse[5],0,'disconnect releases held middle button');
 target.stdin.write('focus\n');await until(async()=>{await read();return mouseOnTarget;},'fixture before high-speed check');await settings.evaluate(()=>window.desktop.setAppearance({mouseSpeed:6400}));await feed(0,neutral);await feed(0,neutral);await read();const beforeFast=mouse[0];await feed(0,{...neutral,x:1});await feed(0,neutral);await read();assert.ok(mouse[0]-beforeFast>120,'native cursor movement supports speed above old clamp');await settings.evaluate(()=>window.desktop.setAppearance({mouseSpeed:850}));
 console.log('PASS real pointer movement, horizontal wheel messages, middle down/up, mode handoff and disconnect release.');
 await settings.evaluate(async()=>{const a=await window.desktop.getAppearance();a.bindings.typing.Y='X';await window.desktop.setAppearance({bindings:a.bindings});});
 await feed(0,neutral);await feed(0,neutral);await feed(64,neutral);await feed(0);const beforeRemap=await read();await feed(32768);await feed(0);assert.equal(await read(),beforeRemap+'c','remapped Y emits left-slot c into real textbox');
 await settings.evaluate(async()=>{const a=await window.desktop.getAppearance();a.bindings.typing.Y='Y';await window.desktop.setAppearance({bindings:a.bindings});});
 console.log('PASS customized face-button action reaches the real external text field.');

 // Switch to dual mode while retaining the same external textbox and native bridge.
 await settings.evaluate(()=>window.desktop.setAppearance({keyboardMode:'dual',chordInterval:300,leftDisc:0,rightDisc:2}));
 target.stdin.write('focus\n');await until(()=>app.evaluate((_e,h)=>global.__test.packet()?.target===h,handle),'dual target focus');
 await feed(0,neutral);await feed(0,neutral);await read();const beforeChord=mouse.slice();
 await feed(128,neutral);await feed(192,neutral);await feed(0,neutral);
 assert.equal(await app.evaluate(()=>global.__test.state().active),true);await read();assert.equal(mouse[3],beforeChord[3],'dual chord must never emit middle down');
 const dualAxes={x:.8,y:-.8,rx:.8,ry:-.8};await feed(0,dualAxes);const textBeforeDual=await read();
 await feed(1|32768,dualAxes);await feed(0,dualAxes);await feed(2|4096,dualAxes);await feed(0,dualAxes);await feed(4|16384,dualAxes);await feed(0,dualAxes);await feed(8|8192,dualAxes);await feed(0,dualAxes);
 assert.equal(await read(),textBeforeDual+'a1b2c3d4','left Dpad and right XYAB reach real external textbox independently');assert.deepEqual(mouse.slice(0,2),beforeChord.slice(0,2),'dual sticks do not move cursor');
 const overlay=app.windows().find(p=>p.url().endsWith('overlay.html'));await overlay.waitForSelector('body[data-ready="true"]');assert.equal(await overlay.locator('.disc-layer.active .letter').count(),56);
 const ids=await overlay.locator('[id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(new Set(ids).size,ids.length,'SVG definitions belong to separate wheels');
 await overlay.waitForTimeout(250);const dualShot=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.fromId(global.__test.overlay).webContents.capturePage()).toPNG().toString('base64'));await writeFile('../../outputs/双转盘-v05.2.png',Buffer.from(dualShot,'base64'));
 await feed(192,neutral);await feed(0,neutral);assert.equal(await app.evaluate(()=>global.__test.state().active),false);
 await read();const beforeTap=mouse[3];await feed(128,neutral);await feed(0,neutral);await read();assert.equal(mouse[3],beforeTap+1,'solo short R3 still clicks middle');assert.equal(mouse[5],0);
 // Modifier ownership and disconnect cleanup are verified against real Windows key state.
 await settings.evaluate(async()=>{const a=await window.desktop.getAppearance();a.bindings.idle.LT='modifier:ctrl';a.bindings.idle.RT='modifier:shift';await window.desktop.setAppearance({bindings:a.bindings});});
 await feed(0,neutral);await feed(0,neutral);await feed(65536|131072,neutral);await read();assert.equal(ctrl,true);assert.equal(shift,true);await app.evaluate(()=>global.__test.feed({connected:false,slot:0,buttons:0}));await until(async()=>{await read();return !ctrl&&!shift;},'disconnect releases both modifiers');
 await settings.evaluate(async()=>{const a=await window.desktop.getAppearance();a.bindings.idle.View='layer:auxiliary';a.auxiliaryBindings.idle.Y='key:mediaPlay';await window.desktop.setAppearance({bindings:a.bindings,auxiliaryBindings:a.auxiliaryBindings});});
 await feed(0,neutral);await feed(0,neutral);await feed(32|32768,neutral);await feed(0,neutral);await read();assert.equal(media,14,'auxiliary media play reaches isolated WM_APPCOMMAND handler');
 await settings.evaluate(async()=>{const a=await window.desktop.getAppearance();a.bindings.idle.View='app:keyboard';await window.desktop.setAppearance({bindings:a.bindings});});await feed(0,neutral);await feed(0,neutral);await feed(32,neutral);await feed(0,neutral);assert.equal(await app.evaluate(()=>global.__test.state().active),true,'custom keyboard action opens the system overlay');await feed(192,neutral);await feed(0,neutral);
 console.log('PASS dual global chord, 56 glyphs, no R3 leak, real a1b2c3d4 input, solo middle tap and modifier cleanup.');
 // Hand off foreground ownership before testing real settings clicks.
 target.stdin.write('yield\n');await until(()=>yielded,'fixture yields foreground');
 // Real A/B clicks on the application's own settings, with no practice listener.
 await app.evaluate(()=>global.__test.openSettings());await settings.locator('main').evaluate(e=>e.scrollTop=0);
 const settingsPacket=await app.evaluate(({BrowserWindow})=>({target:String(BrowserWindow.fromId(global.__test.settings).getNativeWindowHandle().readBigUInt64LE()),pid:process.pid}));
 await until(async()=>{const ready=await app.evaluate((_e,h)=>global.__test.packet()?.target===h,settingsPacket.target);if(!ready)target.stdin.write('activate:'+settingsPacket.target+'\n');return ready;},'settings foreground');
 const feedSettings=async buttons=>{await app.evaluate((_e,p)=>global.__test.feed(p),{...packet,...neutral,...settingsPacket,buttons});await new Promise(r=>setTimeout(r,80));};
 const moveTo=async selector=>{const rect=await settings.locator(selector).boundingBox();const pt=await app.evaluate(({BrowserWindow,screen},r)=>{const {x,y}=BrowserWindow.fromId(global.__test.settings).getContentBounds();return screen.dipToScreenPoint({x:Math.round(x+r.x+r.width/2),y:Math.round(y+r.y+r.height/2)});},rect);target.stdin.write('cursor:'+pt.x+','+pt.y+'\n');await new Promise(r=>setTimeout(r,120));};
 await feedSettings(0);await feedSettings(0);await moveTo('[data-tab="controller"]');await feedSettings(4096);await feedSettings(0);await settings.waitForFunction(()=>document.querySelector('[data-tab="controller"]').classList.contains('selected'));
 await settings.evaluate(()=>{window.rightClicks=0;document.addEventListener('contextmenu',e=>{e.preventDefault();window.rightClicks++;});});await feedSettings(8192);await feedSettings(0);assert.equal(await settings.evaluate(()=>window.rightClicks),1,'B right-click reaches settings DOM');
 const selectedBefore=await settings.locator('#preview-wheel .selected').evaluateAll(es=>es.map(e=>e.dataset.sector));await app.evaluate((_e,p)=>global.__test.feed(p),{...packet,...settingsPacket,buttons:192,x:1,y:0,rx:-1,ry:0});assert.equal(await app.evaluate(()=>global.__test.state().active),false);assert.deepEqual(await settings.locator('#preview-wheel .selected').evaluateAll(es=>es.map(e=>e.dataset.sector)),selectedBefore,'preview selection remains display-only');await feedSettings(0);
 await settings.locator('#chord-interval').fill('450');await settings.locator('#chord-interval').dispatchEvent('change');assert.equal((await settings.evaluate(()=>window.desktop.getAppearance())).chordInterval,450);await settings.locator('#chord-interval').fill('300');await settings.locator('#chord-interval').dispatchEvent('change');
 if(!await settings.locator('#bindings-editor').isVisible())await settings.locator('#custom-buttons').click();await settings.locator('[data-bind-mode="idle"]').click();await settings.locator('#binding-View').selectOption('layer:auxiliary');await settings.locator('[data-bind-layer="auxiliary"]').click();await settings.locator('#binding-Y').selectOption('key:mediaPlay');assert.equal((await settings.evaluate(()=>window.desktop.getAppearance())).auxiliaryBindings.idle.Y,'key:mediaPlay');await settings.locator('#reset-bindings').click();
 await settings.locator('main').evaluate(e=>e.scrollTop=0);const controllerShot=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.fromId(global.__test.settings).webContents.capturePage()).toPNG().toString('base64'));await writeFile('../../outputs/手柄设置-v05.2.png',Buffer.from(controllerShot,'base64'));
 await settings.locator('[data-tab="appearance"]').click();await settings.locator('main').evaluate(e=>e.scrollTop=0);const finalShot=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.fromId(global.__test.settings).webContents.capturePage()).toPNG().toString('base64'));await writeFile('../../outputs/设置面板-v05.2.png',Buffer.from(finalShot,'base64'));
 console.log('PASS physical SendInput A/B operate settings, inert preview, custom chord interval and auxiliary binding editor.');
 assert.deepEqual(errors,[]);console.log('PASS global L3 with settings left OPEN; real Windows SendInput into external textbox: abcd, backspace, space, Enter, Shift; focus preserved, hide/disconnect stop input.');
}finally{if(target){target.stdin.write('close\n');target.stdin.end();}await app.close();}

