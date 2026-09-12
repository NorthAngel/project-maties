import {Calibration, CALIBRATION_STEPS} from './calibration.js';
import {createWheel} from './wheel-view.js';
import {ACTIONS, LABELS, normalizeBindings, normalizeAuxiliary} from './controls.js';
import {applyWheelStyle, normalizeAppearance} from './appearance.js';
import {normalizeSystem} from './system.js';
import {LOCALES, LANGUAGE_LABELS, actionLabel, installTranslations, normalizeLocale, systemActionMessage, translate} from './i18n.js';
import {applyTheme, normalizeTheme, watchSystemTheme} from './theme.js';

const $ = id => document.getElementById(id);
const desktop = window.desktop ?? {};
const invoke = async (name, ...args) => typeof desktop[name] === 'function' ? desktop[name](...args) : undefined;
const subscribe = (name, callback) => typeof desktop[name] === 'function' ? desktop[name](callback) : undefined;
const right = await createWheel($('sectors'));
const left = await createWheel($('preview-left'));

let devices = [];
let selectedId = '';
let deviceKind = '';
let calibration = null;
let calibrationDevice = null;
let appearance = normalizeAppearance(await invoke('getAppearance') ?? {});
const systemRaw = await invoke('getSystem') ?? {};
let system = {...normalizeSystem(systemRaw), ...(systemRaw.version === undefined ? {} : {version: systemRaw.version}), ...(systemRaw.resolvedTheme === undefined ? {} : {resolvedTheme: systemRaw.resolvedTheme})};
let locale = normalizeLocale(system.locale);
let previewLayout = appearance.keyboardMode === 'dual' ? 'dual' : 'single';
let liveLayout = 'single';
let bindMode = 'idle';
let bindLayer = 'base';
let previewMode = 0;
let activeTab = 'appearance';
let lastSystemResult = null;
let lastRuntimeState = null;

const fields = {
  'outline-color': 'outlineColor',
  'outline-width': 'outlineWidth',
  'fill-color': 'fillColor',
  'text-color': 'textColor',
  'mouse-speed': 'mouseSpeed',
  'scroll-speed': 'scrollSpeed',
};

const tr = (key, values) => translate(locale, key, values);

function applyResolvedTheme() {
  const resolved = system.theme === 'system' && ['light', 'dark'].includes(system.resolvedTheme)
    ? system.resolvedTheme
    : applyTheme(system.theme, document.documentElement, window);
  document.documentElement.dataset.theme = resolved;
  applyWheelStyle(appearance);
  return resolved;
}

function setLocale(next) {
  locale = normalizeLocale(next);
  document.title = tr('app.settingsTitle');
  installTranslations({locale});
  document.documentElement.lang = locale;
  for (const option of $('system-locale')?.options ?? []) option.textContent = LANGUAGE_LABELS[option.value] ?? option.value;
  renderPage(activeTab);
  if (appearance) renderAppearance(appearance);
  if (lastRuntimeState) runtime(lastRuntimeState);
  if (lastSystemResult) {
    $('system-status').textContent = systemActionMessage(locale, lastSystemResult);
    $('system-status').classList.toggle('error', lastSystemResult.ok === false);
    if (lastSystemResult.details) showSystemReport(lastSystemResult.details);
  }
  if (!$('bindings-editor').hidden) bindingRows();
  renderCalibration();
}

function setSystemView(value = {}) {
  system = normalizeSystem({...system, ...value});
  if (value.version !== undefined) system.version = value.version;
  if (value.resolvedTheme !== undefined) system.resolvedTheme = value.resolvedTheme;
  setLocale(system.locale);
  $('system-locale').value = locale;
  $('system-theme').value = normalizeTheme(system.theme);
  $('system-startup').checked = system.startAtLogin === true;
  $('system-close').value = system.closeBehavior;
  $('system-version').textContent = system.version ? `${tr('system.version')} ${system.version}` : '';
  applyResolvedTheme();
}

async function changeSystem(value) {
  const next = await invoke('setSystem', value);
  setSystemView(next && typeof next === 'object' ? next : {...system, ...value});
  return system;
}

