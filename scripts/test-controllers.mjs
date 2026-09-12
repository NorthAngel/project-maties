import {execFileSync} from 'node:child_process';import path from 'node:path';
execFileSync('C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe',['/nologo','/target:exe','/platform:x64','/out:'+path.resolve('native/bin/ControllerBackendTests.exe'),path.resolve('tests/ControllerBackendTests.cs'),path.resolve('native/SdlNative.cs'),path.resolve('native/ControllerInput.cs')],{stdio:'inherit'});
execFileSync(path.resolve('native/bin/ControllerBackendTests.exe'),[],{stdio:'inherit'});
