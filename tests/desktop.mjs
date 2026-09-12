import {_electron as electron} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:['.','--test','--practice'],env,timeout:60000});
try {
 const page=await app.firstWindow();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.waitForSelector('body[data-ready="true"]');
 assert.equal(await page.locator('.disc-layer.active .letter').count(),28);
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 await page.evaluate(()=>{
  window.testPad={index:0,id:'Xbox (automated test)',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
   window.testTime=0;const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=callback=>raf(()=>callback(window.testTime));
   navigator.getGamepads=()=>[window.testPad];window.dispatchEvent(new Event('focus'));
 });
 await page.waitForFunction(()=>document.getElementById('connection-text').textContent==='Xbox 手柄已连接');
 const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 const axes=async(x,y)=>{await page.evaluate(([x,y])=>{window.testPad.axes=[x,y,0,0]},[x,y]);await settle();};
 const set=async(ids)=>{await page.evaluate(ids=>{window.testTime+=20;window.testPad.buttons.forEach((b,i)=>{b.pressed=ids.includes(i);b.value=b.pressed?1:0})},ids);await settle();};
 const tap=async(...ids)=>{await set(ids);await set([]);};
 const value=()=>page.locator('#editor').inputValue();
 await axes(.8,-.8);
 for(const index of [3,0,2,1])await tap(index);
 assert.equal(await value(),'abcd');
 await set([3]);await page.waitForTimeout(550);assert.equal(await value(),'abcda');await set([]);
 await tap(14);assert.equal(await value(),'abcd');
 await tap(12);await tap(15,3);assert.equal(await value(),'abcd A');
 await tap(13);assert.equal(await value(),'abcd A\n');
 await tap(9);assert.equal(await page.locator('[data-mode="1"]').getAttribute('aria-selected'),'true');
 await tap(1);assert.equal(await value(),'abcd A\nD');
 await tap(9);await tap(3);assert.equal(await value(),'abcd A\nD1');
 await tap(9);await axes(-.8,-.8);await tap(2);assert.equal(await value(),'abcd A\nD1,');
 await axes(0,-1);await tap(3);assert.equal(await value(),'abcd A\nD1,');
 // Blur must release Shift and block all controller input.
 await axes(.8,-.8);await set([15]);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 await set([15,3]);assert.equal(await value(),'abcd A\nD1,');
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await set([]);await tap(3);assert.equal(await value(),'abcd A\nD1,a');
 // Reconnection while a face button is held must not type until release.
 await page.evaluate(()=>{window.testPad=null});await page.waitForTimeout(80);
 await page.evaluate(()=>{window.testPad={index:0,id:'Xbox reconnected test',connected:true,mapping:'standard',axes:[.8,-.8,0,0],buttons:Array.from({length:17},(_,i)=>({pressed:i===3,value:i===3?1:0}))}});
 await page.waitForTimeout(80);assert.equal(await value(),'abcd A\nD1,a');await set([]);await tap(3);assert.equal(await value(),'abcd A\nD1,aa');
 assert.deepEqual(errors,[]);
 // Capture real application rendering, without synthetic connected status.
 await page.evaluate(()=>{window.testPad=null;const e=document.getElementById('editor');e.value='';e.dispatchEvent(new Event('input'));document.getElementById('last-action').textContent='等待输入';});
 await page.waitForTimeout(100);
 await mkdir('../../outputs',{recursive:true});
 await page.screenshot({path:path.resolve('../../outputs/原型界面.png')});
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(940,740));
 await page.waitForTimeout(100);
 const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth);
 assert.equal(fits,true,'minimum width should not horizontally overflow');
 console.log('PASS: desktop assets, 28 keys, Xbox mapping, hold edges, D-pad, Shift, all discs, neutral gap, blur pause, reconnect, minimum width. No renderer errors.');
} finally {await app.close();}