function renderPage(tab = activeTab) {
  activeTab = tab;
  document.querySelectorAll('[data-tab]').forEach(node => node.classList.toggle('selected', node.dataset.tab === tab));
  document.querySelectorAll('[data-panel]').forEach(node => { node.hidden = node.dataset.panel !== tab; });
  $('preview').hidden = tab === 'system';
  const descriptions = {
    appearance: ['page.appearance.title', 'page.appearance.subtitle'],
    controller: ['page.controller.title', 'page.controller.subtitle'],
    system: ['system.title', 'system.subtitle'],
  };
  const [title, subtitle] = descriptions[tab] ?? descriptions.appearance;
  $('page-title').textContent = tr(title);
  $('page-subtitle').textContent = tr(subtitle);
  if (tab === 'system') $('system-status').textContent ||= tr('system.ready');
}

function layoutForPreview() {
  return previewLayout === 'dual' ? 'dual' : 'single';
}

function renderPreview() {
  const dual = layoutForPreview() === 'dual';
  document.body.classList.toggle('dual', dual);
  left.update({mode: appearance.leftDisc, selected: 0, shift: false});
  right.update({mode: dual ? appearance.rightDisc : previewMode, selected: 6, shift: false});
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.mode) === previewMode)));
  document.querySelectorAll('[data-layout]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layout === previewLayout)));
  document.querySelector('.preview-bottom').hidden = dual;
  resize();
}

function resize() {
  if (!appearance) return;
  const box = document.querySelector('.preview-wheel-space').getBoundingClientRect();
  const width = layoutForPreview() === 'dual' ? 1584.356 : 768.178;
  $('preview-wheel').style.setProperty('--preview-scale', Math.min(box.width / width, box.height / 714.608) * appearance.scale / 110);
}

function renderAppearance(value) {
  appearance = normalizeAppearance(value);
  applyResolvedTheme();
  for (const key of ['opacity', 'scale', 'deadzone']) {
    $(key).value = appearance[key];
    $(`${key}-value`).textContent = `${appearance[key]}%`;
  }
  for (const key of ['opacity', 'ink']) {
    document.querySelectorAll(`[data-${key}]`).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[key]) === String(appearance[key])));
  }
  $('deadzone-ring').style.width = $('deadzone-ring').style.height = `${appearance.deadzone * 2}%`;
  for (const [id, key] of Object.entries(fields)) $(id).value = appearance[key];
  $('outline-width-value').textContent = `${appearance.outlineWidth} px`;
  $('mouse-speed-value').textContent = appearance.mouseSpeed;
  $('scroll-speed-value').textContent = appearance.scrollSpeed;
  $('chord-interval').value = 300;
  $('left-disc').value = appearance.leftDisc;
  $('right-disc').value = appearance.rightDisc;
  $('activation-label').textContent = liveLayout === 'dual' ? tr('controller.dualActivation') : tr('controller.singleActivation');
  $('typing-role').textContent = liveLayout === 'dual' ? tr('controller.roleDual') : tr('controller.roleSingle');
  $('collapsed-role').textContent = tr('controller.roleCollapsedHint');
  $('hint').textContent = liveLayout === 'dual' ? tr('controller.hintDual') : tr('controller.hintSingle');
  $('reserved-label').textContent = liveLayout === 'dual' ? tr('controller.reservedDual') : tr('controller.reservedSingle');
  for (const element of document.querySelectorAll('[data-physical]')) element.value = (bindLayer === 'base' ? appearance.bindings : appearance.auxiliaryBindings)[bindMode][element.dataset.physical];
  document.querySelectorAll('[data-quick]').forEach(button => {
    const action = appearance.bindings[liveLayout === 'dual' ? 'dual' : 'typing'][button.dataset.quick];
    button.querySelector('small').textContent = actionLabel(locale, action);
  });
  renderPreview();
}

const changeAppearance = async value => renderAppearance(await invoke('setAppearance', value) ?? {...appearance, ...value});

function image(url) {
  if (url) { $('desktop-image').src = url; $('capture-message').textContent = ''; }
}

