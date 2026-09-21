import test from 'node:test';
import assert from 'node:assert/strict';
import { RadialInput, sectorFromStick, characterAt } from '../src/radial.js';
import { InputManager } from '../src/input.js';

test('seven Figma sectors clockwise from upper right; top gap is neutral', () => {
  for (let i=0;i<7;i++) {
    const a=(i+1)*Math.PI/4;
    assert.equal(sectorFromStick(Math.sin(a),-Math.cos(a)),i);
  }
  assert.equal(sectorFromStick(0,-1),null);
  assert.equal(sectorFromStick(.05,.05,3),2);
  assert.equal(sectorFromStick(0,0),null);
});
test('Y,A,X,B map to a,b,c,d and all seven groups', () => {
  for (let s=0;s<7;s++) for (let b=0;b<4;b++)
    assert.equal(characterAt(0,s,b,false),'abcdefghijklmnopqrstuvwxyz,.'[s*4+b]);
  assert.equal(characterAt(0,0,0,true),'A');
  assert.equal(characterAt(1,0,0,false),'A');
  assert.equal(characterAt(1,0,0,true),'a');
  assert.equal(characterAt(2,0,0,false),'1');
});
test('held face buttons emit once; Menu cycles once per press', () => {
  const r=new RadialInput();
  assert.deepEqual(r.step(1,-1,new Set(['Y']),0),[{type:'text',value:'a'}]);
  assert.deepEqual(r.step(1,-1,new Set(['Y']),100),[]);
  r.step(0,0,new Set(),110);
  r.step(0,0,new Set(['menu']),120); assert.equal(r.mode,1);
  r.step(0,0,new Set(['menu']),180); assert.equal(r.mode,1);
  r.step(0,0,new Set(),190); r.step(0,0,new Set(['menu']),200); assert.equal(r.mode,2);
  r.step(0,0,new Set(),210); r.step(0,0,new Set(['menu']),220); assert.equal(r.mode,0);
});
test('Dpad space/backspace/enter and hold Shift; disconnect releases state', () => {
  const r=new RadialInput();
  assert.deepEqual(r.step(1,-1,new Set(['shift','Y']),0),[{type:'text',value:'A'}]);
  r.step(0,0,new Set(),10); assert.equal(r.shift,false);
  assert.deepEqual(r.step(0,0,new Set(['space']),20),[{type:'text',value:' '}]);
  assert.deepEqual(r.step(0,0,new Set(['space']),300),[]);
  assert.deepEqual(r.step(0,0,new Set(['space']),480),[{type:'text',value:' '}]);
  r.step(0,0,new Set(),490);
  assert.deepEqual(r.step(0,0,new Set(['backspace']),500),[{type:'backspace'}]);
  r.step(0,0,new Set(),510);
  assert.deepEqual(r.step(0,0,new Set(['enter']),520),[{type:'text',value:'\n'}]);
  r.reset(); assert.equal(r.selected,null); assert.equal(r.shift,false);
  assert.deepEqual(r.step(0,0,new Set(['Y']),600),[]);
});
test('upstream InputManager reads actual standard Xbox indices and deadzone', () => {
  const pad={index:0,connected:true,mapping:'standard',id:'Xbox test',axes:[.7,-.7,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
  const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>[pad]}});
  try {
    const i=new InputManager({bindings:{Y:{pad:'FACE_UP'},A:{pad:'FACE_DOWN'},X:{pad:'FACE_LEFT'},B:{pad:'FACE_RIGHT'},shift:{pad:'DPAD_RIGHT'},menu:{pad:'START'}}});
    for(const [action,index] of [['Y',3],['A',0],['X',2],['B',1],['shift',15],['menu',9]]) {
      pad.buttons.forEach(b=>b.pressed=false);i.poll();pad.buttons[index].pressed=true;i.poll();assert.equal(i.justPressed(action),true);i.poll();assert.equal(i.justPressed(action),false);
    }
    pad.axes=[0.03,0.02];i.poll();assert.equal(i.stick().magnitude,0);
  } finally { if(original) Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator; }
});
