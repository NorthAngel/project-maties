import {migrateSettings, normalizeAppearance} from './appearance.js';
import {deviceKey, normalizeControllerSettings, getDeviceProfile, setDeviceProfile} from './device-profiles.js';
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
    this.controllers = normalizeControllerSettings(bootstrap?.controllers);
    this.ownPid = Number.isInteger(bootstrap?.ownPid) ? bootstrap.ownPid : -1;
    this.testing = bootstrap?.testing === true;
    this.inventory = inventory();
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
    this.emit('appearance', this.getAppearance());
    try {
      await this.requestController({
        type: 'controller',
        action: 'configure',
        config: {preferredKey:this.controllers.preferredKey},
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
      buttons: this.lastPacket?.buttons ?? 0,
      layout: this.session.active ? this.session.layout : this.appearance.keyboardMode,
      ...this.model(this.session.radial),
      left: this.model(this.session.leftRadial),
      right: this.model(this.session.radial),
    };
    return value;
  }

  getAppearance() {
    return copy({...this.appearance,...getDeviceProfile(this.controllers,this.lastPacket?.device)});
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
    if (!this.lastPacket?.connected) return Promise.reject(new Error('手柄未接入'));
    if (Object.keys(patch).some(key => RESETTING_APPEARANCE_KEYS.has(key))) this.stop();
    const devicePatch=Object.fromEntries(Object.entries(patch).filter(([key])=>['bindings','deadzoneLeft','deadzoneRight'].includes(key)));
    const globalPatch=Object.fromEntries(Object.entries(patch).filter(([key])=>!['bindings','deadzoneLeft','deadzoneRight'].includes(key)));
    this.controllers=setDeviceProfile(this.controllers,this.lastPacket.device,devicePatch);
    this.appearance=normalizeAppearance({...this.appearance,...globalPatch});

    let saved;
    try {
      const globalSettings=Object.fromEntries(Object.entries(this.appearance).filter(([key])=>!['bindings','deadzoneLeft','deadzoneRight'].includes(key)));
      saved = Promise.all([this.platform.saveAppearance(globalSettings),this.platform.saveControllers(this.getControllerConfig())]);
    } catch (error) {
      saved = Promise.reject(error);
    }

    this.emit('appearance', this.getAppearance());
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

    });
  }

  feed(packet, now) {
    if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return this.getRuntime();
    const previous=this.lastPacket;
    if(previous?.connected&&(!packet.connected||packet.slot!==previous.slot||packet.target!==previous.target))this.stop();
    this.lastPacket = copy(packet);
    if(deviceKey(previous?.device)!==deviceKey(packet.device)||previous?.connected!==packet.connected)this.emit('appearance',this.getAppearance());

    this.emitController(packet);

    const wasActive = this.session.active;
    const oldShift = this.session.radial.shift;
    const oldLayout = this.session.layout;
    const allowed = this.enabled
      && !this.bridgeError
      && packet.ready !== false
      && !this.maintenance;
    const timestamp = Number.isFinite(now)
      ? now
      : (globalThis.performance?.now?.() ?? Date.now());
    const result = this.session.step(packet, timestamp, {
      ...this.getAppearance(),
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
      ...this.getAppearance(),
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
      } else if(event.type==='ime'){
        if(packet.pid!==this.ownPid)this.send({type:'ime',action:'cycle',target:packet.target});
      } else {
        this.send({...event, action: event.type, type: 'pointer'});
      }
    }

    return this.publish(false, result.pulses);
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
      const device=this.inventory.items.find(item=>item.id===value?.id);
      if(value.action!=='select'||!device)throw new Error('手柄已断开');
      this.stop();
      await this.requestController({type:'controller',action:'select',deviceId:device.id});
      this.controllers.preferredKey=deviceKey(device);
      await this.saveControllerConfig();
      this.emit('appearance',this.getAppearance());
      return {ok:true};
    } catch(error){return {ok:false,error:errorMessage(error,CONTROLLER_ERROR)};}
  }
}
