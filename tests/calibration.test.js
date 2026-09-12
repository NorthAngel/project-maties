import test from 'node:test';import assert from 'node:assert/strict';import {Calibration,validMapping,CALIBRATION_STEPS} from '../src/calibration.js';
const guid='00000000000000000000000000000001';const raw=()=>({axes:[0,0,0,0,-1,0],buttons:Array(16).fill(false),hats:[0]});
test('HID calibration detects reversed and reordered axes, face keys and a hat, waits for release',()=>{
 const c=new Calibration('sdl:1',guid),neutral=raw();c.feed('sdl:1',neutral);
 for(const [index,value] of [[2,-1],[3,1],[0,1],[1,-1]]){const r=raw();r.axes[index]=value;c.feed('sdl:1',r);assert.equal(c.waitRelease,true);const step=c.index;c.feed('sdl:1',r);assert.equal(c.index,step);c.feed('sdl:1',neutral);}
 for(const index of [7,6,5,4,9,8]){const r=raw();r.buttons[index]=true;c.feed('sdl:1',r);c.feed('sdl:1',neutral);}
 for(const value of [1,4,8,2]){const r=raw();r.hats[0]=value;c.feed('sdl:1',r);c.feed('sdl:1',neutral);}
 for(const index of [11,10,12,13]){const r=raw();r.buttons[index]=true;c.feed('sdl:1',r);c.feed('sdl:1',neutral);}
 let r=raw();r.axes[4]=1;c.feed('sdl:1',r);c.feed('sdl:1',neutral);r=raw();r.axes[5]=1;c.feed('sdl:1',r);c.feed('sdl:1',neutral);
 assert.equal(c.done,true);assert.equal(c.bindings.leftx,'a2~');assert.equal(c.bindings.righty,'a1~');assert.equal(c.bindings.dpup,'h0.1');assert.equal(c.bindings.lefttrigger,'a4');assert.equal(c.bindings.righttrigger,'+a5');assert.equal(validMapping(guid,c.mapping()),true);
});
test('unknown input is not guessed; different device, duplicate axes and required-step skip are rejected',()=>{
 const c=new Calibration('sdl:1',guid);assert.equal(c.feed('sdl:2',raw()),false);assert.equal(c.skip(),false);assert.throws(()=>c.mapping());c.feed('sdl:1',raw());let r=raw();r.axes[0]=1;r.axes[1]=1;assert.equal(c.feed('sdl:1',r),false);r=raw();r.axes[0]=1;c.feed('sdl:1',r);c.feed('sdl:1',raw());assert.equal(c.feed('sdl:1',r),false);
});
test('mapping validator blocks malformed and incomplete persisted mappings',()=>{for(const value of ['',guid+',Bad name,a:b0,',guid+',Controller Companion,leftx:a0,lefty:a1,a:b0,b:b1,x:b2,y:b3,guide:b5,',guid+',Controller Companion,leftx:a0,lefty:a1,a:b0,b:b1,x:b2,y:b3,a:b4,'])assert.equal(validMapping(guid,value),false);});
