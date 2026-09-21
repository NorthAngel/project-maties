import test from 'node:test';
import assert from 'node:assert/strict';
import {InputSession,BUTTONS as B} from '../src/session.js';
import {normalizeAppearance} from '../src/appearance.js';

const packet={connected:true,slot:0,buttons:0,x:.8,y:-.8,rx:.8,ry:-.8,target:'100',pid:999};
const dualPreview=normalizeAppearance({keyboardMode:'dual'});
function setup(settings=dualPreview){const s=new InputSession();s.step(packet,0,settings);s.step(packet,1,settings);return s;}

test('L3 uses saved dual mode immediately; next press closes',()=>{
 const s=setup();
 assert.equal(s.step({...packet,buttons:64},10,dualPreview).toggled,true);
 assert.equal(s.layout,'dual');assert.equal(s.target,'100');
 s.step(packet,20,dualPreview);
 s.step({...packet,buttons:64},30,dualPreview);
 assert.equal(s.active,false);
});

test('triple R3 result requests IME cycling and emits no pointer click',()=>{
 const s=setup();
 const times=[[B.R3,0],[0,40],[B.R3,140],[0,180],[B.R3,280],[0,320]];
 let result;
 for(const [buttons,time] of times)result=s.step({...packet,buttons},time,dualPreview);
 assert.equal(result.imeSwitch,true);
 assert.equal(result.tapR3,false);
 assert.equal(result.pointerButtons&B.R3,0);
});

test('disconnect, disable, and focus change reset pending gestures',()=>{
 const scenarios=[
  {name:'disconnect',packet:{...packet,connected:false},options:{enabled:true}},
  {name:'disable',packet,options:{enabled:false}},
  {name:'focus change',packet:{...packet,target:'200'},options:{enabled:true}}
 ];
 for(const {packet:changed,options} of scenarios){
  const s=setup();
  s.step({...packet,buttons:B.toggle},0,dualPreview);
  s.step(changed,10,{...dualPreview,...options});
  const after=s.step({...packet,buttons:0},20,dualPreview);
  assert.equal(after.toggled,false);
  assert.equal(s.active,false);
 }
});
test('changing connected controller invalidates a pending L3 gesture',()=>{const s=setup();s.step({...packet,buttons:64},10,dualPreview);s.step({...packet,slot:1,buttons:64},20,dualPreview);s.step({...packet,slot:1,buttons:0},30,dualPreview);assert.equal(s.active,false);});
test('R3 custom character taps replay twice without repeating another held face button',()=>{
 const c=normalizeAppearance({bindings:{typing:{R3:'X'}}}),s=setup(c),step=(buttons,t)=>s.step({...packet,buttons},t,c);
 step(64,10);step(0,20);step(128,30);step(0,60);step(128,130);step(0,160);
 assert.deepEqual(step(32768,661).events.map(e=>e.value),['a','c']);assert.deepEqual(step(32768,662).events.map(e=>e.value),['c']);assert.deepEqual(step(32768,663).events,[]);
});
test('returning from dual to single starts the letter disc',()=>{const s=setup();s.step({...packet,buttons:192},10,dualPreview);s.step(packet,20,dualPreview);s.step({...packet,buttons:64},30,dualPreview);s.step(packet,40,dualPreview);assert.equal(s.radial.mode,0);});
