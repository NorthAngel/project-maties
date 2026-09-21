import test from 'node:test';
import assert from 'node:assert/strict';
import {RadialInput,sectorFromStick} from '../src/radial.js';
import {InputSession} from '../src/session.js';
import {normalizeAppearance} from '../src/appearance.js';
import {RepeatActions} from '../src/repeat-actions.js';
test('repeat gate honors 399/400 and 459/460 boundaries without repeating switches',()=>{
 const g=new RepeatActions(),down=new Set(['key:space','cycleNext']),repeatable=new Set(['key:space']);
 assert.deepEqual([...g.step(down,0,repeatable)],['key:space','cycleNext']);
 assert.equal(g.step(down,399,repeatable).size,0);
 assert.deepEqual([...g.step(down,400,repeatable)],['key:space']);
 assert.equal(g.step(down,459,repeatable).size,0);
 assert.deepEqual([...g.step(down,460,repeatable)],['key:space']);
 g.reset();assert.equal(g.step(new Set(),1000,repeatable).size,0);
});
test('center cancels selection including zero deadzone, notch cannot retain previous sector',()=>{
 assert.equal(sectorFromStick(0,0,2),null);
 assert.equal(sectorFromStick(.01,.01),2);
 assert.equal(sectorFromStick(0,-1,0),null);
});
test('character and enter repeat at 400/60; deadzone clears repeat',()=>{
 const r=new RadialInput(),down=new Set(['Y']);
 assert.equal(r.step(1,0,down,0).length,1);
 assert.equal(r.step(1,0,down,399).length,0);
 assert.equal(r.step(1,0,down,400).length,1);
 assert.equal(r.step(1,0,down,460).length,1);
 assert.equal(r.step(0,0,down,520).length,0);
 assert.equal(r.step(0,0,new Set(['enter']),600).length,1);
 assert.equal(r.step(0,0,new Set(['enter']),1000).length,1);
});
test('L3 immediately toggles the selected mode and reads default discs',()=>{
 const s=new InputSession(),a=normalizeAppearance({keyboardMode:'dual',leftDisc:1,rightDisc:2});
 const p={connected:true,slot:'a',pid:123,target:'99',buttons:0,x:0,y:0,rx:0,ry:0};
 s.step(p,0,a); s.step({...p,buttons:64},10,a);
 assert.equal(s.active,true); assert.equal(s.layout,'dual');
 assert.equal(s.leftRadial.mode,1); assert.equal(s.radial.mode,2);
 s.step(p,20,a);s.step({...p,buttons:64},30,a);assert.equal(s.active,false);
});
