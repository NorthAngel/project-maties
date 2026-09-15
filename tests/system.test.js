import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
const modules=()=>import('../src/system.js');
test('system preferences whitelist values and preserve all eight locales',async()=>{
 const {normalizeSystem}=await modules();
 for(const locale of ['zh-CN','zh-TW','en','ja','fr','de','it','es'])assert.equal(normalizeSystem({locale}).locale,locale);
 assert.deepEqual(normalizeSystem({theme:'evil',locale:'bad',startAtLogin:'true',closeBehavior:'delete'}),{schemaVersion:1,locale:'zh-CN',theme:'system',startAtLogin:false,closeBehavior:'tray'});
 assert.equal(normalizeSystem({theme:'dark',startAtLogin:true,closeBehavior:'minimize'}).theme,'dark');
});
test('portable update verifies product, every hash, version and rejects traversal',async()=>{
 const {verifyRelease,REQUIRED_RELEASE_FILES}=await import('../maintenance.cjs');
 const root=await mkdtemp(path.join(tmpdir(),'cc-update-'));const bytes=Buffer.alloc(128);bytes.writeUInt16LE(0x5a4d,0);bytes.writeUInt32LE(64,60);bytes.writeUInt32LE(0x4550,64);bytes.writeUInt16LE(0x8664,68);
 const hash=createHash('sha256').update(bytes).digest('hex');
 const manifest={product:'ControllerCompanion',version:'0.5.6',files:{'ControllerCompanion.exe':hash,'resources/app/package.json':''}};
 try{
  await mkdir(path.join(root,'resources/app'),{recursive:true});
  await writeFile(path.join(root,'ControllerCompanion.exe'),bytes);
  const pkg=JSON.stringify({name:'controller-companion-prototype',version:'0.5.6',main:'desktop.cjs'});
  await writeFile(path.join(root,'resources/app/package.json'),pkg);manifest.files['resources/app/package.json']=createHash('sha256').update(pkg).digest('hex');
  for(const file of REQUIRED_RELEASE_FILES.filter(f=>!manifest.files[f])){await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),bytes);manifest.files[file]=hash;}
  const save=()=>writeFile(path.join(root,'release-manifest.json'),JSON.stringify(manifest));await save();
  assert.equal((await verifyRelease(root,'0.5.5')).version,'0.5.6');
  const required=manifest.files['resources/app/desktop.cjs'];delete manifest.files['resources/app/desktop.cjs'];await save();await assert.rejects(verifyRelease(root,'0.5.5'),/update-manifest/);manifest.files['resources/app/desktop.cjs']=required;await save();
  const renderer=manifest.files['resources/app/src/i18n.js'];delete manifest.files['resources/app/src/i18n.js'];await save();await assert.rejects(verifyRelease(root,'0.5.5'),/update-manifest/);manifest.files['resources/app/src/i18n.js']=renderer;await save();
  await writeFile(path.join(root,'release-manifest.json'),'broken json');await assert.rejects(verifyRelease(root,'0.5.5'),/update-manifest/);await save();
  await assert.rejects(verifyRelease(root,'0.5.6'),/update-not-newer/);
  await writeFile(path.join(root,'ControllerCompanion.exe'),'corrupted');await assert.rejects(verifyRelease(root,'0.5.5'),/update-integrity/);
  await writeFile(path.join(root,'ControllerCompanion.exe'),bytes);manifest.files['../outside']=hash;await save();await assert.rejects(verifyRelease(root,'0.5.5'),/update-path/);
  delete manifest.files['../outside'];manifest.product='Other';await save();await assert.rejects(verifyRelease(root,'0.5.5'),/update-product/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('repair checks backup before replacing missing or damaged native components',async()=>{
 const {repairNative,diagnoseNative}=await import('../maintenance.cjs');const root=await mkdtemp(path.join(tmpdir(),'cc-repair-'));
 try{await mkdir(path.join(root,'recovery'),{recursive:true});await mkdir(path.join(root,'native/bin'),{recursive:true});
  const files={};for(const name of ['ControllerBridge.exe','SDL3.dll','gamecontrollerdb.txt']){const data='verified '+name;files[name]=createHash('sha256').update(data).digest('hex');await writeFile(path.join(root,'recovery',name),data);}
  await writeFile(path.join(root,'recovery/manifest.json'),JSON.stringify({files}));
  assert.equal((await diagnoseNative(root)).every(x=>!x.ok),true);assert.equal((await repairNative(root)).length,3);assert.equal((await diagnoseNative(root)).every(x=>x.ok),true);
  await writeFile(path.join(root,'native/bin/SDL3.dll'),'bad');await writeFile(path.join(root,'recovery/SDL3.dll'),'bad backup');await assert.rejects(repairNative(root),/repair-backup/);
 }finally{await rm(root,{recursive:true,force:true});}
});
