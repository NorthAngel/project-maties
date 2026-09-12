import {_electron as electron} from 'playwright';import assert from 'node:assert/strict';import path from 'node:path';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const root=path.resolve('../../outputs/ControllerCompanion-Prototype-v05.2'),env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const app=await electron.launch({executablePath:path.join(root,'ControllerCompanion.exe'),args:['--test'],env,timeout:60000});
try{
 for(let n=0;n<100;n++){if(await app.evaluate(()=>!!global.__test))break;await new Promise(r=>setTimeout(r,100));}
 const p=app.windows().find(w=>w.url().endsWith('settings.html'));await p.waitForSelector('body[data-ready="true"]');await p.waitForTimeout(5500);
 const s=await app.evaluate(()=>global.__test.state());assert.equal(s.error,'');assert.equal(s.backend,'SDL3');assert.equal(s.active,false);assert.equal(await p.locator('#controller-select').count(),1);
 assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().every(w=>!w.isVisible())),true,'smoke stays hidden');
 for(const f of ['desktop.cjs','src/calibration.js','native/bin/ControllerBridge.exe','native/bin/SDL3.dll','native/bin/gamecontrollerdb.txt']){const hash=async name=>createHash('sha256').update(await readFile(name)).digest('hex');assert.equal(await hash(f),await hash(path.join(root,'resources/app',f)),f);}
 console.log('PASS packaged v5.2 hidden launch, SDL3 initialization, startup IPC, local UI, runtime files match working source.');
}finally{await app.close();}
