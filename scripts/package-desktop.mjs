import {cp,mkdir,rename,writeFile,readFile,readdir,rm,mkdtemp} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const {hashFile}=createRequire(import.meta.url)('../maintenance.cjs');
const version=JSON.parse(await readFile('package.json','utf8')).version,tag='v'+version.replace(/^0\./,'0');
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Invalid package version');
const outputs=path.resolve('../../outputs');await mkdir(outputs,{recursive:true});
const staging=await mkdtemp(path.join(outputs,'ControllerCompanion-stage-'));
const out=path.join(staging,'ControllerCompanion-Prototype-'+tag);
await mkdir(out,{recursive:true});
await cp('node_modules/electron/dist',out,{recursive:true});
await rename(path.join(out,'electron.exe'),path.join(out,'ControllerCompanion.exe'));
execFileSync('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe',['/nologo','/out:'+path.resolve('native/bin/IconResource.exe'),path.resolve('scripts/IconResource.cs')]);
execFileSync(path.resolve('native/bin/IconResource.exe'),[path.join(out,'ControllerCompanion.exe'),path.resolve('assets/app-icon.ico')]);
const app=path.join(out,'resources/app');await mkdir(app,{recursive:true});
for(const name of ['overlay.html','settings.html','src','assets','desktop.cjs','preload.cjs','maintenance.cjs','recovery','LICENSE'])await cp(name,path.join(app,name),{recursive:true});
await mkdir(path.join(app,'native/bin'),{recursive:true});for(const name of ['ControllerBridge.exe','SDL3.dll','gamecontrollerdb.txt','SDL-LICENSE.txt','GameControllerDB-LICENSE.txt','provenance.json'])await cp('native/bin/'+name,path.join(app,'native/bin',name));
await writeFile(path.join(app,'package.json'),JSON.stringify({name:'controller-companion-prototype',version,main:'desktop.cjs',type:'module'}));
await cp('PROTOTYPE-README.md',path.join(out,'使用说明.md'));
const source=path.join(staging,'ControllerCompanion-Source-'+tag);await mkdir(source,{recursive:true});
for(const name of ['index.html','overlay.html','settings.html','src','assets','desktop.cjs','preload.cjs','maintenance.cjs','recovery','LICENSE','package.json','package-lock.json','PROTOTYPE-README.md','README.md','tests','scripts','vite.config.js','ControllerCompanion.sln','docs'])await cp(name,path.join(source,name),{recursive:true});
await mkdir(path.join(source,'native/bin'),{recursive:true});for(const name of ['Bridge.cs','Ime.cs','SdlNative.cs','ControllerInput.cs','ControllerBridge.csproj','bin/ControllerBridge.exe','vendor'])await cp(path.join('native',name),path.join(source,'native',name),{recursive:true});
const files={};async function walk(dir,relative=''){for(const e of await readdir(dir,{withFileTypes:true})){const key=relative+e.name;if(e.isDirectory()){if(e.name==='user-data-test')continue;await walk(path.join(dir,e.name),key+'/');}else if(key!=='release-manifest.json')files[key]=await hashFile(path.join(dir,e.name));}}
await walk(out);await writeFile(path.join(out,'release-manifest.json'),JSON.stringify({product:'ControllerCompanion',version,files},null,2));
// Build into fresh folders: removed source files cannot survive into a later package.
// Validate every final absolute path before replacing a same-version deliverable.
const swaps=[];
try{
 for(const built of [out,source]){
  const final=path.join(outputs,path.basename(built)),relative=path.relative(outputs,final);
  if(!/^ControllerCompanion-(Prototype|Source)-v\d+(?:\.\d+){1,2}$/.test(relative)||path.isAbsolute(relative)||relative.includes(path.sep))throw Error('Invalid package output path');
  const backup=path.join(staging,path.basename(built)+'.previous');let existed=false;
  try{await rename(final,backup);existed=true;}catch(e){if(e.code!=='ENOENT')throw e;}
  const swap={built,final,backup,existed,installed:false};swaps.push(swap);
  await rename(built,final);swap.installed=true;
 }
}catch(error){
 for(const swap of swaps.reverse()){if(swap.installed)await rename(swap.final,swap.built);if(swap.existed)await rename(swap.backup,swap.final);}
 throw error;
}
for(const {backup,existed} of swaps){if(existed){if(path.dirname(backup)!==staging)throw Error('Invalid previous package path');await rm(backup,{recursive:true,force:true});}}
if(path.dirname(staging)!==outputs||!path.basename(staging).startsWith('ControllerCompanion-stage-'))throw Error('Invalid staging path');await rm(staging,{recursive:true,force:true});
console.log(path.join(outputs,path.basename(out)));