function buttonLabel(key) {
  const labels = deviceKind === 'playstation'
    ? {Y: '△', A: '×', X: '□', B: '○', LB: 'L1', RB: 'R1', LT: 'L2', RT: 'R2', Menu: 'Options', View: 'Create'}
    : deviceKind === 'nintendo' ? {Y: 'X', A: 'B', X: 'Y', B: 'A'} : {};
  const physical = {Menu: 'physical.menu', View: 'physical.view', LB: 'physical.lb', RB: 'physical.rb', LT: 'physical.lt', RT: 'physical.rt', R3: 'physical.r3'};
  return labels[key] || (physical[key] ? tr(physical[key]) : LABELS[key]) || key;
}

function runtime(state = {}) {
  lastRuntimeState = state;
  devices = state.devices || [];
  selectedId = state.selectedDevice || '';
  const selected = devices.find(device => device.id === selectedId);
  deviceKind = selected?.kind || '';
  if (state.layout === 'single' || state.layout === 'dual') liveLayout = state.layout;
  $('device-status').textContent = selected?.name || (state.connected ? tr('device.connected') : tr('device.waiting'));
  document.querySelector('.device').classList.toggle('connected', state.connected);
  if (typeof state.enabled === 'boolean') $('enabled').checked = state.enabled;
  $('error').textContent = state.error || state.warning || '';
  const select = $('controller-select');
  if (JSON.stringify(devices) !== select.dataset.devices) {
    select.replaceChildren();
    for (const item of devices) { const option = document.createElement('option'); option.value = item.id; option.textContent = item.name; select.append(option); }
    if (!devices.length) { const option = document.createElement('option'); option.value = ''; option.textContent = tr('controller.noDevice'); select.append(option); }
    select.dataset.devices = JSON.stringify(devices);
  }
  if (!devices.length && select.options[0]) select.options[0].textContent = tr('controller.noDevice');
  select.value = selectedId;
  select.disabled = !devices.length || state.calibrating;
  $('calibrate').disabled = $('reset-controller').disabled = !selected || selected.backend !== 'SDL3';
  $('controller-support').textContent = selected ? (selected.mapped ? tr('controller.mapped') : tr('controller.needsCalibration')) : tr('controller.connect');
  document.querySelectorAll('[data-quick]').forEach(button => {
    if (['Y', 'A', 'X', 'B'].includes(button.dataset.quick)) {
      button.querySelector('b').textContent = buttonLabel(button.dataset.quick);
      button.setAttribute('aria-label', `${tr('controller.customButtons')} ${buttonLabel(button.dataset.quick)}`);
    }
  });
  if (appearance) renderAppearance(appearance);
  if (!$('bindings-editor').hidden) bindingRows();
  if (calibrationDevice && !devices.some(device => device.id === calibrationDevice.id)) {
    calibration = null;
    calibrationDevice = null;
    if ($('calibration-dialog').open) $('calibration-dialog').close();
    $('error').textContent = tr('calibration.disconnected');
  }
}

