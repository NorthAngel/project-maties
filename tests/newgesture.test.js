import test from 'node:test';
import assert from 'node:assert/strict';
import {DualActivation} from '../src/activation.js';

test('gesture reset clears latent chord, triple, and forwarded middle state',()=>{
 const g=new DualActivation();
 g.step(64,0);g.step(128|64,50);g.step(128,100);
 g.reset();
 assert.deepEqual(g.step(0,101),{layout:null,toggle:false,tapR3:false,tapCount:0,imeSwitch:false,pointerButtons:0});
 g.step(128,200);g.step(128,801);
 assert.equal(g.step(128,802).pointerButtons&128,128);
 g.reset();
 assert.equal(g.step(128,803).pointerButtons&128,0);
});
