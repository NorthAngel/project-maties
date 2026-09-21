import test from 'node:test';
import assert from 'node:assert/strict';
test('220 ms spring lands exactly at both endpoints',async()=>{
 const {WHEEL_TRANSITION_MS,springProgress}=await import('../src/wheel-motion.js');
 assert.equal(WHEEL_TRANSITION_MS,220);assert.equal(springProgress(0),0);assert.equal(springProgress(1),1);
 for(const t of [.1,.3,.5,.9])assert.ok(Number.isFinite(springProgress(t)));
});