function calibrationLabel(key) {
  const labels = {
    leftx: ['Move the left stick right', '左スティックを右へ', 'Déplacez le stick gauche vers la droite'],
    lefty: ['Move the left stick down', '左スティックを下へ', 'Déplacez le stick gauche vers le bas'],
    rightx: ['Move the right stick right', '右スティックを右へ', 'Déplacez le stick droit vers la droite'],
    righty: ['Move the right stick down', '右スティックを下へ', 'Déplacez le stick droit vers le bas'],
    a: ['Press the bottom button (A / ×)', '下のボタンを押す（A / ×）', 'Appuyez sur le bouton du bas (A / ×)'],
    b: ['Press the right button (B / ○)', '右のボタンを押す（B / ○）', 'Appuyez sur le bouton de droite (B / ○)'],
    x: ['Press the left button (X / □)', '左のボタンを押す（X / □）', 'Appuyez sur le bouton de gauche (X / □)'],
    y: ['Press the top button (Y / △)', '上のボタンを押す（Y / △）', 'Appuyez sur le bouton du haut (Y / △)'],
    leftstick: ['Press the left stick', '左スティックを押す', 'Appuyez sur le stick gauche'],
    rightstick: ['Press the right stick', '右スティックを押す', 'Appuyez sur le stick droit'],
    dpup: ['Press the D-pad up', '十字キーを上へ', 'Appuyez sur la croix vers le haut'],
    dpdown: ['Press the D-pad down', '十字キーを下へ', 'Appuyez sur la croix vers le bas'],
    dpleft: ['Press the D-pad left', '十字キーを左へ', 'Appuyez sur la croix vers la gauche'],
    dpright: ['Press the D-pad right', '十字キーを右へ', 'Appuyez sur la croix vers la droite'],
    start: ['Press Menu / Options', 'Menu / Options を押す', 'Appuyez sur Menu / Options'],
    back: ['Press View / Create', 'View / Create を押す', 'Appuyez sur View / Create'],
    leftshoulder: ['Press the left shoulder button', '左バンパーを押す', 'Appuyez sur la gâchette gauche'],
    rightshoulder: ['Press the right shoulder button', '右バンパーを押す', 'Appuyez sur la gâchette droite'],
    lefttrigger: ['Press the left trigger', '左トリガーを押す', 'Appuyez sur la gâchette gauche'],
    righttrigger: ['Press the right trigger', '右トリガーを押す', 'Appuyez sur la gâchette droite'],
  };
  const value = labels[key];
  if (!value) return '';
  const localized = {
    de: {leftx: 'Linken Stick nach rechts bewegen', lefty: 'Linken Stick nach unten bewegen', rightx: 'Rechten Stick nach rechts bewegen', righty: 'Rechten Stick nach unten bewegen', a: 'Untere Taste drücken (A / ×)', b: 'Rechte Taste drücken (B / ○)', x: 'Linke Taste drücken (X / □)', y: 'Obere Taste drücken (Y / △)', leftstick: 'Linken Stick drücken', rightstick: 'Rechten Stick drücken', dpup: 'Steuerkreuz nach oben drücken', dpdown: 'Steuerkreuz nach unten drücken', dpleft: 'Steuerkreuz nach links drücken', dpright: 'Steuerkreuz nach rechts drücken', start: 'Menu / Options drücken', back: 'View / Create drücken', leftshoulder: 'Linke Schultertaste drücken', rightshoulder: 'Rechte Schultertaste drücken', lefttrigger: 'Linken Trigger drücken', righttrigger: 'Rechten Trigger drücken'},
    it: {leftx: 'Sposta lo stick sinistro a destra', lefty: 'Sposta lo stick sinistro in basso', rightx: 'Sposta lo stick destro a destra', righty: 'Sposta lo stick destro in basso', a: 'Premi il pulsante in basso (A / ×)', b: 'Premi il pulsante a destra (B / ○)', x: 'Premi il pulsante a sinistra (X / □)', y: 'Premi il pulsante in alto (Y / △)', leftstick: 'Premi lo stick sinistro', rightstick: 'Premi lo stick destro', dpup: 'Premi il D-pad in alto', dpdown: 'Premi il D-pad in basso', dpleft: 'Premi il D-pad a sinistra', dpright: 'Premi il D-pad a destra', start: 'Premi Menu / Options', back: 'Premi View / Create', leftshoulder: 'Premi il pulsante dorsale sinistro', rightshoulder: 'Premi il pulsante dorsale destro', lefttrigger: 'Premi il grilletto sinistro', righttrigger: 'Premi il grilletto destro'},
    es: {leftx: 'Mueve la palanca izquierda a la derecha', lefty: 'Mueve la palanca izquierda hacia abajo', rightx: 'Mueve la palanca derecha a la derecha', righty: 'Mueve la palanca derecha hacia abajo', a: 'Pulsa el botón inferior (A / ×)', b: 'Pulsa el botón derecho (B / ○)', x: 'Pulsa el botón izquierdo (X / □)', y: 'Pulsa el botón superior (Y / △)', leftstick: 'Pulsa la palanca izquierda', rightstick: 'Pulsa la palanca derecha', dpup: 'Pulsa arriba en la cruceta', dpdown: 'Pulsa abajo en la cruceta', dpleft: 'Pulsa izquierda en la cruceta', dpright: 'Pulsa derecha en la cruceta', start: 'Pulsa Menu / Options', back: 'Pulsa View / Create', leftshoulder: 'Pulsa el botón superior izquierdo', rightshoulder: 'Pulsa el botón superior derecho', lefttrigger: 'Pulsa el gatillo izquierdo', righttrigger: 'Pulsa el gatillo derecho'},
  };
  if (localized[locale]?.[key]) return localized[locale][key];
  if (locale === 'ja') return value[1];
  if (locale === 'fr') return value[2];
  if (locale === 'zh-CN') return CALIBRATION_STEPS.find(step => step.key === key)?.label || value[0];
  if (locale === 'zh-TW') return (CALIBRATION_STEPS.find(step => step.key === key)?.label || value[0]).replaceAll('摇杆', '搖桿').replaceAll('按键', '按鍵').replaceAll('按下', '按下').replaceAll('上方', '上方').replaceAll('下方', '下方').replaceAll('左侧', '左側').replaceAll('右侧', '右側').replaceAll('十字键', '十字鍵').replaceAll('向右', '向右').replaceAll('向下', '向下').replaceAll('向左', '向左').replaceAll('向上', '向上');
  return value[0];
}

