import test from 'node:test';
import assert from 'node:assert/strict';
import {DualActivation} from '../src/activation.js';

const L3=64;
const R3=128;

test('L3 solo is delayed until release or the inclusive 300 ms deadline',()=>{
 const g=new DualActivation();
 assert.equal(g.step(L3,0).layout,null);
 assert.equal(g.step(L3,299).layout,null);
 assert.equal(g.step(L3,300).layout,'single');
 assert.equal(g.step(L3,301).layout,null);

 const released=new DualActivation();
 assert.equal(released.step(L3,100).layout,null);
 assert.equal(released.step(0,120).layout,'single');
});

test('L3 and R3 edges in either order form a dual gesture through exactly 300 ms',()=>{
 for(const first of [L3,R3]){
  for(const delta of [0,299,300]){
   const g=new DualActivation();
   g.step(first,0);
   const out=g.step(L3|R3,delta);
   assert.equal(out.layout,'dual',`first=${first} delta=${delta}`);
   assert.equal(out.pointerButtons&(R3|L3),0);
  }
 }
 const late=new DualActivation();
 late.step(L3,0);
 assert.equal(late.step(L3|R3,301).layout,'single');
 assert.equal(late.step(L3|R3,301).pointerButtons&R3,0);
 const nonOverlap=new DualActivation();
 nonOverlap.step(R3,0);
 nonOverlap.step(0,20);
 nonOverlap.step(0,21);
 assert.equal(nonOverlap.step(L3,300).layout,null);
});

test('a consumed chord stays consumed until both sticks are released',()=>{
 const g=new DualActivation();
 assert.equal(g.step(L3,0).pointerButtons&R3,0);
 assert.equal(g.step(L3|R3,100).layout,'dual');
 assert.equal(g.step(L3|R3,700).layout,null);
 assert.equal(g.step(L3,701).pointerButtons&R3,0);
 assert.equal(g.step(0,702).tapR3,false);
 g.step(0,703);
 assert.equal(g.step(R3,800).pointerButtons&R3,0);
});

test('R3 triple short press switches IME without leaking a middle click',()=>{
 const g=new DualActivation();
 let out=g.step(R3,0);assert.equal(out.pointerButtons&R3,0);
 out=g.step(0,50);assert.equal(out.tapR3,false);assert.equal(out.imeSwitch,false);
 g.step(R3,150);g.step(0,200);
 g.step(R3,300);out=g.step(0,350);
 assert.equal(out.tapR3,false);assert.equal(out.imeSwitch,true);assert.equal(out.pointerButtons&R3,0);
 out=g.step(0,951);assert.equal(out.tapR3,false);
});

test('the R3 triple window includes the 600 ms boundary',()=>{
 const g=new DualActivation();
 g.step(R3,0);g.step(0,50);
 g.step(R3,150);g.step(0,200);
 g.step(R3,600);
 assert.equal(g.step(0,650).imeSwitch,true);
});

test('a solitary R3 tap and a held R3 remain available after the ambiguity window',()=>{
 const tap=new DualActivation();tap.step(R3,0);tap.step(0,50);
 assert.equal(tap.step(0,650).tapR3,false);
 assert.equal(tap.step(0,651).tapR3,true);
 assert.equal(tap.step(0,652).tapR3,false);

 const held=new DualActivation();
 held.step(R3,0);
 assert.equal(held.step(R3,600).pointerButtons&R3,0);
 assert.equal(held.step(R3,601).pointerButtons&R3,R3);
 assert.equal(held.step(0,602).pointerButtons&R3,0);
});

test('a pre-timeout long R3 release still produces its ordinary binding later',()=>{
 const g=new DualActivation();
 g.step(R3,0);g.step(R3,400);g.step(0,401);
 assert.equal(g.step(0,599).tapR3,false);
 assert.equal(g.step(0,601).tapR3,true);
});

test('two short R3 taps replay two ordinary bindings when no triple completes',()=>{
 const g=new DualActivation();
 g.step(R3,0);g.step(0,40);g.step(R3,140);g.step(0,180);
 assert.equal(g.step(0,640).tapR3,false);
 assert.equal(g.step(0,641).tapR3,true);
 assert.equal(g.step(0,642).tapR3,true);
 assert.equal(g.step(0,643).tapR3,false);
});
