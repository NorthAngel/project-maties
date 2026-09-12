/**
 * 輸入層：遊戲邏輯只讀語意動作（jump / dash），永遠不直接讀 buttons[3]。
 *
 * 提供：徑向死區、邊緣偵測（本幀剛按下 vs 持續按住）、重新配鍵擷取、
 * 非標準裝置 fallback、鍵盤共用、震動。
 */

// ---------------------------------------------------------------------------
// W3C standard mapping 佈局
// ---------------------------------------------------------------------------

/** 標準佈局按鍵索引 → 語意名稱（XInput 命名）。 */
export const STANDARD_BUTTONS = [
  'FACE_DOWN', // 0  XInput A —— Pro 2 上實體標示是 B
  'FACE_RIGHT', // 1  XInput B —— 實體標示是 A
  'FACE_LEFT', // 2  XInput X —— 實體標示是 Y
  'FACE_UP', // 3  XInput Y —— 實體標示是 X
  'L1',
  'R1',
  'L2', // 6  類比，讀 .value
  'R2', // 7  類比，讀 .value
  'SELECT',
  'START',
  'L3',
  'R3',
  'DPAD_UP',
  'DPAD_DOWN',
  'DPAD_LEFT',
  'DPAD_RIGHT',
  'HOME',
]

export const STANDARD_AXES = {
  LEFT: [0, 1],
  RIGHT: [2, 3], // Y 軸向上為負
}

/**
 * mapping !== "standard" 時的 fallback 表。key 是 gamepad.id 的比對片段
 * （小寫），value 是「標準索引 → 實際索引」的覆寫。
 *
 * Pro 2 在 X mode 下 Chrome/Firefox 都給 standard，用不到這裡；
 * 這是為 D mode、Safari、以及冷門手把留的逃生門。
 */
export const FALLBACK_PROFILES = [
  {
    match: /8bitdo.*pro 2|045e.*028e/i,
    // D mode 下的 8BitDo：面鍵順序與標準一致，但十字鍵走 axes[9] 的 hat switch。
    buttons: null, // null = 沿用標準索引
    hatAxis: 9,
  },
]

/** HID hat switch 的 8 個方向，順時針從正上方起算。 */
const HAT_DIRECTIONS = [
  ['DPAD_UP'],
  ['DPAD_UP', 'DPAD_RIGHT'],
  ['DPAD_RIGHT'],
  ['DPAD_DOWN', 'DPAD_RIGHT'],
  ['DPAD_DOWN'],
  ['DPAD_DOWN', 'DPAD_LEFT'],
  ['DPAD_LEFT'],
  ['DPAD_UP', 'DPAD_LEFT'],
]

const NO_HAT = Object.freeze([])

/**
 * 解讀 hat switch 軸值 → 方向名稱陣列。
 *
 * 8 個方向平均分佈在 [-1, 1]（上 = -1，每格 2/7），中立時瀏覽器回一個超出 1
 * 的值（Chrome 給 ~1.2857），所以 >1.1 一律視為沒按。
 *
 * 另外擋掉接近 0 的值：真正的 hat 永遠不會回 0（最靠近的兩格是 ±0.1429），
 * 所以讀到 0 代表這根軸根本不是 hat —— 若不擋，會變成十字鍵一直按著「下」。
 */
export function readHat(value) {
  if (typeof value !== 'number' || value > 1.1 || value < -1.1) return NO_HAT
  if (Math.abs(value) < 0.07) return NO_HAT
  return HAT_DIRECTIONS[Math.round((value + 1) * 3.5)] ?? NO_HAT
}

// ---------------------------------------------------------------------------
// 預設 binding：語意動作 → 來源
// ---------------------------------------------------------------------------

export const DEFAULT_BINDINGS = {
  jump: { pad: 'FACE_DOWN', key: 'Space' },
  dash: { pad: 'FACE_RIGHT', key: 'ShiftLeft' },
  attack: { pad: 'FACE_LEFT', key: 'KeyJ' },
  interact: { pad: 'FACE_UP', key: 'KeyE' },
  pause: { pad: 'START', key: 'Escape' },
  up: { pad: 'DPAD_UP', key: 'KeyW' },
  down: { pad: 'DPAD_DOWN', key: 'KeyS' },
  left: { pad: 'DPAD_LEFT', key: 'KeyA' },
  right: { pad: 'DPAD_RIGHT', key: 'KeyD' },
}

// ---------------------------------------------------------------------------

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * 徑向死區。逐軸做死區會讓對角線變形，所以用向量長度判斷，
 * 並把 [deadzone, 1] 重新映射回 [0, 1]，避免出死區時數值突跳。
 */