function calibrationMessage(message, step) {
  if (!message) return '';
  if (message === '松开所有按键，让摇杆回中') return tr('calibration.release');
  if (message === '这个输入已使用，请换一个') return tr('calibration.duplicate');
  if (message === '已识别 · 松开并回中') return tr('calibration.recognized');
  if (message === '这根摇杆轴已使用') return tr('calibration.axisUsed');
  if (message === '校准完成') return tr('calibration.complete');
  return calibrationLabel(step?.key) || message;
}

function renderCalibration() {
  if (!calibration) return;
  const step = calibration.step;
  $('calibration-progress').value = calibration.index;
  $('calibration-glyph').textContent = step?.glyph || '✓';
  $('calibration-prompt').textContent = calibrationMessage(calibration.message, step);
  const kind = step ? (step.required ? tr('calibration.required') : tr('calibration.optional')) : '';
  const progress = tr('calibration.progress', {current: calibration.index + 1, total: CALIBRATION_STEPS.length});
  $('calibration-note').textContent = calibration.done ? tr('calibration.saved') : tr('calibration.stepNote', {progress, kind, label: calibrationLabel(step?.key)});
  $('calibration-skip').hidden = calibration.done || step?.required;
  $('calibration-skip').disabled = calibration.waitRelease;
  $('calibration-save').hidden = !calibration.done;
}

