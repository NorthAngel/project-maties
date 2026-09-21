import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAppearance} from '../src/appearance.js';
import {FIGMA_LAYOUT} from '../src/figma-layout.js';
test('pure wheel default and bounded opacity independent of text color',()=>{
 const defaults=normalizeAppearance({});assert.deepEqual(Object.fromEntries(['mode','opacity','scale','deadzoneLeft','deadzoneRight'].map(k=>[k,defaults[k]])),{mode:'wheel',opacity:50,scale:100,deadzoneLeft:10,deadzoneRight:10});
 assert.equal(normalizeAppearance({deadzoneLeft:100}).deadzoneLeft,40);
 assert.equal(normalizeAppearance({opacity:500}).opacity,100);
 assert.equal(normalizeAppearance({opacity:-1}).opacity,0);
 assert.equal(normalizeAppearance({opacity:NaN}).opacity,50);
 assert.equal(normalizeAppearance({mode:'practice',opacity:50,ink:'white',scale:70}).mode,'wheel');
});
test('all 84 glyphs and 21 sector shapes come from Figma exports',()=>{
 const chars=['abcdefghijklmnopqrstuvwxyz,.','ABCDEFGHIJKLMNOPQRSTUVWXYZ,.','1234567890!@%^#$&*()-_+=:”<>'];
 FIGMA_LAYOUT.forEach((disc,m)=>{
  assert.equal(disc.length,7);
  disc.forEach((sector,s)=>{
   assert.equal(sector.filter(n=>n.type==='VECTOR').length,1);
   assert.equal(sector.filter(n=>n.type==='TEXT').length,4);
   assert.deepEqual(sector.filter(n=>n.type==='TEXT').map(n=>n.text).sort(),[...chars[m].slice(s*4,s*4+4)].sort());
   for(const n of sector){assert.ok(n.id);assert.ok(n.width>0&&n.height>0);assert.ok(n.asset.includes('/exact/'));}
  });
 });
 // The actual asymmetric e/f and c/d coordinates must not be flattened to a generic cross.
 const ef=FIGMA_LAYOUT[0][1].filter(n=>n.type==='TEXT');
 assert.notEqual(ef.find(n=>n.text==='e').x,ef.find(n=>n.text==='f').x);
});