export function applyRadialDeadzone(x, y, deadzone = 0.12) {
  const mag = Math.hypot(x, y)
  if (mag < deadzone) return { x: 0, y: 0, magnitude: 0 }
  const scaled = clamp01((mag - deadzone) / (1 - deadzone))
  const k = scaled / mag
  return { x: x * k, y: y * k, magnitude: scaled }
}

export class InputManager {
  /**
   * @param {object} [opts]
   * @param {object} [opts.bindings]  語意動作 → { pad, key }
   * @param {number} [opts.deadzone]  Pro 2 是電位計搖桿會漂移，0.12 是必要值不是可選項
   * @param {number} [opts.triggerThreshold] 類比扳機視為「按下」的門檻
   */
  constructor({ bindings = DEFAULT_BINDINGS, deadzone = 0.12, triggerThreshold = 0.3 } = {}) {
    this.bindings = structuredClone(bindings)
    this.deadzone = deadzone
    this.triggerThreshold = triggerThreshold

    /** @type {number|null} 目前使用的 gamepad index */
    this.padIndex = null
    /** @type {Gamepad|null} 本幀快照 */
    this.pad = null
    this.mapping = null
    this.id = null

    /** @type {object|null} 本幀生效的 fallback profile（mapping 為 standard 時是 null） */
    this._profile = null
    /** @type {readonly string[]} 本幀 hat switch 指出的方向 */
    this._hat = NO_HAT
    this._prev = new Set()
    this._curr = new Set()
    this._keys = new Set()
    this._rebind = null

    this._onGamepadConnected = (e) => {
      if (this.padIndex === null) this.padIndex = e.gamepad.index
    }
    this._onGamepadDisconnected = (e) => {
      if (this.padIndex === e.gamepad.index) this.padIndex = null
    }
    this._onKeyDown = (e) => {
      this._keys.add(e.code)
      if (this._rebind) {
        this._resolveRebind({ key: e.code })
        e.preventDefault()
      }
    }
    this._onKeyUp = (e) => this._keys.delete(e.code)
  }

  attach() {
    window.addEventListener('gamepadconnected', this._onGamepadConnected)
    window.addEventListener('gamepaddisconnected', this._onGamepadDisconnected)
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
    return this
  }

