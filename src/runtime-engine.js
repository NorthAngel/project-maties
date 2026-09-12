import {migrateSettings, normalizeAppearance} from './appearance.js';
import {validMapping} from './calibration.js';
import {InputSession} from './session.js';
import {PointerInput} from './pointer.js';

const SAVE_APPEARANCE_ERROR = '设置未能保存';
const CONTROLLER_ERROR = '手柄操作失败';
const RESETTING_APPEARANCE_KEYS = new Set([
  'bindings',
  'auxiliaryBindings',
  'keyboardMode',
  'chordInterval',
  'leftDisc',
  'rightDisc',
]);

const noOp = () => undefined;
const noOpAsync = async () => ({ok: true});

function copy(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function errorMessage(error, fallback) {
  const message = typeof error === 'string' ? error : error?.message;
  return typeof message === 'string' && message ? message : fallback;
}

function controllerConfig(value = {}) {
  const mappings = value?.mappings && typeof value.mappings === 'object'
    ? Object.fromEntries(Object.entries(value.mappings).filter(([guid, mapping]) => validMapping(guid, mapping)))
    : {};
  return {
    preferredGuid: typeof value?.preferredGuid === 'string' ? value.preferredGuid : '',
    mappings,
  };
}

function inventory(value = {}) {
  return {
    items: Array.isArray(value?.items) ? copy(value.items) : [],
    selected: typeof value?.selected === 'string' ? value.selected : null,
    backend: typeof value?.backend === 'string' ? value.backend : '',
    warning: typeof value?.warning === 'string' ? value.warning : '',
  };
}

export class RuntimeEngine {
  constructor(platform = {}, bootstrap = {}) {
    this.platform = {
      send: typeof platform.send === 'function' ? platform.send.bind(platform) : noOp,
      emit: typeof platform.emit === 'function' ? platform.emit.bind(platform) : noOp,
      overlay: typeof platform.overlay === 'function' ? platform.overlay.bind(platform) : noOp,
      saveAppearance: typeof platform.saveAppearance === 'function' ? platform.saveAppearance.bind(platform) : noOp,
      saveControllers: typeof platform.saveControllers === 'function' ? platform.saveControllers.bind(platform) : noOp,
      controller: typeof platform.controller === 'function' ? platform.controller.bind(platform) : noOpAsync,
    };
    this.appearance = migrateSettings(bootstrap?.appearance ?? {});
    this.controllers = controllerConfig(bootstrap?.controllers);
    this.ownPid = Number.isInteger(bootstrap?.ownPid) ? bootstrap.ownPid : -1;
    this.testing = bootstrap?.testing === true;
    this.inventory = inventory();
    this.calibrating = false;
    this.calibrationId = null;
    this.enabled = true;
    this.maintenance = false;
    this.bridgeError = '';
    this.lastPacket = null;
    this.lastState = '';
    this.session = new InputSession();
    this.pointer = new PointerInput();
    this.ready = this.initialize();
  }

  async initialize() {
    this.emit('appearance', this.appearance);
    try {
      await this.requestController({
        type: 'controller',
        action: 'configure',
        config: this.getControllerConfig(),
      });
      this.publish(true);
    } catch (error) {
      this.bridgeError = errorMessage(error, CONTROLLER_ERROR);
      this.stop();
    }
    return this;
  }

  effect(callback) {
    try {
      const result = callback();
      if (result && typeof result.then === 'function') result.catch(noOp);
    } catch {
      // Helper input and UI broadcasts are intentionally fire-and-forget.
    }
  }

  send(command) {
    this.effect(() => this.platform.send(copy(command)));
  }

  emit(event, payload) {
    this.effect(() => this.platform.emit(event, copy(payload)));
  }

  setOverlay(active, packet = this.lastPacket) {
    const layout = this.session.active ? this.session.layout : this.appearance.keyboardMode;
    this.effect(() => this.platform.overlay(active, copy(packet), this.getAppearance(), layout));
  }

  async requestController(command) {
    const result = await this.platform.controller(copy(command));
    if (result?.ok === false) throw new Error(errorMessage(result.error, CONTROLLER_ERROR));
    return result;
  }

  model(radial) {
    return {mode: radial.mode, selected: radial.selected, shift: radial.shift};
  }

  getRuntime() {
    const value = {
      active: this.session.active,
      connected: Boolean(this.lastPacket?.connected),
      enabled: this.enabled,
      error: this.bridgeError,
      inputLanguage: this.lastPacket?.inputLanguage || '',
      device: copy(this.lastPacket?.device),
      devices: copy(this.inventory.items),
      selectedDevice: this.inventory.selected,
      backend: this.inventory.backend,
      warning: this.inventory.warning,
      calibrating: this.calibrating,
      layout: this.session.active ? this.session.layout : this.appearance.keyboardMode,
      ...this.model(this.session.radial),
      left: this.model(this.session.leftRadial),
      right: this.model(this.session.radial),
    };
    return value;
  }

  getAppearance() {
    return copy(this.appearance);
  }

  getControllerConfig() {
    return copy(this.controllers);
  }

  publish(force = false, pulses = []) {
    const value = this.getRuntime();
    const key = JSON.stringify(value);
    if (force || key !== this.lastState || pulses.length) {
      this.lastState = key;
      this.emit('runtime', {...value, pulses: copy(pulses)});
    }
    return value;
  }

  stop() {
    this.session.stop();
    this.pointer.reset();
    this.send({type: 'end'});
    this.setOverlay(false);
    return this.publish(true);
  }

  setAppearance(value = {}) {
    const patch = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    if (Object.keys(patch).some(key => RESETTING_APPEARANCE_KEYS.has(key))) this.stop();
    this.appearance = normalizeAppearance({...this.appearance, ...patch});

    let saved;
    try {
      saved = this.platform.saveAppearance(this.getAppearance());
    } catch (error) {
      saved = Promise.reject(error);
    }

    this.emit('appearance', this.appearance);
    if (this.session.active) this.setOverlay(true);
    this.publish(true);

    return Promise.resolve(saved).then(
      () => this.getAppearance(),
      error => {
        this.bridgeError = SAVE_APPEARANCE_ERROR;
        this.publish(true);
        throw error;
      },
    );
  }

  setEnabled(value) {
    this.enabled = value === true;
    return this.stop();
  }

  setMaintenance(value) {
    this.maintenance = value === true;
    if (this.maintenance) return this.stop();
    return this.publish(true);
  }

  syncSession(wasActive, packet) {
    if (wasActive && !this.session.active) {
      this.send({type: 'end'});
      this.pointer.reset();
      this.setOverlay(false, packet);
    }
    if (!wasActive && this.session.active) {
      this.send({type: 'begin', target: this.session.target});
      this.pointer.reset();
      this.setOverlay(true, packet);
    }
  }

  emitController(packet) {
    this.emit('controller', {
      connected: Boolean(packet.connected),
      x: Number(packet.x) || 0,
      y: Number(packet.y) || 0,
      buttons: Number(packet.buttons) || 0,
      device: copy(packet.device),
      raw: this.calibrating ? copy(packet.raw) : undefined,
    });
  }

  feed(packet, now) {
    if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return this.getRuntime();
    this.lastPacket = copy(packet);

    if (this.calibrating && (!packet.connected || packet.slot !== this.calibrationId)) {
      this.cancelCalibration().catch(error => {
        this.bridgeError = errorMessage(error, CONTROLLER_ERROR);
        this.publish(true);
      });
    }
    this.emitController(packet);

    const wasActive = this.session.active;
    const oldShift = this.session.radial.shift;
    const oldLayout = this.session.layout;
    const allowed = this.enabled
      && !this.bridgeError
      && packet.ready !== false
      && !this.calibrating
      && !this.maintenance;
    const timestamp = Number.isFinite(now)
      ? now
      : (globalThis.performance?.now?.() ?? Date.now());
    const result = this.session.step(packet, timestamp, {
      ...this.appearance,
      enabled: allowed,
      ownPid: this.ownPid,
    });

    this.syncSession(wasActive, packet);
    if (this.session.active && oldLayout !== this.session.layout) {
      this.pointer.reset();
      this.send({type: 'shift', value: false});
      this.setOverlay(true, packet);
    }
    if (result.imeSwitch && allowed && packet.pid !== this.ownPid) {
      this.send({type: 'ime', action: 'cycle', target: packet.target});
    }

    if (this.session.active) {
      if (oldShift !== this.session.radial.shift) {
        this.send({type: 'shift', value: this.session.radial.shift});
      }
      for (const event of result.events) {
        this.send({type: 'input', action: event.type, value: event.value});
      }
      if (result.opacity) {
        this.setAppearance({opacity: this.appearance.opacity + result.opacity}).catch(noOp);
      }
    }

    const pointerPacket = {...packet, buttons: result.pointerButtons};
    const liveAppearance = {
      ...this.appearance,
      keyboardMode: this.session.active ? this.session.layout : this.appearance.keyboardMode,
    };
    const events = [];
    if (result.tapR3 && allowed) {
      events.push(...this.pointer.step(
        {...pointerPacket, buttons: pointerPacket.buttons | 128},
        this.session.active,
        liveAppearance,
        timestamp,
        allowed,
      ));
    }
    events.push(...this.pointer.step(pointerPacket, this.session.active, liveAppearance, timestamp, allowed));
    for (const event of events) {
      if (event.type === 'keyboard') {
        const before = this.session.active;
        this.session.toggle(packet, this.ownPid, this.appearance);
        this.syncSession(before, packet);
      } else {
        this.send({...event, action: event.type, type: 'pointer'});
      }
    }

    return this.publish(false, result.pulses);
  }

  async cancelCalibration() {
    this.calibrating = false;
    this.calibrationId = null;
    const request = this.requestController({
      type: 'controller',
      action: 'capture',
      deviceId: this.inventory.selected,
      value: false,
    });
    this.stop();
    return request;
  }

  async native(message) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) return this.getRuntime();
    if (message.type === 'error') {
      this.bridgeError = errorMessage(message.message, '输入服务已停止，请重新打开软件');
      return this.stop();
    }
    if (message.type === 'ime-result') {
      if (message.ok === false) this.emit('system-notice', {code: 'ime-unavailable'});
      return this.getRuntime();
    }
    if (message.type === 'ready' || message.type === 'service-ready') {
      this.bridgeError = '';
      return this.publish(true);
    }
    if (message.type === 'devices') {
      this.inventory = inventory(message);
      if (this.calibrating && (
        this.inventory.selected !== this.calibrationId
        || !this.inventory.items.some(device => device.id === this.calibrationId)
      )) {
        try {
          await this.cancelCalibration();
        } catch (error) {
          this.bridgeError = errorMessage(error, CONTROLLER_ERROR);
        }
      }
      return this.publish(true);
    }
    if (message.type === 'state') return this.feed(message);
    return this.getRuntime();
  }

  async saveControllerConfig() {
    await this.platform.saveControllers(this.getControllerConfig());
  }

  async controllerAction(value = {}) {
    try {
      if (value?.action === 'cancel') {
        await this.cancelCalibration();
        return {ok: true};
      }

      const device = this.inventory.items.find(item => item.id === value?.id);
      if (!device) throw new Error('手柄已断开');

      if (value.action === 'select') {
        await this.cancelCalibration();
        await this.requestController({
          type: 'controller',
          action: 'select',
          deviceId: device.id,
        });
        this.controllers.preferredGuid = device.guid;
        await this.saveControllerConfig();
      } else if (value.action === 'capture') {
        this.stop();
        await this.requestController({
          type: 'controller',
          action: 'capture',
          deviceId: device.id,
          value: true,
        });
        this.calibrating = true;
        this.calibrationId = device.id;
        this.publish(true);
      } else if (value.action === 'mapping') {
        if (value.mapping !== null && !validMapping(device.guid, value.mapping)) {
          throw new Error('校准数据不完整');
        }
        await this.requestController({
          type: 'controller',
          action: 'mapping',
          deviceId: device.id,
          mapping: value.mapping,
        });
        this.calibrating = false;
        this.calibrationId = null;
        this.stop();
        if (value.mapping === null) delete this.controllers.mappings[device.guid];
        else this.controllers.mappings[device.guid] = value.mapping;
        await this.saveControllerConfig();
      } else {
        throw new Error('未知操作');
      }
      return {ok: true};
    } catch (error) {
      try {
        await this.cancelCalibration();
      } catch {
        // Preserve the error from the requested controller action.
      }
      return {ok: false, error: errorMessage(error, CONTROLLER_ERROR)};
    }
  }
}
