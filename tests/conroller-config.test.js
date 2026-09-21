import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAppearance} from '../src/appearance.js';
import {normalizeBindings, ACTIONS} from '../src/controls.js';
import {normalizeSystem} from '../src/system.js';

test('new defaults and independent deadzone boundaries', () => {
 const a=normalizeAppearance({deadzoneLeft:0,deadzoneRight:99});
 assert.equal(a.deadzoneLeft,0); assert.equal(a.deadzoneRight,40);
 assert.equal(a.scale,100); assert.equal(a.opacity,50);
 assert.equal(a.keyboardMode,'single'); assert.equal(a.rightDisc,0);
 assert.equal(a.mouseSpeed,5500); assert.equal(a.scrollSpeed,10);
 assert.equal(normalizeAppearance({scale:999,mouseSpeed:99999,scrollSpeed:99}).scale,150);
 assert.equal(normalizeAppearance({mouseSpeed:99999}).mouseSpeed,8000);
 assert.equal(normalizeAppearance({scrollSpeed:99}).scrollSpeed,20);
});
test('character positions locked, ordinary buttons customizable', () => {
 const b=normalizeBindings({typing:{A:'mouseLeft'},idle:{A:'key:tab'},dual:{Left:'none'}});
 assert.equal(b.typing.A,'A'); assert.equal(b.idle.A,'key:tab');
 assert.equal(b.dual.Left,'leftX'); assert.equal(b.typing.Left,'cyclePrevious');
 assert.equal(b.typing.Right,'cycleNext'); assert.equal(b.idle.Up,'key:up');
 assert.equal(b.idle.R3,'none'); assert.equal(b.typing.L3,'app:keyboard');
 assert.equal(ACTIONS['layer:auxiliary'],undefined); assert.equal(ACTIONS.lighter,undefined);
});
test('only three languages, Windows default and two close choices', () => {
 assert.equal(normalizeSystem({},'ja-JP').locale,'ja');
 assert.equal(normalizeSystem({},'zh-CN').locale,'zh-CN');
 assert.equal(normalizeSystem({},'de-DE').locale,'en');
 assert.equal(normalizeSystem({locale:'en'},'ja-JP').locale,'en');
 assert.equal(normalizeSystem({closeBehavior:'minimize'}).closeBehavior,'tray');
});