  detach() {
    window.removeEventListener('gamepadconnected', this._onGamepadConnected)
    window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnected)
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
  }

  /** 每幀呼叫一次。getGamepads() 回傳的是快照，不能存起來重複讀。 */
  poll() {
    const pads = navigator.getGamepads?.() ?? []

    // 手把要先按一下任意鍵才會出現在清單裡，所以每幀都要重新找。
    if (this.padIndex === null || !pads[this.padIndex]) {
      this.padIndex = null
      for (const p of pads) {
        if (p && p.connected) {
          this.padIndex = p.index
          break
        }
      }
    }

    this.pad = this.padIndex === null ? null : pads[this.padIndex]
    this.mapping = this.pad?.mapping ?? null
    this.id = this.pad?.id ?? null

    // profile 與 hat 每幀解一次，_readAction 會對每個動作查詢。
    this._profile =
      this.pad && this.mapping !== 'standard'
        ? (FALLBACK_PROFILES.find((p) => p.match.test(this.id ?? '')) ?? null)
        : null
    this._hat =
      this._profile?.hatAxis == null
        ? NO_HAT
        : readHat(this.pad.axes[this._profile.hatAxis])

    // 邊緣偵測：交換 prev / curr，避免每幀配置新 Set。
    const swap = this._prev
    this._prev = this._curr
    this._curr = swap
    this._curr.clear()

    for (const action of Object.keys(this.bindings)) {
      if (this._readAction(action)) this._curr.add(action)
    }

    if (this._rebind && this.pad) this._pollRebindFromPad()
  }

  // --- 查詢 --------------------------------------------------------------

  isDown(action) {
    return this._curr.has(action)
  }

  /** 本幀剛按下（上一幀還沒按）。 */
  justPressed(action) {
    return this._curr.has(action) && !this._prev.has(action)
  }

  justReleased(action) {
    return !this._curr.has(action) && this._prev.has(action)
  }

  /** @returns {{x:number,y:number,magnitude:number}} 已套死區的搖桿值。 */
  stick(which = 'LEFT') {
    const pad = this.pad
    if (!pad) return { x: 0, y: 0, magnitude: 0 }
    const [ix, iy] = STANDARD_AXES[which]
    return applyRadialDeadzone(pad.axes[ix] ?? 0, pad.axes[iy] ?? 0, this.deadzone)
  }

  /** 類比扳機 0..1。 */
  trigger(which = 'L2') {
    const idx = STANDARD_BUTTONS.indexOf(which)
    const b = this.pad?.buttons?.[idx]
    if (!b) return 0
    return typeof b.value === 'number' ? b.value : b.pressed ? 1 : 0
  }

  /** 原始按鍵狀態，只給 debug UI 用；遊戲邏輯不該碰。 */
  rawButtons() {
    return (this.pad?.buttons ?? []).map((b) => ({
      pressed: b.pressed,
      touched: b.touched,
      value: b.value,
    }))
  }

  rawAxes() {
    return Array.from(this.pad?.axes ?? [])
  }

  // --- 重新配鍵 -----------------------------------------------------------

  /**
   * 進入擷取模式：下一個被按下的手把鍵或鍵盤鍵會綁到這個動作。
   * @returns {Promise<{pad?:string, key?:string}>}
   */
  beginRebind(action) {
    if (!(action in this.bindings)) throw new Error(`未知動作: ${action}`)
    this.cancelRebind()
    return new Promise((resolve) => {
      this._rebind = { action, resolve, baseline: this._buttonSnapshot() }
    })
  }

  cancelRebind() {
    if (this._rebind) {
      this._rebind.resolve(null)
      this._rebind = null
    }
  }

  _buttonSnapshot() {
    return (this.pad?.buttons ?? []).map((b) => b.pressed)
  }

  _pollRebindFromPad() {
    const { baseline } = this._rebind
    const buttons = this.pad.buttons
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].pressed && !baseline[i]) {
        const name = STANDARD_BUTTONS[i] ?? `BUTTON_${i}`
        this._resolveRebind({ pad: name })
        return
      }
    }
    // 擷取當下若手把已有鍵按著，放開後才更新 baseline，避免立刻誤判。
    this._rebind.baseline = this._buttonSnapshot()
  }

  _resolveRebind(binding) {
    const { action, resolve } = this._rebind
    this.bindings[action] = { ...this.bindings[action], ...binding }
    this._rebind = null
    resolve(binding)
  }

  // --- 內部 --------------------------------------------------------------

  _readAction(action) {
    const b = this.bindings[action]
    if (!b) return false
    if (b.key && this._keys.has(b.key)) return true
    if (!b.pad || !this.pad) return false

    // 十字鍵可能不是按鍵而是 hat switch（D mode），這條要走在按鍵索引之前。
    if (this._hat.includes(b.pad)) return true

    const idx = this._resolveButtonIndex(b.pad)
    if (idx == null) return false

    const btn = this.pad.buttons[idx]
    if (!btn) return false
    if (idx === 6 || idx === 7) return (btn.value ?? 0) >= this.triggerThreshold
    return btn.pressed
  }

  /** standard 直接用索引；非標準查本幀解出的 fallback profile。 */
  _resolveButtonIndex(name) {
    const std = STANDARD_BUTTONS.indexOf(name)
    if (this._profile?.buttons) {
      const mapped = this._profile.buttons[std]
      return typeof mapped === 'number' ? mapped : null
    }
    return std >= 0 ? std : null
  }

  // --- 震動 --------------------------------------------------------------

  /**
   * 藍牙下不一定有效；沒有 actuator 就安靜地回 false。
   * 回傳的 Promise 會等到震動結束（或被 stopRumble 打斷）才 resolve。
   */
  async rumble({ duration = 200, strongMagnitude = 0.8, weakMagnitude = 0.4 } = {}) {
    const pad = this.pad
    const actuator = pad?.vibrationActuator
    if (actuator?.playEffect) {
      try {
        await actuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration,
          strongMagnitude,
          weakMagnitude,
        })
        return true
      } catch {
        return false
      }
    }

    // 舊 Firefox 走 hapticActuators[].pulse()，只有單一強度、沒有強弱馬達之分。
    const legacy = pad?.hapticActuators?.[0]
    if (legacy?.pulse) {
      try {
        await legacy.pulse(strongMagnitude, duration)
        return true
      } catch {
        return false
      }
    }
    return false
  }

  /** 立刻中斷進行中的震動；進行中的 rumble() 會以 "preempted" resolve。 */
  stopRumble() {
    const actuator = this.pad?.vibrationActuator
    if (!actuator?.reset) return false
    try {
      actuator.reset()
      return true
    } catch {
      return false
    }
  }
}
