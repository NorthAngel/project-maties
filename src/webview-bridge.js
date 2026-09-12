(function installWebViewBridge() {
  'use strict';

  const webview = window.chrome && window.chrome.webview;
  if (!webview || typeof webview.postMessage !== 'function' || typeof webview.addEventListener !== 'function') {
    return;
  }

  const timeoutMs = 60000;
  const pending = new Map();
  const subscriptions = new Map();
  let serial = 0;

  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const nextId = () => String(++serial);
  const failure = value => {
    if (value instanceof Error) return value;
    if (typeof value === 'string' && value) return new Error(value);
    if (value && typeof value.message === 'string' && value.message) return new Error(value.message);
    return new Error('Native request failed');
  };

  function request(method, args) {
    if (typeof method !== 'string' || !method) return Promise.reject(new TypeError('method must be a non-empty string'));
    const id = nextId();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('Native request timed out: ' + method));
      }, timeoutMs);
      pending.set(id, {resolve, reject, timer});
      try {
        webview.postMessage({id, method, args});
      } catch (error) {
        clearTimeout(timer);
        pending.delete(id);
        reject(error);
      }
    });
  }

  function notify(method, args) {
    if (typeof method !== 'string' || !method) throw new TypeError('method must be a non-empty string');
    const id = nextId();
    webview.postMessage({id, method, args});
    return id;
  }

  function on(event, callback) {
    if (typeof event !== 'string' || !event) throw new TypeError('event must be a non-empty string');
    if (typeof callback !== 'function') throw new TypeError('callback must be a function');
    let callbacks = subscriptions.get(event);
    if (!callbacks) subscriptions.set(event, callbacks = new Set());
    callbacks.add(callback);
    return () => {
      callbacks.delete(callback);
      if (!callbacks.size) subscriptions.delete(event);
    };
  }

  webview.addEventListener('message', event => {
    const message = event && event.data;
    if (!message || typeof message !== 'object' || Array.isArray(message)) return;

    if (own(message, 'id') && (own(message, 'result') || own(message, 'error'))) {
      const id = String(message.id);
      const waiter = pending.get(id);
      if (!waiter) return;
      clearTimeout(waiter.timer);
      pending.delete(id);
      if (own(message, 'error') && message.error !== null && message.error !== undefined) {
        waiter.reject(failure(message.error));
      } else {
        waiter.resolve(message.result);
      }
      return;
    }

    if (typeof message.event !== 'string' || !message.event || !own(message, 'payload')) return;
    const callbacks = subscriptions.get(message.event);
    if (!callbacks) return;
    for (const callback of [...callbacks]) {
      try {
        callback(message.payload);
      } catch (error) {
        console.error(error);
      }
    }
  });

  const host = Object.freeze({request, notify, on});
  window.host = host;

  const desktop = {
    getSystem: () => request('system.get'),
    setSystem: value => request('system.set', value),
    onSystem: callback => on('system', callback),
    systemAction: value => request('system.action', value),
    controllerAction: value => request('controller.request', value),
    getAppearance: () => request('appearance.get'),
    setAppearance: value => request('appearance.save', value),
    onAppearance: callback => on('appearance', callback),
    getRuntime: () => request('runtime.get'),
    onRuntime: callback => on('runtime', callback),
    onController: callback => on('controller', callback),
    captureDesktop: () => request('desktop.preview'),
    onDesktop: callback => on('desktop-preview', callback),
    windowAction: action => request('window.action', action),
    setEnabled: () => Promise.reject(new Error('Settings runtime is not ready')),
    menu: () => request('app.menu'),
  };
  window.desktop = desktop;

  const root = typeof document === 'object' ? document.documentElement : null;
  if (root && root.dataset && !root.dataset.hostRole) {
    const path = String(window.location && window.location.pathname || '');
    if (/overlay\.html$/i.test(path)) root.dataset.hostRole = 'overlay';
    else if (/settings\.html$/i.test(path)) root.dataset.hostRole = 'settings';
  }

  if (typeof document === 'object' && typeof document.addEventListener === 'function') {
    document.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) return;
      const target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      if (!target.closest('[app-region="drag"]')) return;
      if (target.closest('button,input,select,textarea,a,[contenteditable="true"]')) return;
      notify('window.action', 'drag');
    });
  }
}());
