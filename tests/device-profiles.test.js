import test from 'node:test';
import assert from 'node:assert/strict';
import {deviceKey,getDeviceProfile,setDeviceProfile} from '../src/device-profiles.js';
test('stable identity survives reconnection and isolates same-model controllers',()=>{
 const a={id:'sdl:1',guid:'model',serial:'a'},b={id:'sdl:2',guid:'model',serial:'b'};
 const config=setDeviceProfile({},a,{deadzoneLeft:20});
 assert.equal(getDeviceProfile(config,{...a,id:'sdl:9'}).deadzoneLeft,20);
 assert.equal(getDeviceProfile(config,b).deadzoneLeft,10);
 assert.notEqual(deviceKey(a),deviceKey(b));
});
test('missing hardware identity does not persist unstable slots',()=>{
 assert.equal(deviceKey({id:'sdl:1',guid:'model'}),deviceKey({id:'sdl:7',guid:'model'}));
 assert.equal(deviceKey({guid:'xinput:0',backend:'XInput'}),deviceKey({guid:'xinput:3',backend:'XInput'}));
 assert.deepEqual(setDeviceProfile({},null,{deadzoneLeft:30}).profiles,{});
});
