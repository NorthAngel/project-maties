import test from 'node:test';
import assert from 'node:assert/strict';
import {LOCALES, REQUIRED_KEYS, getLocale, systemActionMessage, translate} from '../src/i18n.js';
import {normalizeTheme, resolveTheme} from '../src/theme.js';
import {normalizeAppearance, applyWheelStyle} from '../src/appearance.js';

test('all supported locales provide every settings and runtime string', () => {
  assert.deepEqual(LOCALES, ['zh-CN', 'en', 'ja']);
  for (const locale of LOCALES) {
    const dictionary = getLocale(locale);
    for (const key of REQUIRED_KEYS) {
      assert.equal(typeof dictionary[key], 'string', `${locale} is missing ${key}`);
      assert.notEqual(dictionary[key].trim(), '', `${locale} has an empty ${key}`);
      assert.notEqual(translate(locale, key), key, `${locale} has an untranslated ${key}`);
    }
  }
});

test('translation interpolation and locale fallback stay deterministic', () => {
  assert.equal(translate('en', 'calibration.progress', {current: 2, total: 20}), 'Step 2 of 20');
  assert.equal(translate('bad-locale', 'page.appearance.title'), translate('zh-CN', 'page.appearance.title'));
  assert.equal(translate('en', 'unknown.key'), 'unknown.key');
  assert.equal(systemActionMessage('en', {ok: false, code: 'repair-service-timeout'}), 'The action failed. Try again later.');
});

test('theme values normalize and resolve against the operating-system preference', () => {
  assert.equal(normalizeTheme('system'), 'system');
  assert.equal(normalizeTheme('light'), 'light');
  assert.equal(normalizeTheme('dark'), 'dark');
  assert.equal(normalizeTheme('sepia'), 'system');
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('wheel follows the approved theme palette and ignores removed custom colors', () => {
  const root = {dataset: {theme: 'light'}, style: {values: {}, setProperty(name, value) { this.values[name] = value; }}};
  applyWheelStyle(normalizeAppearance({}), root);
  assert.equal(root.style.values['--glyph-color'], 'rgba(0,0,0,.65)');
  assert.equal(root.style.values['--material-color'], '#ffffff');
  root.dataset.theme = 'dark';
  applyWheelStyle(normalizeAppearance({}), root);
  assert.equal(root.style.values['--glyph-color'], 'rgba(255,255,255,.65)');
  assert.equal(root.style.values['--material-color'], '#484848');
  applyWheelStyle(normalizeAppearance({ink: 'custom', textColor: '#123456', fillColor: '#abcdef'}), root);
  assert.equal(root.style.values['--glyph-color'], 'rgba(255,255,255,.65)');
  assert.equal(root.style.values['--material-color'], '#484848');
});
