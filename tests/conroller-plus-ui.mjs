import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {normalizeAppearance} from '../src/appearance.js';
const root=process.cwd();
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep))throw Error();const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]??'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:893,height:917}});page.setDefaultTimeout(5000);
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
 await page.addInitScript(a=>{
  const listeners={};let runtime={connected:true,device:{id:'one',kind:'xbox',name:'Xbox 360 Controller'},devices:[],layout:'single'},system={locale:'en',theme:'light'};window.calls=[];
  const on=name=>callback=>{listeners[name]=callback;return()=>{};};
  window.feedRuntime=patch=>{runtime={...runtime,...patch};listeners.runtime?.(runtime);};
  window.desktop={getAppearance:async()=>a,getRuntime:async()=>runtime,getSystem:async()=>system,onRuntime:on('runtime'),onAppearance:on('appearance'),onSystem:on('system'),onController:on('controller'),
   setAppearance:async patch=>{window.calls.push(patch);a={...a,...patch};listeners.appearance?.(a);return a;},
   setSystem:async patch=>{system={...system,...patch};listeners.system?.(system);return system;},windowAction:async action=>window.calls.push({window:action}),controllerAction:async()=>({ok:true}),systemAction:async()=>({ok:true,available:false})};
 },normalizeAppearance());
 await page.goto('http://127.0.0.1:'+server.address().port+'/settings.html');
 await page.waitForSelector('body[data-ready="true"]');
 await page.locator('[data-tab="controller"]').click();
 await page.locator('[data-bind-mode="typing"]').click();
 assert.equal(await page.locator('[data-physical="A"]').isDisabled(),true);
 assert.equal(await page.locator('[data-physical="LT"]').isDisabled(),false);
 await page.locator('[data-physical="LT"]').click();
 await page.getByRole('option',{name:'Switch left wheel',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.calls.at(-1).bindings.typing.LT),'cycleLeft');
 await page.evaluate(()=>window.feedRuntime({connected:false}));
 assert.equal(await page.locator('[data-physical="LT"]').isDisabled(),true);
 assert.equal(await page.locator('[data-action="update"]').isDisabled(),false);
 await page.locator('[data-action="start"]').click();
 assert.equal(await page.evaluate(()=>window.calls.at(-1).window),'hide');
 await page.locator('[data-tab="appearance"]').click();
 await page.evaluate(()=>window.feedRuntime({connected:true}));
 await page.screenshot({path:'.superpowers/sdd/2026-09-21-conroller-plus/settings-new.png'});
 await page.locator('[data-opacity="0"]').click();
 await page.waitForTimeout(250);
 await page.screenshot({path:'.superpowers/sdd/2026-09-21-conroller-plus/v1.1-frosted.png'});
 await page.locator('[data-tab="controller"]').click();
 await page.screenshot({path:'.superpowers/sdd/2026-09-21-conroller-plus/v1.1-controller.png'});
 assert.equal(await page.locator('.binding-row i').first().evaluate(el=>getComputedStyle(el).maskRepeat),'no-repeat');
 assert.equal(await page.locator('.binding-row i').first().evaluate(el=>getComputedStyle(el).maskSize),'contain');
 assert.equal(await page.locator('.letter path[fill]').first().evaluate(el=>getComputedStyle(el).fill),'rgba(0, 0, 0, 0.65)');
 assert.equal(await page.locator('.version').textContent(),'v1.1');
 await page.locator('[data-action="language"]').click();
 assert.equal(await page.locator('[data-action="language"]').getAttribute('aria-expanded'),'true');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('[data-action="language"]').getAttribute('aria-expanded'),'false');
 assert.deepEqual(errors,[]);
 console.log('Conroller Plus UI: bindings, disconnected restrictions, tray action and appearance rendering passed');
}finally{await browser.close();await new Promise(r=>server.close(r));}
