import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:process.env.PROTOTYPE_EXE?['--test']:['.','--test'],env,...(process.env.PROTOTYPE_EXE?{executablePath:process.env.PROTOTYPE_EXE}:{}),timeout:60000});
const errors=[],evidence=[];await mkdir('tests/artifacts-v05.5',{recursive:true});
const luminance=color=>{const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(c=>{const n=c/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
try{
 let page;for(let n=0;n<120&&!page;n++){page=app.windows().find(w=>w.url().endsWith('settings.html'));if(!page)await new Promise(r=>setTimeout(r,100));}
 assert.ok(page);page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('body[data-ready="true"]');await app.evaluate(()=>global.__test.openSettings());
 assert.equal(await page.locator('.sidebar-bottom').count(),0);
 assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.fromId(global.__test.settings).isMaximizable()),false);
 await page.locator('[data-tab="system"]').click();
 for(const locale of ['zh-CN','zh-TW','en','ja','fr','de','it','es']){
  for(const theme of ['light','dark']){
   await page.evaluate(v=>window.desktop.setSystem(v),{locale,theme});
   await page.waitForFunction(v=>document.documentElement.lang===v.locale&&document.documentElement.dataset.theme===v.theme,{locale,theme});await page.waitForTimeout(100);
   const visual=await page.evaluate(()=>({title:document.querySelector('#page-title').textContent,bg:getComputedStyle(document.body).backgroundColor,fg:getComputedStyle(document.body).color,overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('[data-panel="system"] button')].filter(x=>x.getClientRects().length).map(x=>x.textContent.trim())}));
   assert.equal(visual.overflow,false,`${locale}/${theme} fits window`);assert.ok(visual.title.trim());assert.ok(visual.buttons.every(x=>x.length));
   const light=luminance(visual.bg),dark=luminance(visual.fg);assert.ok((Math.max(light,dark)+.05)/(Math.min(light,dark)+.05)>=4.5,`${locale}/${theme} readable body contrast`);
   evidence.push({locale,theme,...visual});await page.screenshot({path:`tests/artifacts-v05.5/system-${locale}-${theme}.png`});
   if(locale==='zh-CN')await page.screenshot({path:`../../outputs/系统设置-${theme==='dark'?'深色':'浅色'}-v05.5.png`});
  }
 }
 assert.notEqual(evidence[0].bg,evidence[1].bg,'theme changes actual canvas');assert.notEqual(evidence[0].fg,evidence[1].fg,'theme changes foreground');
 assert.equal(new Set(evidence.filter(x=>x.theme==='light').map(x=>x.title)).size,8,'system title is translated into eight languages');
 await page.evaluate(()=>window.desktop.setSystem({locale:'zh-CN',theme:'light',closeBehavior:'tray'}));
 await page.locator('#done').click();await page.waitForTimeout(250);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.fromId(global.__test.settings).isMinimized()),true,'top button minimizes');
 await app.evaluate(()=>global.__test.openSettings());assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.fromId(global.__test.settings).isMinimized()),false,'tray reopens minimized window');
 await page.evaluate(()=>window.desktop.windowAction('close'));await page.waitForTimeout(100);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.fromId(global.__test.settings).isVisible()),false,'close hides to tray');
 await app.evaluate(()=>global.__test.openSettings());await page.evaluate(()=>window.desktop.setSystem({closeBehavior:'minimize'}));await page.evaluate(()=>window.desktop.windowAction('close'));await page.waitForTimeout(100);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.fromId(global.__test.settings).isMinimized()),true,'configured close minimizes');await app.evaluate(()=>global.__test.openSettings());
 const systemLight=await page.evaluate(()=>window.desktop.setSystem({theme:'system'}));assert.equal(systemLight.theme,'system');
 for(const dark of [true,false]){await app.evaluate(({nativeTheme},dark)=>{nativeTheme.themeSource=dark?'dark':'light';},dark);await page.waitForFunction(dark=>document.documentElement.dataset.theme===(dark?'dark':'light'),dark);}
 await page.evaluate(()=>window.desktop.setSystem({theme:'light'}));
 const diagnostic=await page.evaluate(()=>window.desktop.systemAction({action:'diagnose'}));assert.equal(diagnostic.ok,true);assert.equal(diagnostic.code,'diagnostics-ok');assert.equal(diagnostic.details.checks.length,3);assert.equal(diagnostic.details.serviceRunning,true);
 const oldPid=await app.evaluate(()=>global.__test.helperPid());const repair=await page.evaluate(()=>window.desktop.systemAction({action:'repair'}));assert.equal(repair.ok,true);assert.equal(repair.code,'repair-ok');assert.notEqual(await app.evaluate(()=>global.__test.helperPid()),oldPid,'repair genuinely restarts helper');assert.equal((await app.evaluate(()=>global.__test.state())).error,'');
 if(process.env.PROTOTYPE_EXE){
  const dll=path.join(path.dirname(process.env.PROTOTYPE_EXE),'resources/app/native/bin/SDL3.dll'),original=await readFile(dll);
  await app.evaluate(()=>process.kill(global.__test.helperPid()));await page.waitForTimeout(400);
  try{await writeFile(dll,'isolated repair test corruption');const broken=await page.evaluate(()=>window.desktop.systemAction({action:'diagnose'}));assert.equal(broken.code,'diagnostics-issues');const restored=await page.evaluate(()=>window.desktop.systemAction({action:'repair'}));assert.equal(restored.ok,true);assert.ok(restored.details.restoredFiles.includes('SDL3.dll'));assert.deepEqual(await readFile(dll),original);assert.equal((await page.evaluate(()=>window.desktop.systemAction({action:'diagnose'}))).code,'diagnostics-ok');}
  finally{if(!(await readFile(dll)).equals(original)){await app.evaluate(()=>{try{process.kill(global.__test.helperPid());}catch{}});await page.waitForTimeout(400);await writeFile(dll,original);}}
 }
 await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>({canceled:true,filePaths:[]});});const update=await page.evaluate(()=>window.desktop.systemAction({action:'update'}));assert.equal(update.code,'update-cancelled');
 await app.evaluate(({dialog})=>{dialog.showOpenDialog=async()=>{process.kill(global.__test.helperPid());await new Promise(r=>setTimeout(r,300));return {canceled:true,filePaths:[]};};});await page.evaluate(()=>window.desktop.systemAction({action:'update'}));assert.ok((await app.evaluate(()=>global.__test.state())).error,'unexpected service exit during update is reported');assert.equal((await page.evaluate(()=>window.desktop.systemAction({action:'repair'}))).ok,true);
 if(process.env.PROTOTYPE_EXE){await app.evaluate(({dialog},folder)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});},path.dirname(process.env.PROTOTYPE_EXE));assert.equal((await page.evaluate(()=>window.desktop.systemAction({action:'update'}))).code,'update-not-newer');}
 await page.locator('[data-tab="appearance"]').click();
 for(const theme of ['light','dark']){await page.evaluate(theme=>window.desktop.setSystem({theme}),theme);await page.waitForTimeout(250);await page.screenshot({path:`../../outputs/转盘外观-${theme==='dark'?'深色':'浅色'}-v05.5.png`});}
 assert.deepEqual(errors,[]);await writeFile('tests/artifacts-v05.5/system-report.json',JSON.stringify({evidence,diagnostic,repair,update,errors},null,2));
 console.log('PASS eight locales × two themes, native system theme propagation, actual minimize/tray behaviors, dependency diagnosis, helper restart, cancelled/same-version update, no renderer errors.');
}finally{await app.close();}