function bindingRows() {
  document.querySelectorAll('[data-bind-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.bindMode === bindMode)));
  document.querySelectorAll('[data-bind-layer]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.bindLayer === bindLayer)));
  $('aux-hint').hidden = bindLayer !== 'auxiliary';
  const host = $('binding-rows');
  host.replaceChildren();
  for (const key of ['Y', 'A', 'X', 'B', 'Up', 'Left', 'Down', 'Right', 'Menu', 'View', 'LB', 'RB', 'LT', 'RT', 'R3']) {
    const row = document.createElement('div'); row.className = 'row';
    const label = document.createElement('label'); label.textContent = buttonLabel(key); label.htmlFor = `binding-${key}`;
    const select = document.createElement('select'); select.id = label.htmlFor; select.dataset.physical = key;
    const choices = bindLayer === 'auxiliary' ? {inherit: 'inherit', ...ACTIONS} : ACTIONS;
    for (const action of Object.keys(choices)) {
      if (bindLayer === 'auxiliary' && action === 'layer:auxiliary') continue;
      if (bindMode === 'idle' && !(action === 'none' || action === 'inherit' || action.startsWith('mouse') || action.startsWith('key:') || action.startsWith('modifier:') || action.startsWith('layer:') || action.startsWith('app:'))) continue;
      if (bindMode === 'typing' && (action.startsWith('left') || action === 'cycleLeft')) continue;
      const option = document.createElement('option'); option.value = action;
      option.textContent = bindMode === 'dual' && ['Y', 'A', 'X', 'B'].includes(action) ? tr('binding.dualRight', {label: actionLabel(locale, action)}) : actionLabel(locale, action);
      select.append(option);
    }
    const configKey = bindLayer === 'base' ? 'bindings' : 'auxiliaryBindings';
    select.value = appearance[configKey][bindMode][key];
    select.onchange = () => { const config = structuredClone(appearance[configKey]); config[bindMode][key] = select.value; changeAppearance({[configKey]: config}); };
    row.append(label, select); host.append(row);
  }
}

function showSystemReport(details = {}) {
  const lines = [];
  if (details.backend) lines.push(`${tr('system.diagnose.backend')}: ${details.backend}`);
  if (details.serviceRunning !== undefined) lines.push(`${tr('system.diagnose.service')}: ${details.serviceRunning ? tr('system.diagnose.ok') : tr('system.diagnose.failed')}`);
  if (details.inputLanguage) lines.push(`${tr('system.diagnose.inputLanguage')}: ${details.inputLanguage}`);
  if (Array.isArray(details.devices)) {
    lines.push(`${tr('system.diagnose.devices')}:`);
    for (const device of details.devices) lines.push(`  ${device.name || tr('device.none')} · ${device.mapped ? tr('system.diagnose.ok') : tr('system.diagnose.failed')}`);
  }
  if (Array.isArray(details.checks)) {
    for (const check of details.checks) lines.push(`${check.name}: ${check.ok ? tr('system.diagnose.ok') : tr('system.diagnose.failed')}`);
  }
  $('system-report').textContent = lines.join('\n');
  $('system-report').hidden = !lines.length;
}

async function runSystemAction(action) {
  const buttons = [...document.querySelectorAll('[data-system-action]')];
  buttons.forEach(button => { button.disabled = true; });
  $('system-status').classList.remove('error');
  $('system-status').textContent = tr('system.working');
  try {
    const result = await invoke('systemAction', {action}) ?? {ok: false, code: 'action-failed'};
    lastSystemResult = result;
    $('system-status').textContent = systemActionMessage(locale, result);
    $('system-status').classList.toggle('error', result.ok === false);
    if (action === 'diagnose') showSystemReport(result.details);
    return result;
  } catch (error) {
    $('system-status').textContent = tr('system.result.action-failed');
    $('system-status').classList.add('error');
    return {ok: false, code: 'action-failed', details: {message: error.message}};
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}

// Appearance and system subscriptions are intentionally optional so the settings page remains previewable outside Electron.
subscribe('onAppearance', renderAppearance);
subscribe('onSystem', setSystemView);
subscribe('onRuntime', runtime);
subscribe('onDesktop', image);
subscribe('onController', packet => { if (calibration && calibration.feed(packet.device?.id, packet.raw)) renderCalibration(); $('stick-dot').style.left = `${50 + (packet.connected ? packet.x : 0) * 40}%`; $('stick-dot').style.top = `${50 + (packet.connected ? packet.y : 0) * 40}%`; });

document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => renderPage(button.dataset.tab)));
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { previewMode = Number(button.dataset.mode); renderPreview(); }));
document.querySelectorAll('[data-layout]').forEach(button => button.addEventListener('click', () => { previewLayout = button.dataset.layout === 'dual' ? 'dual' : 'single'; renderPreview(); }));
for (const key of ['opacity', 'scale', 'deadzone']) $(key).oninput = event => changeAppearance({[key]: Number(event.target.value)});
document.querySelectorAll('[data-opacity]').forEach(button => button.onclick = () => changeAppearance({opacity: Number(button.dataset.opacity)}));
document.querySelectorAll('[data-ink]').forEach(button => button.onclick = () => changeAppearance({ink: button.dataset.ink}));
 $('left-disc').onchange = event => changeAppearance({leftDisc: Number(event.target.value)});
 $('right-disc').onchange = event => changeAppearance({rightDisc: Number(event.target.value)});
for (const [id, key] of Object.entries(fields)) $(id).oninput = event => changeAppearance({[key]: event.target.type === 'range' ? Number(event.target.value) : event.target.value, ...(key === 'textColor' ? {ink: 'custom'} : {})});
document.querySelectorAll('[data-bind-mode]').forEach(button => button.onclick = () => { bindMode = button.dataset.bindMode; bindingRows(); });
document.querySelectorAll('[data-bind-layer]').forEach(button => button.onclick = () => { bindLayer = button.dataset.bindLayer; bindingRows(); });

