import {execFileSync} from 'node:child_process';
import {mkdirSync,copyFileSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
mkdirSync('native/bin',{recursive:true});
execFileSync('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe',['/nologo','/target:exe','/platform:x64','/reference:System.Web.Extensions.dll','/out:'+path.resolve('native/bin/ControllerBridge.exe'),path.resolve('native/Bridge.cs'),path.resolve('native/Ime.cs'),path.resolve('native/SdlNative.cs'),path.resolve('native/ControllerInput.cs')],{stdio:'inherit'});

for(const name of ['SDL3.dll','gamecontrollerdb.txt','SDL-LICENSE.txt','GameControllerDB-LICENSE.txt','provenance.json'])copyFileSync('native/vendor/'+name,'native/bin/'+name);
mkdirSync('recovery',{recursive:true});const files={};for(const name of ['ControllerBridge.exe','SDL3.dll','gamecontrollerdb.txt']){copyFileSync('native/bin/'+name,'recovery/'+name);files[name]=createHash('sha256').update(readFileSync('recovery/'+name)).digest('hex');}writeFileSync('recovery/manifest.json',JSON.stringify({files},null,2));
