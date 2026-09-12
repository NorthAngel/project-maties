import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {FIGMA_LAYOUT} from '../src/figma-layout.js';
const report=JSON.parse((await readFile('artifacts/latest-build.json','utf8')).replace(/^\uFEFF/,''));
const root=path.resolve(process.argv[2]||report.appDirectory);
const manifest=JSON.parse((await readFile(path.join(root,'release-manifest.json'),'utf8')).replace(/^\uFEFF/,''));
if(manifest.product!=='ControllerCompanion'||manifest.host!=='webview2')throw Error('Wrong package identity');
const expected=new Set(['ControllerCompanion.exe','ControllerCompanion.exe.config','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.Wpf.dll','WebView2Loader.dll','recovery.zip','web/settings.html','web/overlay.html','web/native-translations.json','native/ControllerBridge.exe','native/SDL3.dll','native/gamecontrollerdb.txt']);
const dependencies=['activation.js','appearance.js','calibration.js','controls.js','figma-layout.js','i18n.js','overlay.js','overlay.css','pointer.js','radial.js','runtime-engine.js','runtime-entry.js','webview-bridge.js','session.js','settings.js','settings.css','system.js','theme.js','wheel-view.js','wheel.css'];
for(const f of dependencies)expected.add('web/src/'+f);
for(const disc of FIGMA_LAYOUT)for(const sector of disc)for(const node of sector)expected.add('web/'+node.asset.replace(/^\.\//,''));
let bytes=0;
const hash=data=>createHash('sha256').update(data).digest('hex');
for(const name of expected)if(!manifest.files[name])throw Error('Missing dependency: '+name);
for(const [name,digest]of Object.entries(manifest.files)){
 if(name.includes('..')||name.includes('\\')||path.isAbsolute(name)||name.includes(':'))throw Error('Unsafe manifest path');
 const content=await readFile(path.join(root,name));bytes+=content.length;
 if(hash(content)!==digest)throw Error('Hash mismatch: '+name);
 if(name.startsWith('web/assets/exact/')){const original=await readFile(name.slice(4));if(hash(original)!==digest)throw Error('Wheel artwork changed: '+name);}
}
async function walk(dir,prefix=''){for(const e of await readdir(dir,{withFileTypes:true})){const name=prefix+e.name;if(e.isSymbolicLink())throw Error('Package contains link');if(e.isDirectory()){if(/user-data|node_modules|WebView2$/i.test(e.name))throw Error('Development/user directory bundled: '+name);await walk(path.join(dir,e.name),name+'/');}else if(name!=='release-manifest.json'&&!manifest.files[name])throw Error('Untracked package file: '+name);}}
await walk(root);
if(bytes>15*1024*1024)throw Error('Package exceeded 15 MiB dependency budget');
const executable=await readFile(path.join(root,'ControllerCompanion.exe'));const pe=executable.readUInt32LE(60);if(executable.readUInt16LE(0)!==0x5a4d||executable.readUInt16LE(pe+4)!==0x8664)throw Error('Host is not Windows x64');
console.log(JSON.stringify({verified:true,version:manifest.version,files:Object.keys(manifest.files).length,requiredDependencies:expected.size,installedBytes:(await stat(path.join(root,'release-manifest.json'))).size+bytes,wheelAssetsUnchanged:true},null,2));