$('custom-style').onclick = () => { $('style-editor').hidden = !$('style-editor').hidden; $('custom-style').setAttribute('aria-expanded', String(!$('style-editor').hidden)); };
$('reset-style').onclick = () => { const defaults = normalizeAppearance(); changeAppearance(Object.fromEntries(['opacity', 'ink', 'scale', 'outlineColor', 'outlineWidth', 'fillColor', 'textColor'].map(key => [key, defaults[key]]))); };
$('custom-buttons').onclick = () => { $('bindings-editor').hidden = !$('bindings-editor').hidden; $('custom-buttons').setAttribute('aria-expanded', String(!$('bindings-editor').hidden)); bindingRows(); };
$('reset-bindings').onclick = () => changeAppearance({bindings: normalizeBindings(), auxiliaryBindings: normalizeAuxiliary()});
document.querySelectorAll('[data-quick]').forEach(button => button.onclick = () => { bindMode = liveLayout === 'dual' ? 'dual' : 'typing'; bindLayer = 'base'; $('bindings-editor').hidden = false; $('custom-buttons').setAttribute('aria-expanded', 'true'); bindingRows(); $(`binding-${button.dataset.quick}`).focus(); });

$('controller-select').onchange = async event => { try { await controllerAction({action: 'select', id: event.target.value}); } catch (error) { $('error').textContent = error.message; } };
async function controllerAction(value) { const result = await invoke('controllerAction', value); if (!result?.ok) throw Error(result?.error || tr('system.result.action-failed')); return result; }
$('calibrate').onclick = () => { calibrationDevice = devices.find(device => device.id === selectedId); if (!calibrationDevice) return; calibration = null; $('calibration-device').textContent = calibrationDevice.name; $('calibration-start').hidden = false; $('calibration-save').hidden = $('calibration-skip').hidden = true; $('calibration-progress').value = 0; $('calibration-glyph').textContent = 'Ⓛ Ⓡ'; $('calibration-prompt').textContent = tr('calibration.release'); $('calibration-note').textContent = tr('calibration.note'); $('calibration-dialog').showModal(); };
$('calibration-start').onclick = async () => { try { await controllerAction({action: 'capture', id: calibrationDevice.id}); calibration = new Calibration(calibrationDevice.id, calibrationDevice.guid); $('calibration-start').hidden = true; renderCalibration(); } catch (error) { $('calibration-prompt').textContent = error.message; } };
$('calibration-skip').onclick = () => { calibration?.skip(); renderCalibration(); };
async function cancelCalibration() { calibration = null; calibrationDevice = null; if ($('calibration-dialog').open) $('calibration-dialog').close(); await invoke('controllerAction', {action: 'cancel'}); }
$('calibration-cancel').onclick = cancelCalibration; $('calibration-dialog').addEventListener('cancel', event => { event.preventDefault(); cancelCalibration(); });
$('calibration-save').onclick = async () => { try { await controllerAction({action: 'mapping', id: calibrationDevice.id, mapping: calibration.mapping()}); calibration = null; calibrationDevice = null; $('calibration-dialog').close(); } catch (error) { $('calibration-prompt').textContent = error.message; } };
$('reset-controller').onclick = async () => { try { await controllerAction({action: 'mapping', id: selectedId, mapping: null}); } catch (error) { $('error').textContent = error.message; } };

$('enabled').onchange = async event => runtime(await invoke('setEnabled', event.target.checked) ?? {enabled: event.target.checked});
$('done').onclick = () => invoke('windowAction', 'minimize');
$('close-window').onclick = () => invoke('windowAction', 'close');
$('more').onclick = () => renderPage('system');
$('refresh').onclick = async () => { $('refresh').disabled = true; const result = await invoke('captureDesktop'); if (result?.image) image(result.image); else $('capture-message').textContent = tr('preview.captureFailed'); $('refresh').disabled = false; };

$('system-locale').onchange = event => changeSystem({locale: event.target.value});
$('system-theme').onchange = event => changeSystem({theme: event.target.value});
$('system-startup').onchange = event => changeSystem({startAtLogin: event.target.checked});
$('system-close').onchange = event => changeSystem({closeBehavior: event.target.value});
document.querySelectorAll('[data-system-action]').forEach(button => button.addEventListener('click', () => runSystemAction(button.dataset.systemAction)));

new ResizeObserver(resize).observe(document.querySelector('.preview-wheel-space'));
watchSystemTheme(() => { if (system.theme === 'system') { applyResolvedTheme(); renderAppearance(appearance); } });

setSystemView(system);
renderAppearance(appearance);
runtime(await invoke('getRuntime') ?? {});
renderPage('appearance');
document.body.dataset.ready = 'true';
