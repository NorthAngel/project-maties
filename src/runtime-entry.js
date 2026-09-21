import {RuntimeEngine} from './runtime-engine.js';

const host = window.host;
const rootRole = document.documentElement?.dataset?.hostRole;
const path = String(window.location?.pathname || '');
const role = rootRole || (/overlay\.html$/i.test(path) ? 'overlay' : 'settings');

let runtimeReady = Promise.resolve(null);

if (host && role === 'settings') {
  const request = (method, args) => host.request(method, args);
  const platform = {
    send: command => request('native.send', command),
    emit: (event, payload) => request('event.emit', {event, payload}),
    overlay: (active, packet, appearance, layout) => request('overlay.set', {
      active,
      packet,
      appearance,
      layout,
    }),
    saveAppearance: value => request('appearance.save', value),
    saveControllers: value => request('controllers.save', value),
    controller: command => request('controller.request', command),
  };

  runtimeReady = request('bootstrap').then(async bootstrap => {
    const engine = new RuntimeEngine(platform, bootstrap);
    await engine.ready;
    return engine;
  });

  const runWithEngine = callback => payload => runtimeReady
    .then(engine => callback(engine, payload))
    .catch(error => console.error(error));

  host.on('native', runWithEngine((engine, message) => engine.native(message)));
  host.on('stop', runWithEngine(engine => engine.stop()));
  host.on('maintenance', runWithEngine((engine, value) => engine.setMaintenance(value)));


  const desktop = window.desktop && typeof window.desktop === 'object' ? window.desktop : {};
  Object.assign(desktop, {
    getSystem: () => request('system.get'),
    setSystem: value => request('system.set', value),
    onSystem: callback => host.on('system', callback),
    systemAction: value => request('system.action', value),
    controllerAction: value => runtimeReady.then(engine => engine.controllerAction(value)),
    getAppearance: () => runtimeReady.then(engine => engine.getAppearance()),
    setAppearance: value => runtimeReady.then(engine => engine.setAppearance(value)),
    onAppearance: callback => host.on('appearance', callback),
    getRuntime: () => runtimeReady.then(engine => engine.getRuntime()),
    onRuntime: callback => host.on('runtime', callback),
    onController: callback => host.on('controller', callback),
    windowAction: action => request('window.action', action),
    setEnabled: value => runtimeReady.then(engine => engine.setEnabled(value)),
    menu: () => request('app.menu'),
  });
  window.desktop = desktop;

  host.notify('engine.ready');
}

export {runtimeReady};
