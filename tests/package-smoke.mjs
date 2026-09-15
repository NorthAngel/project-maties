import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const executablePath=path.resolve('../../outputs/ControllerCompanion-Prototype-v02/ControllerCompanion.exe');
const app=await electron.launch({executablePath,args:['--test','--practice'],env,timeout:60000});
try{
 const page=await app.firstWindow();await page.waitForSelector('body[data-ready="true"]');await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 assert.equal(await page.locator('.disc-layer.active .letter').count(),28);
 await page.locator('.disc-layer.active .sector[data-sector="0"] .letter[data-slot="0"]').click();
 assert.equal(await page.locator('#editor').inputValue(),'a');
 await page.locator('[data-mode="2"]').click();
 assert.equal(await page.locator('.disc-layer.active .sector[data-sector="6"] .letter[data-slot="3"]').getAttribute('data-character'),'>');
 await page.locator('[data-mode="0"]').click();
 await page.evaluate(()=>{const t=document.getElementById('editor');t.value='';t.dispatchEvent(new Event('input'));document.getElementById('last-action').textContent='等待输入';});
 await page.waitForTimeout(300);
 const png=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined,{stayHidden:true,stayAwake:true})).toPNG().toString('base64'));
 await writeFile(path.resolve('../../outputs/原型界面.png'),Buffer.from(png,'base64'));
 for(const [w,h] of [[1280,900],[940,740]]){
   await app.evaluate(({BrowserWindow},[w,h])=>BrowserWindow.getAllWindows()[0].setSize(w,h),[w,h]);
   await page.waitForTimeout(200);
   const fit=await page.evaluate(()=>{
     const rects=[...document.querySelectorAll('.disc-footer,.text-actions,.guide,footer')].map(e=>e.getBoundingClientRect());
     return {width:innerWidth,height:innerHeight,fit:rects.every(r=>r.bottom<=innerHeight+1&&r.right<=innerWidth+1)};
   });
   assert.equal(fit.fit,true,JSON.stringify(fit));
 }
 assert.deepEqual(errors,[]);
 console.log('PASS packaged executable: launch, local assets, mouse input, mode switch, 1280x900 and 940x740 layout, no renderer errors.');
}finally{await app.close();}
