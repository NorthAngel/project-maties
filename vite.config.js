import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // localhost 是 secure context，Gamepad API 可用。
    // 若要用手機/其他機器連進來測，Gamepad API 需要 HTTPS —— 那時再開 https。
    host: 'localhost',
    port: 5173,
    // 不自動開啟 —— 預設瀏覽器可能是 Safari，它對藍牙手把支援差且不支援震動。
    // 手動用 Chrome 開 http://localhost:5173
    open: false,
  },
})
