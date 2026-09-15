import {_electron as electron} from 'playwright';import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({args:process.env.PROTOTYPE_EXE?['--test']:['.','--test'],env,...(process.env.PROTOTYPE_EXE?{executablePath:process.env.PROTOTYPE_EXE}:{})});
try{
 let page;for(let n=0;n<100&&!page;n++){page=app.windows().find(w=>w.url().endsWith('settings.html'));if(!page)await new Promise(r=>setTimeout(r,100));}page.on('pageerror',e=>console.log('RENDERER ERROR',e.message));await page.waitForSelector('body[data-ready="true"]');await app.evaluate(()=>global.__test.openSettings());await page.locator('[data-tab="controller"]').click();
 const device={id:'sdl:999',guid:'00000000000000000000000000000001',name:'DualSense · 测试设备',kind:'playstation',backend:'SDL3',mapped:true};
 await app.evaluate((_e,d)=>global.__test.mockControllers([d]),device);await page.waitForFunction(()=>document.querySelector('[data-quick="Y"] b').textContent==='△');assert.equal(await page.locator('[data-quick="A"] b').textContent(),'×');await page.locator('#custom-buttons').click();assert.equal(await page.locator('label[for="binding-LB"]').textContent(),'L1');await page.locator('#custom-buttons').click();
 await page.locator('#calibrate').click();await page.locator('#calibration-start').click();await page.waitForFunction(()=>document.querySelector('#calibration-start').hidden);assert.equal((await app.evaluate(()=>global.__test.state())).calibrating,true);
 const neutral={axes:[0,0,0,0,-1,-1],buttons:Array(16).fill(false),hats:[0]};
 const raw=async r=>{await app.evaluate((_e,p)=>global.__test.rawController(p),{connected:true,x:0,y:0,device,raw:r});await page.waitForTimeout(25);};await raw(neutral);
 for(let i=0;i<4;i++){const r=structuredClone(neutral);r.axes[i]=1;await raw(r);await raw(neutral);}
 for(let i=0;i<6;i++){const r=structuredClone(neutral);r.buttons[i]=true;await raw(r);await raw(neutral);}
 for(const v of [1,4,8,2]){const r=structuredClone(neutral);r.hats[0]=v;await raw(r);await raw(neutral);}
 for(let i=6;i<10;i++){const r=structuredClone(neutral);r.buttons[i]=true;await raw(r);await raw(neutral);}
 for(let i=4;i<6;i++){const r=structuredClone(neutral);r.axes[i]=1;await raw(r);await raw(neutral);}
 await page.waitForFunction(()=>!document.querySelector('#calibration-save').hidden);assert.equal(await page.locator('#calibration-progress').getAttribute('value'),'20');await page.screenshot({path:'../../outputs/手柄校准-v05.5.png'});await page.locator('#calibration-save').click();await page.waitForFunction(()=>!document.querySelector('#calibration-dialog').open);assert.equal((await app.evaluate(()=>global.__test.state())).calibrating,false);const config=await app.evaluate(()=>global.__test.controllerConfig());assert.ok(config.mappings[device.guid].includes('dpup:h0.1'));
 await page.locator('#reset-controller').click();await page.waitForFunction(()=>document.querySelector('#controller-support').textContent.includes('需要校准'));assert.deepEqual((await app.evaluate(()=>global.__test.controllerConfig())).mappings,{});
 await page.locator('#calibrate').click();await page.locator('#calibration-start').click();await page.waitForFunction(()=>document.querySelector('#calibration-start').hidden);await page.locator('#calibration-cancel').click();assert.equal((await app.evaluate(()=>global.__test.state())).calibrating,false);
 await page.locator('#calibrate').click();await app.evaluate(()=>global.__test.mockControllers([]));await page.waitForFunction(()=>!document.querySelector('#calibration-dialog').open);
 await app.evaluate((_e,d)=>global.__test.mockControllers([d]),device);await page.locator('main').evaluate(e=>e.scrollTop=0);await page.screenshot({path:'../../outputs/手柄设置-v05.5.png'});
 assert.equal((await app.evaluate(()=>global.__test.state())).error,'');console.log('PASS PlayStation labels, 20-step calibration UI, save/reset, cancel, unplug dismissal, clean startup IPC.');
}finally{await app.close();}
