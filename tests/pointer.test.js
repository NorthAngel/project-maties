import test from 'node:test';
import assert from 'node:assert/strict';
import {PointerInput} from '../src/pointer.js';
import {normalizeAppearance} from '../src/appearance.js';

const base={connected:true,slot:0,buttons:0,x:0,y:0,rx:0,ry:0,target:'10',pid:99};
const settings=normalizeAppearance({keyboardMode:'single'});
function pointer(active=false,config=settings){const p=new PointerInput();p.step(base,active,config,0);p.step(base,active,config,16);return p;}

test('sustained right-stick scrolling emits fine wheel units and stops without drift',()=>{
 const p=pointer();
 const out=[];
 for(let t=32;t<1000;t+=16)out.push(...p.step({...base,ry:-1},false,settings,t));
 const scroll=out.filter(e=>e.type==='scroll'&&e.axis==='vertical');
 assert.ok(scroll.length>3);
 assert.ok(scroll.some(e=>Math.abs(e.delta)!==120));
 assert.ok(scroll.every(e=>e.delta>0));
 assert.deepEqual(p.step(base,false,settings,1016),[]);
 assert.deepEqual(p.step(base,false,settings,1032),[]);
});

test('scroll reversal clears old momentum and emits the new sign',()=>{
 const p=pointer();
 for(let t=32;t<500;t+=16)p.step({...base,ry:-1},false,settings,t);
 const reversed=[];
 for(let t=516;t<1000;t+=16)reversed.push(...p.step({...base,ry:1},false,settings,t));
 const scroll=reversed.filter(e=>e.type==='scroll'&&e.axis==='vertical');
 assert.ok(scroll.some(e=>e.delta<0));
 assert.ok(!scroll.some(e=>e.delta>0));
});

test('scroll integration is timing independent and diagonal axes stay independent',()=>{
 const run=(dt)=>{
  const p=pointer();let total=0,horizontal=0;
  for(let t=16+dt;t<=512;t+=dt){for(const e of p.step({...base,rx:.8,ry:-.8},false,settings,t))if(e.type==='scroll'){if(e.axis==='vertical')total+=e.delta;else horizontal+=e.delta;}}
  return {total,horizontal};
 };
 const a=run(16),b=run(32);
 assert.ok(a.total>0&&a.horizontal>0);
 assert.ok(Math.abs(a.total-b.total)<Math.max(30,a.total*.25));
 assert.ok(Math.abs(a.horizontal-b.horizontal)<Math.max(30,a.horizontal*.25));
});

test('cursor speed keeps the 6400 maximum and whole-number motion',()=>{
 const c=normalizeAppearance({keyboardMode:'single',mouseSpeed:6400});
 assert.equal(c.mouseSpeed,6400);
 assert.equal(normalizeAppearance({mouseSpeed:99999}).mouseSpeed,6400);
 const p=pointer(false,c);
 const move=p.step({...base,x:1},false,c,76).find(e=>e.type==='move');
 assert.deepEqual(move,{type:'move',dx:384,dy:0});
});
