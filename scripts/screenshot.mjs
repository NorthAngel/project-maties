/**
 * 產生 README 用的 tester 截圖。
 *
 *   pnpm screenshot
 *
 * Playwright 的 Chromium 看不到實體 USB 手把 —— 沒有 CDP 介面能注入 HID 裝置。
 * 所以這裡用 addInitScript 覆寫 navigator.getGamepads()，餵一個合成的
 * Gamepad 物件進去。數值刻意對齊真機在 Chrome 下的回報內容
 * （id 字串、mapping、17 顆鍵 / 4 軸），畫面上看到的 UI 行為是真的。
 */
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'docs/tester.png')
const PORT = 5178

/** 真機在 macOS Chrome 下的 id 字串。 */
const PAD_ID = '8BitDo Pro 2 (STANDARD GAMEPAD Vendor: 045e Product: 028e)'

/**
 * 擺一個「正在玩」的姿勢：按住 FACE_DOWN(jump) 與 DPAD_RIGHT(right)，
 * R2 半壓，左搖桿推右下、右搖桿微推 —— 一次展示按鍵、類比扳機、
 * 死區可視化、語意動作四個區塊。
 */
const POSE = {
  buttons: { 0: 1, 7: 0.62, 15: 1 },
  axes: [0.71, 0.42, -0.33, 0.18],
}

function installFakeGamepad({ id, pose }) {
  const buttons = Array.from({ length: 17 }, (_, i) => {
    const value = pose.buttons[i] ?? 0
    return { pressed: value >= 0.5, touched: value > 0, value }
  })

  const pad = {
    id,
    index: 0,
    connected: true,
    mapping: 'standard',
    timestamp: 0,
    axes: pose.axes,
    buttons,
    vibrationActuator: { type: 'dual-rumble', playEffect: () => Promise.resolve('complete') },
  }

  navigator.getGamepads = () => [pad, null, null, null]

  // 真實情況下這個事件由瀏覽器在使用者按鍵後派發。
  window.addEventListener('load', () => {
    window.dispatchEvent(new CustomEvent('gamepadconnected'))
  })
}

const server = await createServer({ root: ROOT, server: { port: PORT }, logLevel: 'warn' })
await server.listen()

const browser = await chromium.launch()
const page = await browser.newPage({
  // 920px 讓 auto-fit grid 收成兩欄 —— 三欄時第二列會留一大塊空白。
  viewport: { width: 920, height: 1000 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
})

await page.addInitScript(installFakeGamepad, { id: PAD_ID, pose: POSE })
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })

// 等 rAF 迴圈跑幾幀，讓 Hz 讀數與畫布都穩定下來。
await page.waitForFunction(() => document.getElementById('d-fps')?.textContent !== '—')
await page.waitForTimeout(600)

await mkdir(dirname(OUT), { recursive: true })
await page.screenshot({ path: OUT, fullPage: true })

console.log(`✓ ${OUT}`)

await browser.close()
await server.close()
