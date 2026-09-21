import test from 'node:test';
import assert from 'node:assert/strict';
import {DualActivation} from '../src/activation.js';

const L3=64;
const R3=128;

test('L3 toggles on its own edge without a chord delay',()=>{
 const g=new DualActivation();
 assert.equal(g.step(L3,0).toggle,true);
 assert.equal(g.step(L3,300).toggle,false);
 assert.equal(g.step(L3|R3,400).toggle,false);
 g.step(R3,500);
 assert.equal(g.step(L3|R3,510).toggle,true);
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
