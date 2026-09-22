import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

import {normalizeAppearance} from '../src/appearance.js';
import {PHYSICAL} from '../src/controls.js';

const PROJECT_ROOT = new URL('../', import.meta.url);
const VALID_GUID = '00000000000000000000000000000001';
const VALID_MAPPING = `${VALID_GUID},Controller Companion,leftx:a0,lefty:a1,a:b0,b:b1,x:b2,y:b3,platform:Windows,`;
const BASE_PACKET = {
  type: 'state',
  connected: true,
  ready: true,
  slot: 'pad-1',
  buttons: 0,
  x: 0,
  y: 0,
  rx: 0,
  ry: 0,
  target: 'window-1',
  pid: 4321,
  inputLanguage: 'en-US',
  device: {id: 'pad-1', guid: VALID_GUID, name: 'Test Pad'},
};

async function loadRuntimeEngine() {
  let loaded;
  try {
    loaded = await import('../src/runtime-engine.js');
  } catch (error) {
    assert.fail(`runtime-engine.js must be importable without Electron or a DOM: ${error.message}`);
  }
  assert.equal(typeof loaded.RuntimeEngine, 'function');
  return loaded.RuntimeEngine;
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function createPlatform(overrides = {}) {
  const evidence = {
    sent: [],
    emitted: [],
    overlays: [],
    controller: [],
    savedAppearance: [],
    savedControllers: [],
  };
  const platform = {
    send(command) { evidence.sent.push(clone(command)); },
    emit(event, payload) { evidence.emitted.push({event, payload: clone(payload)}); },
    overlay(active, packet, appearance, layout) {
      evidence.overlays.push({active, packet: clone(packet), appearance: clone(appearance), layout});
    },
    saveAppearance(value) { evidence.savedAppearance.push(clone(value)); },
    saveControllers(value) { evidence.savedControllers.push(clone(value)); },
    async controller(command) {
      evidence.controller.push(clone(command));
      return {ok: true};
    },
    ...overrides,
  };
  return {platform, evidence};
}

async function createEngine({bootstrap = {}, platform: platformOverrides = {}} = {}) {
  const RuntimeEngine = await loadRuntimeEngine();
  const {platform, evidence} = createPlatform(platformOverrides);
  const engine = new RuntimeEngine(platform, {
    appearance: normalizeAppearance({keyboardMode: 'dual'}),
    controllers: {preferredGuid: '', mappings: {}},
    ownPid: 999,
    testing: true,
    ...bootstrap,
  });
  await engine.ready;
  return {engine, evidence};
}

function feed(engine, value, now) {
  return engine.feed({...BASE_PACKET, ...value}, now);
}

function arm(engine, packet = {}) {
  feed(engine, {...packet, buttons: 0}, 0);
  feed(engine, {...packet, buttons: 0}, 1);
}

function openSingle(engine, start = 10, packet = {}) {
  feed(engine, {...packet, buttons: PHYSICAL.L3}, start);
  return feed(engine, {...packet, buttons: 0}, start + 10);
}

test('constructor ignores old mappings and isolates new controller settings',async()=>{
 const controllers={preferredKey:'known',profiles:{},mappings:{bad:'old'}};
 const {engine,evidence}=await createEngine({bootstrap:{appearance:{opacity:500},controllers}});
 assert.equal(engine.getAppearance().opacity,100);
 assert.deepEqual(engine.getControllerConfig(),{preferredKey:'known',profiles:{}});
 assert.deepEqual(evidence.controller[0].config,{preferredKey:'known'});
 controllers.preferredKey='outside';
 const copy=engine.getControllerConfig();copy.preferredKey='copy';
 assert.equal(engine.getControllerConfig().preferredKey,'known');
});
test('saved mode drives L3 and every opening initializes the configured discs',async()=>{
 const {engine,evidence}=await createEngine();
 arm(engine);
 assert.equal(openSingle(engine).layout,'dual');
 assert.equal(evidence.overlays.at(-1).active,true);
 feed(engine,{buttons:64},40);feed(engine,{buttons:0},50);
 assert.equal(engine.getRuntime().active,false);
 await engine.setAppearance({keyboardMode:'single',leftDisc:1});
 feed(engine,{buttons:0},60);
 feed(engine,{buttons:64},70);
 assert.equal(engine.getRuntime().layout,'single');
 assert.equal(engine.getRuntime().mode,1);
});
test('device profiles remain independent through disconnect and reconnect',async()=>{
 const {engine}=await createEngine();arm(engine);
 await engine.setAppearance({deadzoneLeft:27});
 feed(engine,{connected:false},10);
 await assert.rejects(engine.setAppearance({scale:80}),/手柄未接入/);
 feed(engine,{device:{...BASE_PACKET.device,guid:'other'},slot:'other'},20);
 assert.equal(engine.getAppearance().deadzoneLeft,10);
 feed(engine,{},30);
 assert.equal(engine.getAppearance().deadzoneLeft,27);
});

test('stop and disable release native input, hide the overlay, and clear pending gestures', async () => {
  const appearance = normalizeAppearance({
    bindings: {idle: {LT: 'modifier:ctrl'}},
  });
  const {engine, evidence} = await createEngine({bootstrap: {appearance}});
  arm(engine);
  await engine.setAppearance({bindings:appearance.bindings});
  arm(engine);

  feed(engine, {buttons: PHYSICAL.LT}, 10);
  assert.deepEqual(evidence.sent.at(-1), {
    type: 'pointer',
    action: 'modifier',
    key: 'ctrl',
    down: true,
  });

  engine.stop();
  assert.equal(engine.getRuntime().active, false);
  assert.deepEqual(evidence.sent.at(-1), {type: 'end'});
  assert.equal(evidence.overlays.at(-1).active, false);

  feed(engine, {buttons: PHYSICAL.L3}, 20);
  engine.setEnabled(false);
  engine.setEnabled(true);
  const released = feed(engine, {buttons: 0}, 30);
  assert.equal(released.active, false);
  assert.equal(evidence.sent.filter(command => command.type === 'begin').length, 0);

  feed(engine, {buttons: PHYSICAL.LT}, 40);
  assert.equal(evidence.sent.filter(command => command.type === 'pointer' && command.action === 'modifier' && command.down).length, 1);
});

test('native inventory supports selection and rejects removed calibration commands',async()=>{
 const {engine,evidence}=await createEngine();
 const device=BASE_PACKET.device;
 await engine.native({type:'devices',items:[device],selected:device.id,backend:'SDL3'});
 assert.deepEqual(engine.getRuntime().devices,[device]);
 assert.equal((await engine.controllerAction({action:'capture',id:device.id})).ok,false);
 assert.equal((await engine.controllerAction({action:'select',id:device.id})).ok,true);
 assert.equal(evidence.controller.at(-1).action,'select');
 assert.ok(engine.getControllerConfig().preferredKey);
 await engine.native({type:'error',message:'service-down'});
 assert.equal(engine.getRuntime().error,'service-down');
 await engine.native({type:'service-ready'});
 assert.equal(engine.getRuntime().error,'');
});

test('own process cannot activate or cycle IME while a foreign target preserves triple-R3 behavior', async () => {
  const {engine, evidence} = await createEngine({bootstrap: {ownPid: 77}});
  const own = {pid: 77, target: 'settings'};
  arm(engine, own);
  openSingle(engine, 10, own);
  assert.equal(engine.getRuntime().active, false);

  const triple = (packet, start) => {
    for (const [buttons, delta] of [
      [PHYSICAL.R3, 0], [0, 40], [PHYSICAL.R3, 140],
      [0, 180], [PHYSICAL.R3, 280], [0, 320],
    ]) feed(engine, {...packet, buttons}, start + delta);
  };
  triple(own, 100);
  assert.equal(evidence.sent.some(command => command.type === 'ime'), false);

  arm(engine, {pid: 88, target: 'foreign'});
  triple({pid: 88, target: 'foreign'}, 1000);
  assert.deepEqual(evidence.sent.filter(command => command.type === 'ime'), [{
    type: 'ime',
    action: 'cycle',
    target: 'foreign',
  }]);
  assert.equal(evidence.sent.some(command => command.type === 'pointer' && command.button === 'middle'), false);
});

test('appearance and controller persistence failures are returned to their callers', async () => {
  const saveError = new Error('disk-full');
  const {engine} = await createEngine({
    platform: {
      saveAppearance() { return Promise.reject(saveError); },
      saveControllers() { return Promise.reject(saveError); },
    },
  });

  arm(engine);
  await assert.rejects(engine.setAppearance({opacity: 60}), /disk-full/);
  assert.equal(engine.getAppearance().opacity, 60);
  assert.equal(engine.getRuntime().error, '设置未能保存');

  const device = {id: 'pad-1', guid: VALID_GUID, name: 'Test Pad'};
  await engine.native({type: 'devices', items: [device], selected: device.id, backend: 'SDL3', warning: ''});
  const result = await engine.controllerAction({action: 'select', id: device.id});
  assert.deepEqual(result, {ok: false, error: 'disk-full'});
});

async function loadClassicBridge() {
  try {
    return await readFile(new URL('src/webview-bridge.js', PROJECT_ROOT), 'utf8');
  } catch (error) {
    assert.fail(`webview-bridge.js must exist: ${error.message}`);
  }
}

test('classic WebView bridge correlates replies, filters unrelated messages, and preserves legacy desktop', async () => {
  const source = await loadClassicBridge();
  const legacy = {kind: 'electron'};
  const legacyWindow = {desktop: legacy};
  vm.runInNewContext(source, {window: legacyWindow, console, setTimeout, clearTimeout});
  assert.equal(legacyWindow.desktop, legacy);
  assert.equal(legacyWindow.host, undefined);

  const posted = [];
  let receive;
  const webview = {
    postMessage(message) { posted.push(clone(message)); },
    addEventListener(type, callback) {
      assert.equal(type, 'message');
      receive = callback;
    },
  };
  const window = {chrome: {webview}};
  let pointerdown;
  const document = {
    documentElement: {dataset: {hostRole: 'overlay'}},
    addEventListener(type, callback) {
      if (type === 'pointerdown') pointerdown = callback;
    },
  };
  vm.runInNewContext(source, {
    window,
    document,
    console,
    setTimeout,
    clearTimeout,
  });

  assert.equal(typeof window.host.request, 'function');
  assert.equal(typeof window.host.notify, 'function');
  assert.equal(typeof window.host.on, 'function');
  assert.equal(typeof window.desktop.getRuntime, 'function');

  const runtimePromise = window.desktop.getRuntime();
  const request = posted.at(-1);
  assert.deepEqual({...request}, {id: request.id, method: 'runtime.get', args: undefined});
  receive({data: {unrelated: true}});
  receive({data: {id: request.id, result: {active: false}}});
  assert.deepEqual(await runtimePromise, {active: false});

  let eventPayload;
  const unsubscribe = window.host.on('runtime', payload => { eventPayload = payload; });
  receive({data: {event: 'runtime', payload: {active: true}}});
  assert.deepEqual(eventPayload, {active: true});
  unsubscribe();
  receive({data: {event: 'runtime', payload: {active: false}}});
  assert.deepEqual(eventPayload, {active: true});

  window.host.notify('app.menu');
  assert.equal(posted.at(-1).method, 'app.menu');
  assert.ok(posted.at(-1).id);

  assert.equal(typeof pointerdown, 'function');
  pointerdown({
    button: 0,
    target: {
      closest(selector) {
        return selector === '[app-region="drag"]' ? {} : null;
      },
    },
  });
  assert.equal(posted.at(-1).method, 'window.action');
  assert.equal(posted.at(-1).args, 'drag');

  const failed = window.host.request('system.get');
  const failedRequest = posted.at(-1);
  receive({data: {id: failedRequest.id, error: 'native-failure'}});
  await assert.rejects(failed, /native-failure/);
});

test('settings runtime entry exposes supported APIs and excludes desktop capture', async () => {
  const calls = [];
  const listeners = new Map();
  const host = {
    async request(method, args) {
      calls.push({method, args: clone(args)});
      if (method === 'bootstrap') return {
        appearance: normalizeAppearance({opacity: 25}),
        controllers: {preferredGuid: '', mappings: {}},
        ownPid: 12,
        testing: true,
      };
      if (method === 'runtime.get') return {source: 'native-cache'};
      if (method === 'appearance.get') return {opacity: 99};
      return {ok: true};
    },
    notify(method, args) {
      calls.push({
        method,
        args: clone(args),
        notify: true,
        nativeSubscribed: Boolean(listeners.get('native')?.size),
        stopSubscribed: Boolean(listeners.get('stop')?.size),
        maintenanceSubscribed: Boolean(listeners.get('maintenance')?.size),
        settingsHiddenSubscribed: Boolean(listeners.get('settings-hidden')?.size),
      });
    },
    on(event, callback) {
      let callbacks = listeners.get(event);
      if (!callbacks) listeners.set(event, callbacks = new Set());
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
  };
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const browserWindow = {host, desktop: {}};
  globalThis.window = browserWindow;
  globalThis.document = {documentElement: {dataset: {hostRole: 'settings'}}};
  try {
    let loaded;
    try {
      loaded = await import(`../src/runtime-entry.js?test=${Date.now()}`);
    } catch (error) {
      assert.fail(`runtime-entry.js must initialize in the settings page: ${error.message}`);
    }
    assert.ok(loaded);
    const desktop = browserWindow.desktop;
    for (const name of [
      'getSystem', 'setSystem', 'onSystem', 'systemAction', 'controllerAction',
      'getAppearance', 'setAppearance', 'onAppearance', 'getRuntime', 'onRuntime',
      'onController', 'windowAction', 'setEnabled', 'menu',
    ]) assert.equal(typeof desktop[name], 'function', `${name} remains available`);

    assert.equal((await desktop.getAppearance()).opacity, 25);
    for (const callback of listeners.get('native')) await callback(BASE_PACKET);
    assert.equal((await desktop.setAppearance({opacity: 35})).opacity, 35);
    assert.equal((await desktop.setEnabled(false)).enabled, false);
    assert.deepEqual(await desktop.getSystem(), {ok: true});
    assert.deepEqual(await desktop.setSystem({theme: 'dark'}), {ok: true});
    assert.deepEqual(await desktop.systemAction({action: 'diagnose'}), {ok: true});
    assert.equal(desktop.captureDesktop, undefined);
    assert.equal(desktop.onDesktop, undefined);
    assert.deepEqual(await desktop.windowAction('minimize'), {ok: true});
    assert.deepEqual(await desktop.menu(), {ok: true});

    assert.ok(calls.some(call => call.method === 'bootstrap'));
    assert.ok(calls.some(call => call.method === 'engine.ready'
      && call.notify
      && call.nativeSubscribed
      && call.stopSubscribed
      && call.maintenanceSubscribed));
    assert.ok(calls.some(call => call.method === 'controller.request' && call.args?.action === 'configure'));
    assert.ok(calls.some(call => call.method === 'appearance.save' && call.args?.opacity === 35));
    assert.ok(calls.some(call => call.method === 'system.get'));
    assert.ok(calls.some(call => call.method === 'system.set' && call.args?.theme === 'dark'));
    assert.ok(calls.some(call => call.method === 'system.action' && call.args?.action === 'diagnose'));
    assert.ok(!calls.some(call => call.method === 'desktop.preview'));
    assert.ok(calls.some(call => call.method === 'window.action' && call.args === 'minimize'));
    assert.ok(calls.some(call => call.method === 'app.menu'));
    assert.ok(calls.some(call => call.method === 'event.emit' && call.args?.event === 'runtime'));
    assert.ok(calls.some(call => call.method === 'event.emit'
      && call.args?.event === 'appearance'
      && call.args?.payload?.opacity === 25));

    const nativeListeners = listeners.get('native');
    assert.ok(nativeListeners?.size);
    for (const callback of nativeListeners) await callback({...BASE_PACKET, target: 'foreign', pid: 99});
    assert.equal((await desktop.getRuntime()).connected, true);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
