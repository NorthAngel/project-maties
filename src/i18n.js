export const LOCALES = ['zh-CN', 'en', 'ja'];

export const LANGUAGE_LABELS = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  en: 'English',
  ja: '日本語',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  es: 'Español',
};

const zhCN = {
  'app.settingsTitle': 'Controller Companion · 设置',
  'page.appearance.title': '外观',
  'page.appearance.subtitle': '透明度、描边与大小。',
  'page.controller.title': '手柄',
  'page.controller.subtitle': '摇杆、按键与输入模式。',
  'nav.appearance': '外观',
  'nav.controller': '手柄',
  'device.waiting': '等待手柄',
  'device.connected': '手柄已连接',
  'sidebar.enabled': '后台输入',
  'sidebar.hamburger': '系统设置',
  'top.minimize': '最小化',
  'top.done': '完成',
  'preview.desktop': '桌面上的转盘实时预览',
  'preview.badge': '外观预览',
  'preview.refresh': '重新捕捉桌面',
  'preview.input': '预览输入盘',
  'preview.abc': 'abc',
  'preview.ABC': 'ABC',
  'preview.123': '123',
  'preview.captureFailed': '无法捕捉桌面，点击重试',
  'appearance.opacity': '不透明度',
  'appearance.material': '材质',
  'appearance.translucent': '通透',
  'appearance.soft': '柔和',
  'appearance.solid': '实色',
  'appearance.character': '字符',
  'appearance.darkCharacter': '深色',
  'appearance.lightCharacter': '浅色',
  'appearance.scale': '大小',
  'appearance.custom': '自定义外观',
  'appearance.outlineColor': '选区描边',
  'appearance.outlineWidth': '粗细',
  'appearance.fillColor': '扇区填充',
  'appearance.textColor': '字符颜色',
  'appearance.reset': '恢复默认',
  'controller.current': '当前手柄',
  'controller.noDevice': '未连接手柄',
  'controller.connect': '连接 USB 或蓝牙手柄',
  'controller.mapped': '已识别 · 可直接使用',
  'controller.needsCalibration': '需要校准 · 暂停此手柄的键鼠输入',
  'controller.calibrate': '校准按键',
  'controller.reset': '恢复自动识别',
  'controller.previewLayout': '预览布局（默认）',
  'controller.singlePreview': '单盘预览',
  'controller.dualPreview': '双盘预览',
  'controller.activation': '呼出 / 收起',
  'controller.singleActivation': 'L3',
  'controller.dualActivation': 'L3 + R3',
  'controller.leftDisc': '左盘',
  'controller.rightDisc': '右盘',
  'controller.roleCollapsed': '转盘收起',
  'controller.roleTyping': '正在输入',
  'controller.roleSingle': 'Ⓛ 选区　Ⓡ 鼠标',
  'controller.roleDual': 'Ⓛ 左盘　Ⓡ 右盘',
  'controller.mouseSpeed': '鼠标速度',
  'controller.scrollSpeed': '滚动速度',
  'controller.deadzone': '摇杆死区',
  'controller.customButtons': '自定义按键',
  'controller.bindingModeIdle': '转盘收起',
  'controller.bindingModeTyping': '单盘输入',
  'controller.bindingModeDual': '双盘输入',
  'controller.resetBindings': '恢复默认',
  'controller.bindingLayer': '绑定层',
  'controller.bindingBase': '常规',
  'controller.bindingAuxiliary': '辅助',
  'controller.auxHint': '先将任意按键设为「按住使用辅助绑定」',
  'controller.reservedSingle': '呼出 / 收起 · 固定',
  'controller.reservedDual': '组合键呼出 / 收起 · 固定',
  'controller.switchWheel': '切换输入盘',
  'controller.opacityAdjust': '透明度 − / ＋',
  'controller.hintSingle': 'L3 · 呼出 / 收起　　XYAB → 字符',
  'controller.hintDual': 'L3 + R3 · 呼出 / 收起　　十字键 → 左盘　 XYAB → 右盘',
  'system.title': '系统设置',
  'system.language': '界面语言',
  'system.theme': '主题',
  'system.themeSystem': '跟随系统',
  'system.themeLight': '浅色',
  'system.themeDark': '深色',
  'system.startAtLogin': '登录时启动',
  'system.closeBehavior': '点击关闭时',
  'system.closeTray': '最小化到托盘',
  'system.closeMinimize': '最小化窗口',
  'system.closeQuit': '退出应用',
  'system.enabled': '后台输入',
  'system.quit': '退出 Controller Companion',
  'system.diagnose': '诊断',
  'system.repair': '修复',
  'system.update': '更新',
  'system.firmware': '固件支持',
  'system.languageSettings': 'Windows 语言设置',
  'system.close': '完成',
  'system.version': '版本',
  'system.ready': '设置已保存',
  'system.working': '正在处理…',
  'system.result.diagnostics-ok': '诊断完成，未发现问题。',
  'system.result.diagnostics-issues': '诊断完成，请检查报告中的问题。',
  'system.result.repair-ok': '修复完成，已恢复：{files}。',
  'system.result.update-cancelled': '已取消更新。',
  'system.result.update-not-newer': '选择的版本不比当前版本新。',
  'system.result.update-integrity': '更新文件完整性校验失败。',
  'system.result.update-product': '更新包不是 Controller Companion。',
  'system.result.update-manifest': '更新包清单无效。',
  'system.result.update-path': '更新包包含无效路径。',
  'system.result.repair-backup': '修复备份未通过完整性校验。',
  'system.result.repair-unavailable': '当前没有可用的修复文件。',
  'system.result.repair-failed': '修复失败，请重新打开应用后重试。',
  'system.result.support-opened': '已打开官方固件支持页面。',
  'system.result.language-settings-opened': '已打开 Windows 语言设置。',
  'system.result.action-failed': '操作失败，请稍后重试。',
  'system.diagnose.backend': '输入后端',
  'system.diagnose.service': '输入服务',
  'system.diagnose.inputLanguage': '当前输入语言',
  'system.diagnose.devices': '手柄',
  'system.diagnose.ok': '正常',
  'system.diagnose.failed': '异常',
  'calibration.title': '手柄按键校准',
  'calibration.release': '松开所有按键，让摇杆回中',
  'calibration.note': '准备好后开始；每一步操作后松开并回中。',
  'calibration.cancel': '取消',
  'calibration.skip': '跳过此项',
  'calibration.start': '开始校准',
  'calibration.save': '保存校准',
  'calibration.saved': '保存后立即生效，下次连接同型号手柄时自动应用。',
  'calibration.disconnected': '手柄已断开，校准未保存',
  'calibration.progress': '第 {current} 步，共 {total} 步',
  'calibration.required': '必需',
  'calibration.optional': '可选',
  'calibration.stepNote': '{progress} · {kind} · {label}',
  'device.none': '未连接手柄',
  'binding.inherit': '沿用常规',
  'binding.none': '不分配',
  'binding.upper': '上方字符',
  'binding.lower': '下方字符',
  'binding.left': '左侧字符',
  'binding.right': '右侧字符',
  'binding.menu': '切换输入盘',
  'binding.space': '空格',
  'binding.backspace': '退格',
  'binding.enter': '回车',
  'binding.shift': '按住 Shift',
  'binding.lighter': '透明度 −',
  'binding.solid': '透明度 ＋',
  'binding.mouseLeft': '鼠标左键',
  'binding.mouseRight': '鼠标右键',
  'binding.mouseMiddle': '鼠标中键',
  'binding.keyboard': '键盘 {key}',
  'binding.key.space': '空格',
  'binding.key.backspace': '退格',
  'binding.key.enter': '回车',
  'binding.key.tab': 'Tab',
  'binding.key.escape': 'Esc',
  'binding.key.delete': 'Delete',
  'binding.key.left': '← 方向键',
  'binding.key.right': '→ 方向键',
  'binding.key.up': '↑ 方向键',
  'binding.key.down': '↓ 方向键',
  'binding.key.home': 'Home',
  'binding.key.end': 'End',
  'binding.key.copy': 'Ctrl+C',
  'binding.key.paste': 'Ctrl+V',
  'binding.key.undo': 'Ctrl+Z',
  'binding.leftUpper': '左盘 · 上方字符',
  'binding.leftLower': '左盘 · 下方字符',
  'binding.leftLeft': '左盘 · 左侧字符',
  'binding.leftRight': '左盘 · 右侧字符',
  'binding.cycleLeft': '切换左盘',
  'binding.cycleRight': '切换右盘',
  'binding.ctrl': '按住 Ctrl',
  'binding.mediaPlay': '媒体播放 / 暂停',
  'binding.mediaPrevious': '媒体上一首',
  'binding.mediaNext': '媒体下一首',
  'binding.auxiliary': '按住使用辅助绑定',
  'binding.keyboardApp': '显示 / 收起转盘',
  'binding.dualRight': '右盘 · {label}',
  'dynamic.deviceConnected': '{name}',
  'dynamic.error': '{message}',
};

const zhTW = {
  ...zhCN,
  'app.settingsTitle': 'Controller Companion · 設定',
  'page.appearance.title': '外觀', 'page.appearance.subtitle': '透明度、描邊與大小。',
  'page.controller.title': '手把', 'page.controller.subtitle': '搖桿、按鍵與輸入模式。',
  'nav.appearance': '外觀', 'nav.controller': '手把', 'device.waiting': '等待手把', 'device.connected': '手把已連線',
  'sidebar.enabled': '背景輸入', 'sidebar.hamburger': '系統設定', 'top.minimize': '最小化', 'top.done': '完成',
  'preview.desktop': '桌面上的轉盤即時預覽', 'preview.badge': '外觀預覽', 'preview.refresh': '重新擷取桌面', 'preview.input': '預覽輸入盤', 'preview.captureFailed': '無法擷取桌面，點擊重試',
  'appearance.opacity': '不透明度', 'appearance.material': '材質', 'appearance.translucent': '通透', 'appearance.soft': '柔和', 'appearance.solid': '實色', 'appearance.character': '字元', 'appearance.darkCharacter': '深色', 'appearance.lightCharacter': '淺色', 'appearance.scale': '大小', 'appearance.custom': '自訂外觀', 'appearance.outlineColor': '選取描邊', 'appearance.outlineWidth': '粗細', 'appearance.fillColor': '扇區填色', 'appearance.textColor': '字元顏色', 'appearance.reset': '恢復預設',
  'controller.current': '目前手把', 'controller.noDevice': '未連線手把', 'controller.connect': '連接 USB 或藍牙手把', 'controller.mapped': '已辨識 · 可直接使用', 'controller.needsCalibration': '需要校準 · 暫停此手把的鍵鼠輸入', 'controller.calibrate': '校準按鍵', 'controller.reset': '恢復自動辨識', 'controller.previewLayout': '預覽版面（預設）', 'controller.singlePreview': '單盤預覽', 'controller.dualPreview': '雙盤預覽', 'controller.activation': '呼出 / 收起', 'controller.singleActivation': 'L3', 'controller.dualActivation': 'L3 + R3', 'controller.leftDisc': '左盤', 'controller.rightDisc': '右盤', 'controller.roleCollapsed': '轉盤收起', 'controller.roleTyping': '正在輸入', 'controller.roleSingle': 'Ⓛ 選取　Ⓡ 滑鼠', 'controller.roleDual': 'Ⓛ 左盤　Ⓡ 右盤', 'controller.mouseSpeed': '滑鼠速度', 'controller.scrollSpeed': '捲動速度', 'controller.deadzone': '搖桿死區', 'controller.customButtons': '自訂按鍵', 'controller.bindingModeIdle': '轉盤收起', 'controller.bindingModeTyping': '單盤輸入', 'controller.bindingModeDual': '雙盤輸入', 'controller.resetBindings': '恢復預設', 'controller.bindingLayer': '繫結層', 'controller.bindingBase': '一般', 'controller.bindingAuxiliary': '輔助', 'controller.auxHint': '先將任意按鍵設為「按住使用輔助繫結」', 'controller.reservedSingle': '呼出 / 收起 · 固定', 'controller.reservedDual': '組合鍵呼出 / 收起 · 固定', 'controller.switchWheel': '切換輸入盤', 'controller.opacityAdjust': '透明度 − / ＋', 'controller.hintSingle': 'L3 · 呼出 / 收起　　XYAB → 字元', 'controller.hintDual': 'L3 + R3 · 呼出 / 收起　　十字鍵 → 左盤　 XYAB → 右盤',
  'system.title': '系統設定', 'system.language': '介面語言', 'system.theme': '主題', 'system.themeSystem': '跟隨系統', 'system.themeLight': '淺色', 'system.themeDark': '深色', 'system.startAtLogin': '登入時啟動', 'system.closeBehavior': '點擊關閉時', 'system.closeTray': '最小化至系統匣', 'system.closeMinimize': '最小化視窗', 'system.closeQuit': '退出應用程式', 'system.enabled': '背景輸入', 'system.quit': '退出 Controller Companion', 'system.diagnose': '診斷', 'system.repair': '修復', 'system.update': '更新', 'system.firmware': '韌體支援', 'system.languageSettings': 'Windows 語言設定', 'system.close': '完成', 'system.version': '版本', 'system.ready': '設定已儲存', 'system.working': '處理中…',
  'system.result.diagnostics-ok': '診斷完成，未發現問題。', 'system.result.diagnostics-issues': '診斷完成，請檢查報告中的問題。', 'system.result.repair-ok': '修復完成，已恢復：{files}。', 'system.result.update-cancelled': '已取消更新。', 'system.result.update-not-newer': '選取的版本不比目前版本新。', 'system.result.update-integrity': '更新檔案完整性驗證失敗。', 'system.result.update-product': '更新包不是 Controller Companion。', 'system.result.update-manifest': '更新包清單無效。', 'system.result.update-path': '更新包包含無效路徑。', 'system.result.repair-backup': '修復備份未通過完整性驗證。', 'system.result.repair-unavailable': '目前沒有可用的修復檔案。', 'system.result.repair-failed': '修復失敗，請重新開啟應用程式後重試。', 'system.result.support-opened': '已開啟官方韌體支援頁面。', 'system.result.language-settings-opened': '已開啟 Windows 語言設定。', 'system.result.action-failed': '操作失敗，請稍後重試。', 'system.diagnose.backend': '輸入後端', 'system.diagnose.service': '輸入服務', 'system.diagnose.inputLanguage': '目前輸入語言', 'system.diagnose.devices': '手把', 'system.diagnose.ok': '正常', 'system.diagnose.failed': '異常',
  'calibration.title': '手把按鍵校準', 'calibration.release': '放開所有按鍵，讓搖桿回到中央', 'calibration.note': '準備好後開始；每一步操作後放開並回到中央。', 'calibration.cancel': '取消', 'calibration.skip': '跳過此項', 'calibration.start': '開始校準', 'calibration.save': '儲存校準', 'calibration.saved': '儲存後立即生效，下次連接同型號手把時自動套用。', 'calibration.disconnected': '手把已中斷連線，校準未儲存', 'calibration.progress': '第 {current} 步，共 {total} 步', 'calibration.required': '必要', 'calibration.optional': '選用', 'calibration.stepNote': '{progress} · {kind} · {label}',
  'device.none': '未連線手把', 'binding.inherit': '沿用一般', 'binding.none': '不指定', 'binding.upper': '上方字元', 'binding.lower': '下方字元', 'binding.left': '左側字元', 'binding.right': '右側字元', 'binding.menu': '切換輸入盤', 'binding.space': '空白', 'binding.backspace': '退格', 'binding.enter': '換行', 'binding.shift': '按住 Shift', 'binding.lighter': '透明度 −', 'binding.solid': '透明度 ＋', 'binding.mouseLeft': '滑鼠左鍵', 'binding.mouseRight': '滑鼠右鍵', 'binding.mouseMiddle': '滑鼠中鍵', 'binding.keyboard': '鍵盤 {key}', 'binding.key.space': '空白', 'binding.key.backspace': '退格', 'binding.key.enter': '換行', 'binding.key.tab': 'Tab', 'binding.key.escape': 'Esc', 'binding.key.delete': 'Delete', 'binding.key.left': '← 方向鍵', 'binding.key.right': '→ 方向鍵', 'binding.key.up': '↑ 方向鍵', 'binding.key.down': '↓ 方向鍵', 'binding.key.home': 'Home', 'binding.key.end': 'End', 'binding.key.copy': 'Ctrl+C', 'binding.key.paste': 'Ctrl+V', 'binding.key.undo': 'Ctrl+Z', 'binding.leftUpper': '左盤 · 上方字元', 'binding.leftLower': '左盤 · 下方字元', 'binding.leftLeft': '左盤 · 左側字元', 'binding.leftRight': '左盤 · 右側字元', 'binding.cycleLeft': '切換左盤', 'binding.cycleRight': '切換右盤', 'binding.ctrl': '按住 Ctrl', 'binding.mediaPlay': '媒體播放 / 暫停', 'binding.mediaPrevious': '媒體上一首', 'binding.mediaNext': '媒體下一首', 'binding.auxiliary': '按住使用輔助繫結', 'binding.keyboardApp': '顯示 / 收起轉盤', 'binding.dualRight': '右盤 · {label}', 'dynamic.deviceConnected': '{name}', 'dynamic.error': '{message}',
};

const en = {
  'app.settingsTitle': 'Controller Companion · Settings', 'page.appearance.title': 'Appearance', 'page.appearance.subtitle': 'Opacity, outlines, and size.', 'page.controller.title': 'Controller', 'page.controller.subtitle': 'Sticks, buttons, and input modes.', 'nav.appearance': 'Appearance', 'nav.controller': 'Controller', 'device.waiting': 'Waiting for controller', 'device.connected': 'Controller connected', 'sidebar.enabled': 'Background input', 'sidebar.hamburger': 'System settings', 'top.minimize': 'Minimize', 'top.done': 'Done', 'preview.desktop': 'Live wheel preview on the desktop', 'preview.badge': 'Appearance preview', 'preview.refresh': 'Capture desktop again', 'preview.input': 'Preview input disc', 'preview.abc': 'abc', 'preview.ABC': 'ABC', 'preview.123': '123', 'preview.captureFailed': 'Could not capture the desktop. Try again.',
  'appearance.opacity': 'Opacity', 'appearance.material': 'Material', 'appearance.translucent': 'Translucent', 'appearance.soft': 'Soft', 'appearance.solid': 'Solid', 'appearance.character': 'Glyphs', 'appearance.darkCharacter': 'Dark', 'appearance.lightCharacter': 'Light', 'appearance.scale': 'Size', 'appearance.custom': 'Custom appearance', 'appearance.outlineColor': 'Selection outline', 'appearance.outlineWidth': 'Width', 'appearance.fillColor': 'Sector fill', 'appearance.textColor': 'Glyph color', 'appearance.reset': 'Restore defaults',
  'controller.current': 'Current controller', 'controller.noDevice': 'No controller connected', 'controller.connect': 'Connect a USB or Bluetooth controller', 'controller.mapped': 'Recognized · Ready to use', 'controller.needsCalibration': 'Calibration required · Input paused for this controller', 'controller.calibrate': 'Calibrate buttons', 'controller.reset': 'Restore automatic detection', 'controller.previewLayout': 'Preview layout (default)', 'controller.singlePreview': 'Single disc preview', 'controller.dualPreview': 'Dual disc preview', 'controller.activation': 'Open / close', 'controller.singleActivation': 'L3', 'controller.dualActivation': 'L3 + R3', 'controller.leftDisc': 'Left disc', 'controller.rightDisc': 'Right disc', 'controller.roleCollapsed': 'Wheel closed', 'controller.roleTyping': 'Typing', 'controller.roleSingle': 'Ⓛ Selection　Ⓡ Mouse', 'controller.roleDual': 'Ⓛ Left disc　Ⓡ Right disc', 'controller.mouseSpeed': 'Mouse speed', 'controller.scrollSpeed': 'Scroll speed', 'controller.deadzone': 'Stick deadzone', 'controller.customButtons': 'Custom buttons', 'controller.bindingModeIdle': 'Wheel closed', 'controller.bindingModeTyping': 'Single disc input', 'controller.bindingModeDual': 'Dual disc input', 'controller.resetBindings': 'Restore defaults', 'controller.bindingLayer': 'Binding layer', 'controller.bindingBase': 'Normal', 'controller.bindingAuxiliary': 'Auxiliary', 'controller.auxHint': 'Assign any button to “hold for auxiliary bindings” first', 'controller.reservedSingle': 'Open / close · fixed', 'controller.reservedDual': 'Chord open / close · fixed', 'controller.switchWheel': 'Switch input disc', 'controller.opacityAdjust': 'Opacity − / ＋', 'controller.hintSingle': 'L3 · open / close　　XYAB → glyphs', 'controller.hintDual': 'L3 + R3 · open / close　　D-pad → left disc　 XYAB → right disc',
  'system.title': 'System settings', 'system.language': 'Interface language', 'system.theme': 'Theme', 'system.themeSystem': 'System', 'system.themeLight': 'Light', 'system.themeDark': 'Dark', 'system.startAtLogin': 'Start at login', 'system.closeBehavior': 'When the window is closed', 'system.closeTray': 'Minimize to tray', 'system.closeMinimize': 'Minimize window', 'system.closeQuit': 'Quit the app', 'system.enabled': 'Background input', 'system.quit': 'Quit Controller Companion', 'system.diagnose': 'Diagnose', 'system.repair': 'Repair', 'system.update': 'Update', 'system.firmware': 'Firmware support', 'system.languageSettings': 'Windows language settings', 'system.close': 'Done', 'system.version': 'Version', 'system.ready': 'Settings saved', 'system.working': 'Working…',
  'system.result.diagnostics-ok': 'Diagnostics finished. No issues found.', 'system.result.diagnostics-issues': 'Diagnostics finished. Review the reported issues.', 'system.result.repair-ok': 'Repair finished. Restored: {files}.', 'system.result.update-cancelled': 'Update cancelled.', 'system.result.update-not-newer': 'The selected version is not newer than the current version.', 'system.result.update-integrity': 'The update failed its integrity check.', 'system.result.update-product': 'The update is not a Controller Companion package.', 'system.result.update-manifest': 'The update manifest is invalid.', 'system.result.update-path': 'The update contains an invalid path.', 'system.result.repair-backup': 'The repair backup failed its integrity check.', 'system.result.repair-unavailable': 'No repair files are available.', 'system.result.repair-failed': 'Repair failed. Reopen the app and try again.', 'system.result.support-opened': 'Opened the official firmware support page.', 'system.result.language-settings-opened': 'Opened Windows language settings.', 'system.result.action-failed': 'The action failed. Try again later.', 'system.diagnose.backend': 'Input backend', 'system.diagnose.service': 'Input service', 'system.diagnose.inputLanguage': 'Current input language', 'system.diagnose.devices': 'Controllers', 'system.diagnose.ok': 'OK', 'system.diagnose.failed': 'Issue',
  'calibration.title': 'Controller button calibration', 'calibration.release': 'Release every button and center the sticks', 'calibration.note': 'Start when ready; release and center after each step.', 'calibration.cancel': 'Cancel', 'calibration.skip': 'Skip this item', 'calibration.start': 'Start calibration', 'calibration.save': 'Save calibration', 'calibration.saved': 'Takes effect immediately and applies automatically next time this model connects.', 'calibration.disconnected': 'Controller disconnected. Calibration was not saved.', 'calibration.progress': 'Step {current} of {total}', 'calibration.required': 'required', 'calibration.optional': 'optional', 'calibration.stepNote': '{progress} · {kind} · {label}',
  'device.none': 'No controller connected', 'binding.inherit': 'Use normal', 'binding.none': 'Unassigned', 'binding.upper': 'Upper glyph', 'binding.lower': 'Lower glyph', 'binding.left': 'Left glyph', 'binding.right': 'Right glyph', 'binding.menu': 'Switch input disc', 'binding.space': 'Space', 'binding.backspace': 'Backspace', 'binding.enter': 'Enter', 'binding.shift': 'Hold Shift', 'binding.lighter': 'Opacity −', 'binding.solid': 'Opacity ＋', 'binding.mouseLeft': 'Left mouse button', 'binding.mouseRight': 'Right mouse button', 'binding.mouseMiddle': 'Middle mouse button', 'binding.keyboard': 'Keyboard {key}', 'binding.key.space': 'Space', 'binding.key.backspace': 'Backspace', 'binding.key.enter': 'Enter', 'binding.key.tab': 'Tab', 'binding.key.escape': 'Esc', 'binding.key.delete': 'Delete', 'binding.key.left': '← Arrow key', 'binding.key.right': '→ Arrow key', 'binding.key.up': '↑ Arrow key', 'binding.key.down': '↓ Arrow key', 'binding.key.home': 'Home', 'binding.key.end': 'End', 'binding.key.copy': 'Ctrl+C', 'binding.key.paste': 'Ctrl+V', 'binding.key.undo': 'Ctrl+Z', 'binding.leftUpper': 'Left disc · upper glyph', 'binding.leftLower': 'Left disc · lower glyph', 'binding.leftLeft': 'Left disc · left glyph', 'binding.leftRight': 'Left disc · right glyph', 'binding.cycleLeft': 'Switch left disc', 'binding.cycleRight': 'Switch right disc', 'binding.ctrl': 'Hold Ctrl', 'binding.mediaPlay': 'Play / pause media', 'binding.mediaPrevious': 'Previous media', 'binding.mediaNext': 'Next media', 'binding.auxiliary': 'Hold for auxiliary bindings', 'binding.keyboardApp': 'Show / hide the wheel', 'binding.dualRight': 'Right disc · {label}', 'dynamic.deviceConnected': '{name}', 'dynamic.error': '{message}',
};

const ja = {
  ...en,
  'app.settingsTitle': 'Controller Companion · 設定', 'page.appearance.title': '外観', 'page.appearance.subtitle': '透明度、輪郭、サイズ。', 'page.controller.title': 'コントローラー', 'page.controller.subtitle': 'スティック、ボタン、入力モード。', 'nav.appearance': '外観', 'nav.controller': 'コントローラー', 'device.waiting': 'コントローラーを待機中', 'device.connected': 'コントローラー接続済み', 'sidebar.enabled': 'バックグラウンド入力', 'sidebar.hamburger': 'システム設定', 'top.minimize': '最小化', 'top.done': '完了', 'preview.desktop': 'デスクトップ上のホイールプレビュー', 'preview.badge': '外観プレビュー', 'preview.refresh': 'デスクトップを再キャプチャ', 'preview.input': '入力ディスクをプレビュー', 'preview.captureFailed': 'デスクトップをキャプチャできません。再試行してください。',
  'appearance.opacity': '不透明度', 'appearance.material': '素材', 'appearance.translucent': '透明', 'appearance.soft': 'ソフト', 'appearance.solid': '不透明', 'appearance.character': '文字', 'appearance.darkCharacter': '濃色', 'appearance.lightCharacter': '淡色', 'appearance.scale': 'サイズ', 'appearance.custom': '外観をカスタマイズ', 'appearance.outlineColor': '選択枠', 'appearance.outlineWidth': '太さ', 'appearance.fillColor': 'セクターの塗り', 'appearance.textColor': '文字色', 'appearance.reset': '既定値に戻す',
  'controller.current': '現在のコントローラー', 'controller.noDevice': 'コントローラー未接続', 'controller.connect': 'USB または Bluetooth のコントローラーを接続', 'controller.mapped': '認識済み · 使用できます', 'controller.needsCalibration': '要キャリブレーション · このコントローラーの入力を一時停止', 'controller.calibrate': 'ボタンを調整', 'controller.reset': '自動認識に戻す', 'controller.previewLayout': 'プレビュー配置（既定）', 'controller.singlePreview': 'シングルプレビュー', 'controller.dualPreview': 'デュアルプレビュー', 'controller.activation': '表示 / 非表示', 'controller.singleActivation': 'L3', 'controller.dualActivation': 'L3 + R3', 'controller.leftDisc': '左ディスク', 'controller.rightDisc': '右ディスク', 'controller.roleCollapsed': 'ホイール非表示', 'controller.roleTyping': '入力中', 'controller.roleSingle': 'Ⓛ 選択　Ⓡ マウス', 'controller.roleDual': 'Ⓛ 左ディスク　Ⓡ 右ディスク', 'controller.mouseSpeed': 'マウス速度', 'controller.scrollSpeed': 'スクロール速度', 'controller.deadzone': 'スティックのデッドゾーン', 'controller.customButtons': 'ボタンをカスタマイズ', 'controller.bindingModeIdle': 'ホイール非表示', 'controller.bindingModeTyping': 'シングル入力', 'controller.bindingModeDual': 'デュアル入力', 'controller.resetBindings': '既定値に戻す', 'controller.bindingLayer': '割り当てレイヤー', 'controller.bindingBase': '通常', 'controller.bindingAuxiliary': '補助', 'controller.auxHint': 'まず任意のボタンを「補助割り当てを長押し」に設定してください', 'controller.reservedSingle': '表示 / 非表示 · 固定', 'controller.reservedDual': '同時押しで表示 / 非表示 · 固定', 'controller.switchWheel': '入力ディスクを切替', 'controller.opacityAdjust': '透明度 − / ＋', 'controller.hintSingle': 'L3 · 表示 / 非表示　　XYAB → 文字', 'controller.hintDual': 'L3 + R3 · 表示 / 非表示　　十字キー → 左　 XYAB → 右',
  'system.title': 'システム設定', 'system.language': '表示言語', 'system.theme': 'テーマ', 'system.themeSystem': 'システムに合わせる', 'system.themeLight': 'ライト', 'system.themeDark': 'ダーク', 'system.startAtLogin': 'ログイン時に起動', 'system.closeBehavior': 'ウィンドウを閉じたとき', 'system.closeTray': 'トレイに最小化', 'system.closeMinimize': 'ウィンドウを最小化', 'system.closeQuit': 'アプリを終了', 'system.enabled': 'バックグラウンド入力', 'system.quit': 'Controller Companion を終了', 'system.diagnose': '診断', 'system.repair': '修復', 'system.update': '更新', 'system.firmware': 'ファームウェアサポート', 'system.languageSettings': 'Windows の言語設定', 'system.close': '完了', 'system.version': 'バージョン', 'system.ready': '設定を保存しました', 'system.working': '処理中…',
  'system.result.diagnostics-ok': '診断が完了しました。問題はありません。', 'system.result.diagnostics-issues': '診断が完了しました。報告された問題を確認してください。', 'system.result.repair-ok': '修復が完了しました。復元：{files}。', 'system.result.update-cancelled': '更新をキャンセルしました。', 'system.result.update-not-newer': '選択したバージョンは現在より新しくありません。', 'system.result.update-integrity': '更新の整合性チェックに失敗しました。', 'system.result.update-product': 'Controller Companion の更新パッケージではありません。', 'system.result.update-manifest': '更新マニフェストが無効です。', 'system.result.update-path': '更新に無効なパスが含まれています。', 'system.result.repair-backup': '修復バックアップの整合性チェックに失敗しました。', 'system.result.repair-unavailable': '利用できる修復ファイルがありません。', 'system.result.repair-failed': '修復に失敗しました。アプリを再起動して再試行してください。', 'system.result.support-opened': '公式ファームウェアサポートを開きました。', 'system.result.language-settings-opened': 'Windows の言語設定を開きました。', 'system.result.action-failed': '操作に失敗しました。後でもう一度お試しください。', 'system.diagnose.backend': '入力バックエンド', 'system.diagnose.service': '入力サービス', 'system.diagnose.inputLanguage': '現在の入力言語', 'system.diagnose.devices': 'コントローラー', 'system.diagnose.ok': '正常', 'system.diagnose.failed': '問題あり',
  'calibration.title': 'コントローラーボタンの調整', 'calibration.release': 'すべてのボタンを離し、スティックを中央に戻してください', 'calibration.note': '準備ができたら開始し、各手順の後に離して中央に戻します。', 'calibration.cancel': 'キャンセル', 'calibration.skip': 'この項目をスキップ', 'calibration.start': '調整を開始', 'calibration.save': '調整を保存', 'calibration.saved': '保存後すぐに反映され、次回同じモデルを接続したときに自動適用されます。', 'calibration.disconnected': 'コントローラーが切断されました。調整は保存されていません。', 'calibration.progress': '{total} ステップ中 {current} ステップ', 'calibration.required': '必須', 'calibration.optional': '任意', 'calibration.stepNote': '{progress} · {kind} · {label}',
  'device.none': 'コントローラー未接続', 'binding.inherit': '通常を使用', 'binding.none': '未割り当て', 'binding.upper': '上の文字', 'binding.lower': '下の文字', 'binding.left': '左の文字', 'binding.right': '右の文字', 'binding.menu': '入力ディスクを切替', 'binding.space': 'スペース', 'binding.backspace': 'バックスペース', 'binding.enter': 'Enter', 'binding.shift': 'Shift を長押し', 'binding.lighter': '透明度 −', 'binding.solid': '透明度 ＋', 'binding.mouseLeft': 'マウス左ボタン', 'binding.mouseRight': 'マウス右ボタン', 'binding.mouseMiddle': 'マウス中央ボタン', 'binding.keyboard': 'キーボード {key}', 'binding.key.space': 'スペース', 'binding.key.backspace': 'Backspace', 'binding.key.enter': 'Enter', 'binding.key.tab': 'Tab', 'binding.key.escape': 'Esc', 'binding.key.delete': 'Delete', 'binding.key.left': '← 矢印キー', 'binding.key.right': '→ 矢印キー', 'binding.key.up': '↑ 矢印キー', 'binding.key.down': '↓ 矢印キー', 'binding.key.home': 'Home', 'binding.key.end': 'End', 'binding.key.copy': 'Ctrl+C', 'binding.key.paste': 'Ctrl+V', 'binding.key.undo': 'Ctrl+Z', 'binding.leftUpper': '左ディスク · 上', 'binding.leftLower': '左ディスク · 下', 'binding.leftLeft': '左ディスク · 左', 'binding.leftRight': '左ディスク · 右', 'binding.cycleLeft': '左ディスクを切替', 'binding.cycleRight': '右ディスクを切替', 'binding.ctrl': 'Ctrl を長押し', 'binding.mediaPlay': 'メディア再生 / 一時停止', 'binding.mediaPrevious': '前のメディア', 'binding.mediaNext': '次のメディア', 'binding.auxiliary': '補助割り当てを長押し', 'binding.keyboardApp': 'ホイールを表示 / 非表示', 'binding.dualRight': '右ディスク · {label}', 'dynamic.deviceConnected': '{name}', 'dynamic.error': '{message}',
};

const fr = {
  ...en,
  'app.settingsTitle': 'Controller Companion · Paramètres', 'page.appearance.title': 'Apparence', 'page.appearance.subtitle': 'Opacité, contours et taille.', 'page.controller.title': 'Manette', 'page.controller.subtitle': 'Sticks, boutons et modes de saisie.', 'nav.appearance': 'Apparence', 'nav.controller': 'Manette', 'device.waiting': 'Manette en attente', 'device.connected': 'Manette connectée', 'sidebar.enabled': 'Saisie en arrière-plan', 'sidebar.hamburger': 'Paramètres système', 'top.minimize': 'Réduire', 'top.done': 'Terminé', 'preview.desktop': 'Aperçu en direct sur le bureau', 'preview.badge': 'Aperçu de l’apparence', 'preview.refresh': 'Recapturer le bureau', 'preview.input': 'Disque de saisie aperçu', 'preview.captureFailed': 'Impossible de capturer le bureau. Réessayez.',
  'appearance.opacity': 'Opacité', 'appearance.material': 'Matière', 'appearance.translucent': 'Transparente', 'appearance.soft': 'Douce', 'appearance.solid': 'Opaque', 'appearance.character': 'Caractères', 'appearance.darkCharacter': 'Foncés', 'appearance.lightCharacter': 'Clairs', 'appearance.scale': 'Taille', 'appearance.custom': 'Apparence personnalisée', 'appearance.outlineColor': 'Contour de sélection', 'appearance.outlineWidth': 'Épaisseur', 'appearance.fillColor': 'Remplissage des secteurs', 'appearance.textColor': 'Couleur des caractères', 'appearance.reset': 'Rétablir les valeurs par défaut',
  'controller.current': 'Manette actuelle', 'controller.noDevice': 'Aucune manette connectée', 'controller.connect': 'Connectez une manette USB ou Bluetooth', 'controller.mapped': 'Reconnue · Prête à l’emploi', 'controller.needsCalibration': 'Étalonnage requis · Saisie suspendue pour cette manette', 'controller.calibrate': 'Étalonner les boutons', 'controller.reset': 'Rétablir la détection automatique', 'controller.previewLayout': 'Disposition de l’aperçu (par défaut)', 'controller.singlePreview': 'Aperçu simple', 'controller.dualPreview': 'Aperçu double', 'controller.activation': 'Afficher / masquer', 'controller.singleActivation': 'L3', 'controller.dualActivation': 'L3 + R3', 'controller.leftDisc': 'Disque gauche', 'controller.rightDisc': 'Disque droit', 'controller.roleCollapsed': 'Roue masquée', 'controller.roleTyping': 'Saisie', 'controller.roleSingle': 'Ⓛ Sélection　Ⓡ Souris', 'controller.roleDual': 'Ⓛ Disque gauche　Ⓡ Disque droit', 'controller.mouseSpeed': 'Vitesse de la souris', 'controller.scrollSpeed': 'Vitesse de défilement', 'controller.deadzone': 'Zone morte du stick', 'controller.customButtons': 'Boutons personnalisés', 'controller.bindingModeIdle': 'Roue masquée', 'controller.bindingModeTyping': 'Saisie simple', 'controller.bindingModeDual': 'Saisie double', 'controller.resetBindings': 'Rétablir les valeurs par défaut', 'controller.bindingLayer': 'Couche de raccourcis', 'controller.bindingBase': 'Normale', 'controller.bindingAuxiliary': 'Auxiliaire', 'controller.auxHint': 'Attribuez d’abord un bouton à « maintenir pour les raccourcis auxiliaires »', 'controller.reservedSingle': 'Afficher / masquer · fixe', 'controller.reservedDual': 'Afficher / masquer par combinaison · fixe', 'controller.switchWheel': 'Changer de disque', 'controller.opacityAdjust': 'Opacité − / ＋', 'controller.hintSingle': 'L3 · afficher / masquer　　XYAB → caractères', 'controller.hintDual': 'L3 + R3 · afficher / masquer　　Croix → gauche　 XYAB → droite',
  'system.title': 'Paramètres système', 'system.language': 'Langue de l’interface', 'system.theme': 'Thème', 'system.themeSystem': 'Système', 'system.themeLight': 'Clair', 'system.themeDark': 'Sombre', 'system.startAtLogin': 'Lancer à la connexion', 'system.closeBehavior': 'À la fermeture de la fenêtre', 'system.closeTray': 'Réduire dans la zone de notification', 'system.closeMinimize': 'Réduire la fenêtre', 'system.closeQuit': 'Quitter l’application', 'system.enabled': 'Saisie en arrière-plan', 'system.quit': 'Quitter Controller Companion', 'system.diagnose': 'Diagnostiquer', 'system.repair': 'Réparer', 'system.update': 'Mettre à jour', 'system.firmware': 'Assistance du micrologiciel', 'system.languageSettings': 'Paramètres de langue Windows', 'system.close': 'Terminé', 'system.version': 'Version', 'system.ready': 'Paramètres enregistrés', 'system.working': 'Traitement…',
  'system.result.diagnostics-ok': 'Diagnostic terminé. Aucun problème détecté.', 'system.result.diagnostics-issues': 'Diagnostic terminé. Consultez les problèmes signalés.', 'system.result.repair-ok': 'Réparation terminée. Restauré : {files}.', 'system.result.update-cancelled': 'Mise à jour annulée.', 'system.result.update-not-newer': 'La version choisie n’est pas plus récente que la version actuelle.', 'system.result.update-integrity': 'La vérification d’intégrité de la mise à jour a échoué.', 'system.result.update-product': 'Le paquet n’est pas Controller Companion.', 'system.result.update-manifest': 'Le manifeste de mise à jour est invalide.', 'system.result.update-path': 'La mise à jour contient un chemin invalide.', 'system.result.repair-backup': 'La sauvegarde de réparation n’a pas passé la vérification d’intégrité.', 'system.result.repair-unavailable': 'Aucun fichier de réparation disponible.', 'system.result.repair-failed': 'Échec de la réparation. Rouvrez l’application et réessayez.', 'system.result.support-opened': 'La page officielle d’assistance du micrologiciel est ouverte.', 'system.result.language-settings-opened': 'Les paramètres de langue Windows sont ouverts.', 'system.result.action-failed': 'Échec de l’opération. Réessayez plus tard.', 'system.diagnose.backend': 'Backend d’entrée', 'system.diagnose.service': 'Service d’entrée', 'system.diagnose.inputLanguage': 'Langue de saisie actuelle', 'system.diagnose.devices': 'Manettes', 'system.diagnose.ok': 'OK', 'system.diagnose.failed': 'Problème',
  'calibration.title': 'Étalonnage des boutons', 'calibration.release': 'Relâchez tous les boutons et recentrez les sticks', 'calibration.note': 'Commencez quand vous êtes prêt ; relâchez et recentrez après chaque étape.', 'calibration.cancel': 'Annuler', 'calibration.skip': 'Ignorer cet élément', 'calibration.start': 'Commencer l’étalonnage', 'calibration.save': 'Enregistrer l’étalonnage', 'calibration.saved': 'Prend effet immédiatement et sera appliqué automatiquement à la prochaine connexion de ce modèle.', 'calibration.disconnected': 'Manette déconnectée. Étalonnage non enregistré.', 'calibration.progress': 'Étape {current} sur {total}', 'calibration.required': 'obligatoire', 'calibration.optional': 'facultative', 'calibration.stepNote': '{progress} · {kind} · {label}',
  'device.none': 'Aucune manette connectée', 'binding.inherit': 'Utiliser la normale', 'binding.none': 'Non attribué', 'binding.upper': 'Caractère du haut', 'binding.lower': 'Caractère du bas', 'binding.left': 'Caractère de gauche', 'binding.right': 'Caractère de droite', 'binding.menu': 'Changer de disque', 'binding.space': 'Espace', 'binding.backspace': 'Retour arrière', 'binding.enter': 'Entrée', 'binding.shift': 'Maintenir Maj', 'binding.lighter': 'Opacité −', 'binding.solid': 'Opacité ＋', 'binding.mouseLeft': 'Clic gauche', 'binding.mouseRight': 'Clic droit', 'binding.mouseMiddle': 'Clic central', 'binding.keyboard': 'Clavier {key}', 'binding.key.space': 'Espace', 'binding.key.backspace': 'Retour arrière', 'binding.key.enter': 'Entrée', 'binding.key.tab': 'Tab', 'binding.key.escape': 'Échap', 'binding.key.delete': 'Suppr', 'binding.key.left': '← Touche fléchée', 'binding.key.right': '→ Touche fléchée', 'binding.key.up': '↑ Touche fléchée', 'binding.key.down': '↓ Touche fléchée', 'binding.key.home': 'Début', 'binding.key.end': 'Fin', 'binding.key.copy': 'Ctrl+C', 'binding.key.paste': 'Ctrl+V', 'binding.key.undo': 'Ctrl+Z', 'binding.leftUpper': 'Disque gauche · haut', 'binding.leftLower': 'Disque gauche · bas', 'binding.leftLeft': 'Disque gauche · gauche', 'binding.leftRight': 'Disque gauche · droite', 'binding.cycleLeft': 'Changer le disque gauche', 'binding.cycleRight': 'Changer le disque droit', 'binding.ctrl': 'Maintenir Ctrl', 'binding.mediaPlay': 'Lire / mettre en pause', 'binding.mediaPrevious': 'Média précédent', 'binding.mediaNext': 'Média suivant', 'binding.auxiliary': 'Maintenir pour les raccourcis auxiliaires', 'binding.keyboardApp': 'Afficher / masquer la roue', 'binding.dualRight': 'Disque droit · {label}', 'dynamic.deviceConnected': '{name}', 'dynamic.error': '{message}',
};

const de = {
  ...en,
  'app.settingsTitle': 'Controller Companion · Einstellungen', 'page.appearance.title': 'Darstellung', 'page.appearance.subtitle': 'Deckkraft, Konturen und Größe.', 'page.controller.title': 'Controller', 'page.controller.subtitle': 'Sticks, Tasten und Eingabemodi.', 'nav.appearance': 'Darstellung', 'nav.controller': 'Controller', 'device.waiting': 'Warte auf Controller', 'device.connected': 'Controller verbunden', 'sidebar.enabled': 'Eingabe im Hintergrund', 'sidebar.hamburger': 'Systemeinstellungen', 'top.minimize': 'Minimieren', 'top.done': 'Fertig', 'preview.desktop': 'Live Vorschau des Rads auf dem Desktop', 'preview.badge': 'Darstellungsvorschau', 'preview.refresh': 'Desktop erneut erfassen', 'preview.input': 'Eingaberad-Vorschau', 'preview.captureFailed': 'Desktop konnte nicht erfasst werden. Erneut versuchen.',
  'appearance.opacity': 'Deckkraft', 'appearance.material': 'Material', 'appearance.translucent': 'Transparent', 'appearance.soft': 'Sanft', 'appearance.solid': 'Deckend', 'appearance.character': 'Zeichen', 'appearance.darkCharacter': 'Dunkel', 'appearance.lightCharacter': 'Hell', 'appearance.scale': 'Größe', 'appearance.custom': 'Eigene Darstellung', 'appearance.outlineColor': 'Auswahlkontur', 'appearance.outlineWidth': 'Stärke', 'appearance.fillColor': 'Sektorfüllung', 'appearance.textColor': 'Zeichenfarbe', 'appearance.reset': 'Standard wiederherstellen',
  'controller.current': 'Aktueller Controller', 'controller.noDevice': 'Kein Controller verbunden', 'controller.connect': 'USB- oder Bluetooth-Controller verbinden', 'controller.mapped': 'Erkannt · Bereit zur Verwendung', 'controller.needsCalibration': 'Kalibrierung erforderlich · Eingabe für diesen Controller pausiert', 'controller.calibrate': 'Tasten kalibrieren', 'controller.reset': 'Automatische Erkennung wiederherstellen', 'controller.previewLayout': 'Vorschau-Layout (Standard)', 'controller.singlePreview': 'Einfaches Rad', 'controller.dualPreview': 'Doppeltes Rad', 'controller.activation': 'Öffnen / schließen', 'controller.singleActivation': 'L3', 'controller.dualActivation': 'L3 + R3', 'controller.leftDisc': 'Linkes Rad', 'controller.rightDisc': 'Rechtes Rad', 'controller.roleCollapsed': 'Rad geschlossen', 'controller.roleTyping': 'Eingabe', 'controller.roleSingle': 'Ⓛ Auswahl　Ⓡ Maus', 'controller.roleDual': 'Ⓛ Linkes Rad　Ⓡ Rechtes Rad', 'controller.mouseSpeed': 'Mausgeschwindigkeit', 'controller.scrollSpeed': 'Scrollgeschwindigkeit', 'controller.deadzone': 'Totzone des Sticks', 'controller.customButtons': 'Eigene Tasten', 'controller.bindingModeIdle': 'Rad geschlossen', 'controller.bindingModeTyping': 'Einzelrad-Eingabe', 'controller.bindingModeDual': 'Doppelrad-Eingabe', 'controller.resetBindings': 'Standard wiederherstellen', 'controller.bindingLayer': 'Belegungsebene', 'controller.bindingBase': 'Normal', 'controller.bindingAuxiliary': 'Zusatz', 'controller.auxHint': 'Zuerst eine Taste auf „für Zusatzbelegungen halten“ setzen', 'controller.reservedSingle': 'Öffnen / schließen · fest', 'controller.reservedDual': 'Kombination zum Öffnen / Schließen · fest', 'controller.switchWheel': 'Eingaberad wechseln', 'controller.opacityAdjust': 'Deckkraft − / ＋', 'controller.hintSingle': 'L3 · öffnen / schließen　　XYAB → Zeichen', 'controller.hintDual': 'L3 + R3 · öffnen / schließen　　Steuerkreuz → links　 XYAB → rechts',
  'system.title': 'Systemeinstellungen', 'system.language': 'Oberflächensprache', 'system.theme': 'Thema', 'system.themeSystem': 'System', 'system.themeLight': 'Hell', 'system.themeDark': 'Dunkel', 'system.startAtLogin': 'Bei Anmeldung starten', 'system.closeBehavior': 'Beim Schließen des Fensters', 'system.closeTray': 'In den Infobereich minimieren', 'system.closeMinimize': 'Fenster minimieren', 'system.closeQuit': 'App beenden', 'system.enabled': 'Eingabe im Hintergrund', 'system.quit': 'Controller Companion beenden', 'system.diagnose': 'Diagnose', 'system.repair': 'Reparieren', 'system.update': 'Aktualisieren', 'system.firmware': 'Firmware-Support', 'system.languageSettings': 'Windows-Spracheinstellungen', 'system.close': 'Fertig', 'system.version': 'Version', 'system.ready': 'Einstellungen gespeichert', 'system.working': 'Wird verarbeitet…',
  'system.result.diagnostics-ok': 'Diagnose abgeschlossen. Keine Probleme gefunden.', 'system.result.diagnostics-issues': 'Diagnose abgeschlossen. Prüfen Sie die gemeldeten Probleme.', 'system.result.repair-ok': 'Reparatur abgeschlossen. Wiederhergestellt: {files}.', 'system.result.update-cancelled': 'Aktualisierung abgebrochen.', 'system.result.update-not-newer': 'Die gewählte Version ist nicht neuer als die aktuelle.', 'system.result.update-integrity': 'Integritätsprüfung der Aktualisierung fehlgeschlagen.', 'system.result.update-product': 'Das Paket ist kein Controller-Companion-Paket.', 'system.result.update-manifest': 'Das Aktualisierungsmanifest ist ungültig.', 'system.result.update-path': 'Die Aktualisierung enthält einen ungültigen Pfad.', 'system.result.repair-backup': 'Die Reparatursicherung hat die Integritätsprüfung nicht bestanden.', 'system.result.repair-unavailable': 'Keine Reparaturdateien verfügbar.', 'system.result.repair-failed': 'Reparatur fehlgeschlagen. App erneut öffnen und versuchen.', 'system.result.support-opened': 'Offizielle Firmware-Supportseite geöffnet.', 'system.result.language-settings-opened': 'Windows-Spracheinstellungen geöffnet.', 'system.result.action-failed': 'Aktion fehlgeschlagen. Später erneut versuchen.', 'system.diagnose.backend': 'Eingabe-Backend', 'system.diagnose.service': 'Eingabedienst', 'system.diagnose.inputLanguage': 'Aktuelle Eingabesprache', 'system.diagnose.devices': 'Controller', 'system.diagnose.ok': 'OK', 'system.diagnose.failed': 'Problem',
  'calibration.title': 'Controller-Tastenkalibrierung', 'calibration.release': 'Alle Tasten loslassen und Sticks zentrieren', 'calibration.note': 'Bereit? Starten Sie; nach jedem Schritt loslassen und zentrieren.', 'calibration.cancel': 'Abbrechen', 'calibration.skip': 'Element überspringen', 'calibration.start': 'Kalibrierung starten', 'calibration.save': 'Kalibrierung speichern', 'calibration.saved': 'Sofort wirksam und beim nächsten Anschluss dieses Modells automatisch aktiv.', 'calibration.disconnected': 'Controller getrennt. Kalibrierung nicht gespeichert.', 'calibration.progress': 'Schritt {current} von {total}', 'calibration.required': 'erforderlich', 'calibration.optional': 'optional', 'calibration.stepNote': '{progress} · {kind} · {label}',
  'device.none': 'Kein Controller verbunden', 'binding.inherit': 'Normal verwenden', 'binding.none': 'Nicht belegt', 'binding.upper': 'Oberes Zeichen', 'binding.lower': 'Unteres Zeichen', 'binding.left': 'Linkes Zeichen', 'binding.right': 'Rechtes Zeichen', 'binding.menu': 'Eingaberad wechseln', 'binding.space': 'Leertaste', 'binding.backspace': 'Rücktaste', 'binding.enter': 'Eingabe', 'binding.shift': 'Umschalt halten', 'binding.lighter': 'Deckkraft −', 'binding.solid': 'Deckkraft ＋', 'binding.mouseLeft': 'Linke Maustaste', 'binding.mouseRight': 'Rechte Maustaste', 'binding.mouseMiddle': 'Mittlere Maustaste', 'binding.keyboard': 'Tastatur {key}', 'binding.key.space': 'Leertaste', 'binding.key.backspace': 'Rücktaste', 'binding.key.enter': 'Eingabe', 'binding.key.tab': 'Tab', 'binding.key.escape': 'Esc', 'binding.key.delete': 'Entf', 'binding.key.left': '← Pfeiltaste', 'binding.key.right': '→ Pfeiltaste', 'binding.key.up': '↑ Pfeiltaste', 'binding.key.down': '↓ Pfeiltaste', 'binding.key.home': 'Pos1', 'binding.key.end': 'Ende', 'binding.key.copy': 'Strg+C', 'binding.key.paste': 'Strg+V', 'binding.key.undo': 'Strg+Z', 'binding.leftUpper': 'Linkes Rad · oben', 'binding.leftLower': 'Linkes Rad · unten', 'binding.leftLeft': 'Linkes Rad · links', 'binding.leftRight': 'Linkes Rad · rechts', 'binding.cycleLeft': 'Linkes Rad wechseln', 'binding.cycleRight': 'Rechtes Rad wechseln', 'binding.ctrl': 'Strg halten', 'binding.mediaPlay': 'Medien abspielen / pausieren', 'binding.mediaPrevious': 'Vorheriges Medium', 'binding.mediaNext': 'Nächstes Medium', 'binding.auxiliary': 'Für Zusatzbelegungen halten', 'binding.keyboardApp': 'Rad anzeigen / ausblenden', 'binding.dualRight': 'Rechtes Rad · {label}', 'dynamic.deviceConnected': '{name}', 'dynamic.error': '{message}',
};

const it = {
  ...en,
  'app.settingsTitle': 'Controller Companion · Impostazioni', 'page.appearance.title': 'Aspetto', 'page.appearance.subtitle': 'Opacità, contorni e dimensioni.', 'page.controller.title': 'Controller', 'page.controller.subtitle': 'Stick, pulsanti e modalità di input.', 'nav.appearance': 'Aspetto', 'nav.controller': 'Controller', 'device.waiting': 'In attesa del controller', 'device.connected': 'Controller connesso', 'sidebar.enabled': 'Input in background', 'sidebar.hamburger': 'Impostazioni di sistema', 'top.minimize': 'Riduci', 'top.done': 'Fine', 'preview.desktop': 'Anteprima live della ruota sul desktop', 'preview.badge': 'Anteprima aspetto', 'preview.refresh': 'Acquisisci di nuovo il desktop', 'preview.input': 'Anteprima disco di input', 'preview.captureFailed': 'Impossibile acquisire il desktop. Riprova.',
  'appearance.opacity': 'Opacità', 'appearance.material': 'Materiale', 'appearance.translucent': 'Trasparente', 'appearance.soft': 'Morbido', 'appearance.solid': 'Opaco', 'appearance.character': 'Caratteri', 'appearance.darkCharacter': 'Scuri', 'appearance.lightCharacter': 'Chiari', 'appearance.scale': 'Dimensioni', 'appearance.custom': 'Aspetto personalizzato', 'appearance.outlineColor': 'Contorno selezione', 'appearance.outlineWidth': 'Spessore', 'appearance.fillColor': 'Riempimento settori', 'appearance.textColor': 'Colore caratteri', 'appearance.reset': 'Ripristina predefiniti',
  'controller.current': 'Controller corrente', 'controller.noDevice': 'Nessun controller connesso', 'controller.connect': 'Collega un controller USB o Bluetooth', 'controller.mapped': 'Riconosciuto · Pronto all’uso', 'controller.needsCalibration': 'Calibrazione necessaria · Input sospeso per questo controller', 'controller.calibrate': 'Calibra pulsanti', 'controller.reset': 'Ripristina rilevamento automatico', 'controller.previewLayout': 'Layout anteprima (predefinito)', 'controller.singlePreview': 'Anteprima disco singolo', 'controller.dualPreview': 'Anteprima doppia', 'controller.activation': 'Apri / chiudi', 'controller.singleActivation': 'L3', 'controller.dualActivation': 'L3 + R3', 'controller.leftDisc': 'Disco sinistro', 'controller.rightDisc': 'Disco destro', 'controller.roleCollapsed': 'Ruota chiusa', 'controller.roleTyping': 'Scrittura', 'controller.roleSingle': 'Ⓛ Selezione　Ⓡ Mouse', 'controller.roleDual': 'Ⓛ Disco sinistro　Ⓡ Disco destro', 'controller.mouseSpeed': 'Velocità mouse', 'controller.scrollSpeed': 'Velocità scorrimento', 'controller.deadzone': 'Zona morta stick', 'controller.customButtons': 'Pulsanti personalizzati', 'controller.bindingModeIdle': 'Ruota chiusa', 'controller.bindingModeTyping': 'Input disco singolo', 'controller.bindingModeDual': 'Input doppio', 'controller.resetBindings': 'Ripristina predefiniti', 'controller.bindingLayer': 'Livello associazioni', 'controller.bindingBase': 'Normale', 'controller.bindingAuxiliary': 'Ausiliario', 'controller.auxHint': 'Assegna prima un pulsante a “tieni premuto per associazioni ausiliarie”', 'controller.reservedSingle': 'Apri / chiudi · fisso', 'controller.reservedDual': 'Apri / chiudi con combinazione · fisso', 'controller.switchWheel': 'Cambia disco di input', 'controller.opacityAdjust': 'Opacità − / ＋', 'controller.hintSingle': 'L3 · apri / chiudi　　XYAB → caratteri', 'controller.hintDual': 'L3 + R3 · apri / chiudi　　D-pad → sinistro　 XYAB → destro',
  'system.title': 'Impostazioni di sistema', 'system.language': 'Lingua interfaccia', 'system.theme': 'Tema', 'system.themeSystem': 'Sistema', 'system.themeLight': 'Chiaro', 'system.themeDark': 'Scuro', 'system.startAtLogin': 'Avvia all’accesso', 'system.closeBehavior': 'Quando si chiude la finestra', 'system.closeTray': 'Riduci nell’area di notifica', 'system.closeMinimize': 'Riduci finestra', 'system.closeQuit': 'Esci dall’app', 'system.enabled': 'Input in background', 'system.quit': 'Esci da Controller Companion', 'system.diagnose': 'Diagnostica', 'system.repair': 'Ripara', 'system.update': 'Aggiorna', 'system.firmware': 'Supporto firmware', 'system.languageSettings': 'Impostazioni lingua Windows', 'system.close': 'Fine', 'system.version': 'Versione', 'system.ready': 'Impostazioni salvate', 'system.working': 'Operazione in corso…',
  'system.result.diagnostics-ok': 'Diagnostica completata. Nessun problema rilevato.', 'system.result.diagnostics-issues': 'Diagnostica completata. Controlla i problemi segnalati.', 'system.result.repair-ok': 'Riparazione completata. Ripristinati: {files}.', 'system.result.update-cancelled': 'Aggiornamento annullato.', 'system.result.update-not-newer': 'La versione scelta non è più recente di quella attuale.', 'system.result.update-integrity': 'Controllo di integrità dell’aggiornamento non riuscito.', 'system.result.update-product': 'Il pacchetto non è di Controller Companion.', 'system.result.update-manifest': 'Il manifest dell’aggiornamento non è valido.', 'system.result.update-path': 'L’aggiornamento contiene un percorso non valido.', 'system.result.repair-backup': 'Il backup di riparazione non ha superato il controllo di integrità.', 'system.result.repair-unavailable': 'Nessun file di riparazione disponibile.', 'system.result.repair-failed': 'Riparazione non riuscita. Riapri l’app e riprova.', 'system.result.support-opened': 'Aperta la pagina ufficiale del supporto firmware.', 'system.result.language-settings-opened': 'Aperte le impostazioni lingua di Windows.', 'system.result.action-failed': 'Operazione non riuscita. Riprova più tardi.', 'system.diagnose.backend': 'Backend input', 'system.diagnose.service': 'Servizio input', 'system.diagnose.inputLanguage': 'Lingua input corrente', 'system.diagnose.devices': 'Controller', 'system.diagnose.ok': 'OK', 'system.diagnose.failed': 'Problema',
  'calibration.title': 'Calibrazione pulsanti controller', 'calibration.release': 'Rilascia tutti i pulsanti e centra gli stick', 'calibration.note': 'Quando sei pronto, inizia; rilascia e centra dopo ogni passaggio.', 'calibration.cancel': 'Annulla', 'calibration.skip': 'Salta questo elemento', 'calibration.start': 'Avvia calibrazione', 'calibration.save': 'Salva calibrazione', 'calibration.saved': 'Attiva subito e applicata automaticamente alla prossima connessione di questo modello.', 'calibration.disconnected': 'Controller scollegato. Calibrazione non salvata.', 'calibration.progress': 'Passaggio {current} di {total}', 'calibration.required': 'obbligatorio', 'calibration.optional': 'facoltativo', 'calibration.stepNote': '{progress} · {kind} · {label}',
  'device.none': 'Nessun controller connesso', 'binding.inherit': 'Usa normale', 'binding.none': 'Non assegnato', 'binding.upper': 'Carattere superiore', 'binding.lower': 'Carattere inferiore', 'binding.left': 'Carattere sinistro', 'binding.right': 'Carattere destro', 'binding.menu': 'Cambia disco input', 'binding.space': 'Spazio', 'binding.backspace': 'Backspace', 'binding.enter': 'Invio', 'binding.shift': 'Tieni Maiusc', 'binding.lighter': 'Opacità −', 'binding.solid': 'Opacità ＋', 'binding.mouseLeft': 'Pulsante sinistro mouse', 'binding.mouseRight': 'Pulsante destro mouse', 'binding.mouseMiddle': 'Pulsante centrale mouse', 'binding.keyboard': 'Tastiera {key}', 'binding.key.space': 'Spazio', 'binding.key.backspace': 'Backspace', 'binding.key.enter': 'Invio', 'binding.key.tab': 'Tab', 'binding.key.escape': 'Esc', 'binding.key.delete': 'Canc', 'binding.key.left': '← Tasto freccia', 'binding.key.right': '→ Tasto freccia', 'binding.key.up': '↑ Tasto freccia', 'binding.key.down': '↓ Tasto freccia', 'binding.key.home': 'Home', 'binding.key.end': 'Fine', 'binding.key.copy': 'Ctrl+C', 'binding.key.paste': 'Ctrl+V', 'binding.key.undo': 'Ctrl+Z', 'binding.leftUpper': 'Disco sinistro · alto', 'binding.leftLower': 'Disco sinistro · basso', 'binding.leftLeft': 'Disco sinistro · sinistra', 'binding.leftRight': 'Disco sinistro · destra', 'binding.cycleLeft': 'Cambia disco sinistro', 'binding.cycleRight': 'Cambia disco destro', 'binding.ctrl': 'Tieni Ctrl', 'binding.mediaPlay': 'Riproduci / pausa', 'binding.mediaPrevious': 'Elemento multimediale precedente', 'binding.mediaNext': 'Elemento multimediale successivo', 'binding.auxiliary': 'Tieni per associazioni ausiliarie', 'binding.keyboardApp': 'Mostra / nascondi ruota', 'binding.dualRight': 'Disco destro · {label}', 'dynamic.deviceConnected': '{name}', 'dynamic.error': '{message}',
};

const es = {
  ...en,
  'app.settingsTitle': 'Controller Companion · Ajustes', 'page.appearance.title': 'Apariencia', 'page.appearance.subtitle': 'Opacidad, contornos y tamaño.', 'page.controller.title': 'Mando', 'page.controller.subtitle': 'Palancas, botones y modos de entrada.', 'nav.appearance': 'Apariencia', 'nav.controller': 'Mando', 'device.waiting': 'Esperando al mando', 'device.connected': 'Mando conectado', 'sidebar.enabled': 'Entrada en segundo plano', 'sidebar.hamburger': 'Ajustes del sistema', 'top.minimize': 'Minimizar', 'top.done': 'Listo', 'preview.desktop': 'Vista previa en directo en el escritorio', 'preview.badge': 'Vista previa de apariencia', 'preview.refresh': 'Capturar el escritorio de nuevo', 'preview.input': 'Vista previa del disco de entrada', 'preview.captureFailed': 'No se ha podido capturar el escritorio. Inténtalo de nuevo.',
  'appearance.opacity': 'Opacidad', 'appearance.material': 'Material', 'appearance.translucent': 'Translúcido', 'appearance.soft': 'Suave', 'appearance.solid': 'Sólido', 'appearance.character': 'Caracteres', 'appearance.darkCharacter': 'Oscuros', 'appearance.lightCharacter': 'Claros', 'appearance.scale': 'Tamaño', 'appearance.custom': 'Apariencia personalizada', 'appearance.outlineColor': 'Contorno de selección', 'appearance.outlineWidth': 'Grosor', 'appearance.fillColor': 'Relleno de sectores', 'appearance.textColor': 'Color de caracteres', 'appearance.reset': 'Restaurar valores predeterminados',
  'controller.current': 'Mando actual', 'controller.noDevice': 'No hay ningún mando conectado', 'controller.connect': 'Conecta un mando USB o Bluetooth', 'controller.mapped': 'Reconocido · Listo para usar', 'controller.needsCalibration': 'Se necesita calibración · Entrada pausada para este mando', 'controller.calibrate': 'Calibrar botones', 'controller.reset': 'Restaurar detección automática', 'controller.previewLayout': 'Diseño de vista previa (predeterminado)', 'controller.singlePreview': 'Vista de un disco', 'controller.dualPreview': 'Vista de dos discos', 'controller.activation': 'Abrir / cerrar', 'controller.singleActivation': 'L3', 'controller.dualActivation': 'L3 + R3', 'controller.leftDisc': 'Disco izquierdo', 'controller.rightDisc': 'Disco derecho', 'controller.roleCollapsed': 'Rueda cerrada', 'controller.roleTyping': 'Escritura', 'controller.roleSingle': 'Ⓛ Selección　Ⓡ Ratón', 'controller.roleDual': 'Ⓛ Disco izquierdo　Ⓡ Disco derecho', 'controller.mouseSpeed': 'Velocidad del ratón', 'controller.scrollSpeed': 'Velocidad de desplazamiento', 'controller.deadzone': 'Zona muerta de la palanca', 'controller.customButtons': 'Botones personalizados', 'controller.bindingModeIdle': 'Rueda cerrada', 'controller.bindingModeTyping': 'Entrada de un disco', 'controller.bindingModeDual': 'Entrada de dos discos', 'controller.resetBindings': 'Restaurar valores predeterminados', 'controller.bindingLayer': 'Capa de asignaciones', 'controller.bindingBase': 'Normal', 'controller.bindingAuxiliary': 'Auxiliar', 'controller.auxHint': 'Primero asigna un botón a «mantener para usar asignaciones auxiliares»', 'controller.reservedSingle': 'Abrir / cerrar · fijo', 'controller.reservedDual': 'Abrir / cerrar con combinación · fijo', 'controller.switchWheel': 'Cambiar disco de entrada', 'controller.opacityAdjust': 'Opacidad − / ＋', 'controller.hintSingle': 'L3 · abrir / cerrar　　XYAB → caracteres', 'controller.hintDual': 'L3 + R3 · abrir / cerrar　　Cruceta → izquierda　 XYAB → derecha',
  'system.title': 'Ajustes del sistema', 'system.language': 'Idioma de la interfaz', 'system.theme': 'Tema', 'system.themeSystem': 'Sistema', 'system.themeLight': 'Claro', 'system.themeDark': 'Oscuro', 'system.startAtLogin': 'Iniciar al iniciar sesión', 'system.closeBehavior': 'Al cerrar la ventana', 'system.closeTray': 'Minimizar a la bandeja', 'system.closeMinimize': 'Minimizar ventana', 'system.closeQuit': 'Salir de la aplicación', 'system.enabled': 'Entrada en segundo plano', 'system.quit': 'Salir de Controller Companion', 'system.diagnose': 'Diagnosticar', 'system.repair': 'Reparar', 'system.update': 'Actualizar', 'system.firmware': 'Asistencia del firmware', 'system.languageSettings': 'Configuración de idioma de Windows', 'system.close': 'Listo', 'system.version': 'Versión', 'system.ready': 'Ajustes guardados', 'system.working': 'Procesando…',
  'system.result.diagnostics-ok': 'Diagnóstico terminado. No se han encontrado problemas.', 'system.result.diagnostics-issues': 'Diagnóstico terminado. Revisa los problemas indicados.', 'system.result.repair-ok': 'Reparación terminada. Restaurado: {files}.', 'system.result.update-cancelled': 'Actualización cancelada.', 'system.result.update-not-newer': 'La versión elegida no es más nueva que la actual.', 'system.result.update-integrity': 'La actualización no ha superado la comprobación de integridad.', 'system.result.update-product': 'El paquete no es de Controller Companion.', 'system.result.update-manifest': 'El manifiesto de actualización no es válido.', 'system.result.update-path': 'La actualización contiene una ruta no válida.', 'system.result.repair-backup': 'La copia de reparación no ha superado la comprobación de integridad.', 'system.result.repair-unavailable': 'No hay archivos de reparación disponibles.', 'system.result.repair-failed': 'La reparación ha fallado. Abre de nuevo la aplicación e inténtalo otra vez.', 'system.result.support-opened': 'Se ha abierto la página oficial de asistencia del firmware.', 'system.result.language-settings-opened': 'Se ha abierto la configuración de idioma de Windows.', 'system.result.action-failed': 'La acción ha fallado. Inténtalo más tarde.', 'system.diagnose.backend': 'Backend de entrada', 'system.diagnose.service': 'Servicio de entrada', 'system.diagnose.inputLanguage': 'Idioma de entrada actual', 'system.diagnose.devices': 'Mandos', 'system.diagnose.ok': 'Correcto', 'system.diagnose.failed': 'Problema',
  'calibration.title': 'Calibración de botones del mando', 'calibration.release': 'Suelta todos los botones y centra las palancas', 'calibration.note': 'Cuando estés listo, empieza; suelta y centra después de cada paso.', 'calibration.cancel': 'Cancelar', 'calibration.skip': 'Omitir este elemento', 'calibration.start': 'Iniciar calibración', 'calibration.save': 'Guardar calibración', 'calibration.saved': 'Se aplica de inmediato y automáticamente la próxima vez que conectes este modelo.', 'calibration.disconnected': 'Mando desconectado. La calibración no se ha guardado.', 'calibration.progress': 'Paso {current} de {total}', 'calibration.required': 'obligatorio', 'calibration.optional': 'opcional', 'calibration.stepNote': '{progress} · {kind} · {label}',
  'device.none': 'No hay ningún mando conectado', 'binding.inherit': 'Usar normal', 'binding.none': 'Sin asignar', 'binding.upper': 'Carácter superior', 'binding.lower': 'Carácter inferior', 'binding.left': 'Carácter izquierdo', 'binding.right': 'Carácter derecho', 'binding.menu': 'Cambiar disco de entrada', 'binding.space': 'Espacio', 'binding.backspace': 'Retroceso', 'binding.enter': 'Intro', 'binding.shift': 'Mantener Mayús', 'binding.lighter': 'Opacidad −', 'binding.solid': 'Opacidad ＋', 'binding.mouseLeft': 'Botón izquierdo del ratón', 'binding.mouseRight': 'Botón derecho del ratón', 'binding.mouseMiddle': 'Botón central del ratón', 'binding.keyboard': 'Teclado {key}', 'binding.key.space': 'Espacio', 'binding.key.backspace': 'Retroceso', 'binding.key.enter': 'Intro', 'binding.key.tab': 'Tab', 'binding.key.escape': 'Esc', 'binding.key.delete': 'Supr', 'binding.key.left': '← Tecla de flecha', 'binding.key.right': '→ Tecla de flecha', 'binding.key.up': '↑ Tecla de flecha', 'binding.key.down': '↓ Tecla de flecha', 'binding.key.home': 'Inicio', 'binding.key.end': 'Fin', 'binding.key.copy': 'Ctrl+C', 'binding.key.paste': 'Ctrl+V', 'binding.key.undo': 'Ctrl+Z', 'binding.leftUpper': 'Disco izquierdo · arriba', 'binding.leftLower': 'Disco izquierdo · abajo', 'binding.leftLeft': 'Disco izquierdo · izquierda', 'binding.leftRight': 'Disco izquierdo · derecha', 'binding.cycleLeft': 'Cambiar disco izquierdo', 'binding.cycleRight': 'Cambiar disco derecho', 'binding.ctrl': 'Mantener Ctrl', 'binding.mediaPlay': 'Reproducir / pausar contenido', 'binding.mediaPrevious': 'Contenido anterior', 'binding.mediaNext': 'Contenido siguiente', 'binding.auxiliary': 'Mantener para asignaciones auxiliares', 'binding.keyboardApp': 'Mostrar / ocultar rueda', 'binding.dualRight': 'Disco derecho · {label}', 'dynamic.deviceConnected': '{name}', 'dynamic.error': '{message}',
};

Object.assign(zhCN, {'system.subtitle': '应用行为、诊断与维护。'});
Object.assign(zhTW, {'system.subtitle': '應用程式行為、診斷與維護。'});
Object.assign(en, {'system.subtitle': 'App behavior, diagnostics, and maintenance.'});
Object.assign(ja, {'system.subtitle': 'アプリの動作、診断、メンテナンス。'});
Object.assign(fr, {'system.subtitle': 'Comportement, diagnostic et maintenance de l’application.'});
Object.assign(de, {'system.subtitle': 'App-Verhalten, Diagnose und Wartung.'});
Object.assign(it, {'system.subtitle': 'Comportamento, diagnostica e manutenzione dell’app.'});
Object.assign(es, {'system.subtitle': 'Comportamiento, diagnóstico y mantenimiento de la aplicación.'});

const dictionaries = {'zh-CN': zhCN, 'zh-TW': zhTW, en, ja, fr, de, it, es};

const extraStrings = {
  'zh-CN': {
    'top.close': '关闭',
    'common.cancel': '取消', 'native.updateChoose': '选择新版程序文件夹', 'native.updateCheck': '检查更新', 'native.updateTitle': '软件更新', 'native.updateDetail': '文件校验通过。重新启动以使用所选版本，保留当前设置和校准。', 'native.restart': '重新启动',
    'system.result.maintenance-busy': '输入服务正在处理另一项操作。', 'system.result.firmware-vendor-required': '请连接手柄后再打开对应厂商的官方固件支持。', 'system.result.update-ready': '更新已准备好。',
    'calibration.duplicate': '这个输入已使用，请换一个', 'calibration.recognized': '已识别 · 松开并回中', 'calibration.axisUsed': '这根摇杆轴已使用', 'calibration.complete': '校准完成',
  },
  'zh-TW': {
    'top.close': '關閉',
    'common.cancel': '取消', 'native.updateChoose': '選擇新版程式資料夾', 'native.updateCheck': '檢查更新', 'native.updateTitle': '軟體更新', 'native.updateDetail': '檔案驗證通過。重新啟動以使用所選版本，保留目前設定與校準。', 'native.restart': '重新啟動',
    'system.result.maintenance-busy': '輸入服務正在處理另一項操作。', 'system.result.firmware-vendor-required': '請連接手把後再開啟對應廠商的官方韌體支援。', 'system.result.update-ready': '更新已準備好。',
    'calibration.duplicate': '這個輸入已使用，請換一個', 'calibration.recognized': '已辨識 · 放開並回到中央', 'calibration.axisUsed': '這根搖桿軸已使用', 'calibration.complete': '校準完成',
  },
  en: {
    'top.close': 'Close',
    'common.cancel': 'Cancel', 'native.updateChoose': 'Choose the folder containing the newer app', 'native.updateCheck': 'Check for update', 'native.updateTitle': 'Software update', 'native.updateDetail': 'Files verified. Restart to use the selected version while keeping current settings and calibration.', 'native.restart': 'Restart',
    'system.result.maintenance-busy': 'The input service is busy with another operation.', 'system.result.firmware-vendor-required': 'Connect a controller before opening the vendor firmware support page.', 'system.result.update-ready': 'The update is ready.',
    'calibration.duplicate': 'That input is already used. Choose another.', 'calibration.recognized': 'Recognized · release and center', 'calibration.axisUsed': 'That stick axis is already used.', 'calibration.complete': 'Calibration complete',
  },
  ja: {
    'top.close': '閉じる',
    'common.cancel': 'キャンセル', 'native.updateChoose': '新しいアプリのフォルダーを選択', 'native.updateCheck': '更新を確認', 'native.updateTitle': 'ソフトウェア更新', 'native.updateDetail': 'ファイルを確認しました。現在の設定と調整を保ったまま、選択したバージョンを使うため再起動します。', 'native.restart': '再起動',
    'system.result.maintenance-busy': '入力サービスは別の操作を処理中です。', 'system.result.firmware-vendor-required': 'コントローラーを接続してからメーカーのファームウェアサポートを開いてください。', 'system.result.update-ready': '更新の準備ができました。',
    'calibration.duplicate': 'この入力は使用済みです。別の入力を選んでください。', 'calibration.recognized': '認識しました · 離して中央に戻してください', 'calibration.axisUsed': 'このスティック軸は使用済みです。', 'calibration.complete': '調整完了',
  },
  fr: {
    'top.close': 'Fermer',
    'common.cancel': 'Annuler', 'native.updateChoose': 'Choisir le dossier de la nouvelle application', 'native.updateCheck': 'Rechercher une mise à jour', 'native.updateTitle': 'Mise à jour logicielle', 'native.updateDetail': 'Fichiers vérifiés. Redémarrez pour utiliser la version choisie en conservant les réglages et l’étalonnage.', 'native.restart': 'Redémarrer',
    'system.result.maintenance-busy': 'Le service d’entrée traite déjà une autre opération.', 'system.result.firmware-vendor-required': 'Connectez une manette avant d’ouvrir l’assistance du fabricant.', 'system.result.update-ready': 'La mise à jour est prête.',
    'calibration.duplicate': 'Cette entrée est déjà utilisée. Choisissez-en une autre.', 'calibration.recognized': 'Reconnu · relâchez et recentrez', 'calibration.axisUsed': 'Cet axe de stick est déjà utilisé.', 'calibration.complete': 'Étalonnage terminé',
  },
  de: {
    'top.close': 'Schließen',
    'common.cancel': 'Abbrechen', 'native.updateChoose': 'Ordner der neuen Anwendung auswählen', 'native.updateCheck': 'Nach Aktualisierung suchen', 'native.updateTitle': 'Softwareaktualisierung', 'native.updateDetail': 'Dateien geprüft. Neustarten, um die gewählte Version mit den aktuellen Einstellungen und der Kalibrierung zu verwenden.', 'native.restart': 'Neu starten',
    'system.result.maintenance-busy': 'Der Eingabedienst verarbeitet bereits einen anderen Vorgang.', 'system.result.firmware-vendor-required': 'Controller verbinden, bevor der Firmware-Support des Herstellers geöffnet wird.', 'system.result.update-ready': 'Die Aktualisierung ist bereit.',
    'calibration.duplicate': 'Diese Eingabe wird bereits verwendet. Eine andere wählen.', 'calibration.recognized': 'Erkannt · loslassen und zentrieren', 'calibration.axisUsed': 'Diese Stick-Achse wird bereits verwendet.', 'calibration.complete': 'Kalibrierung abgeschlossen',
  },
  it: {
    'top.close': 'Chiudi',
    'common.cancel': 'Annulla', 'native.updateChoose': 'Scegli la cartella della nuova applicazione', 'native.updateCheck': 'Controlla aggiornamenti', 'native.updateTitle': 'Aggiornamento software', 'native.updateDetail': 'File verificati. Riavvia per usare la versione scelta mantenendo impostazioni e calibrazione attuali.', 'native.restart': 'Riavvia',
    'system.result.maintenance-busy': 'Il servizio input sta elaborando un’altra operazione.', 'system.result.firmware-vendor-required': 'Collega un controller prima di aprire il supporto firmware del produttore.', 'system.result.update-ready': 'L’aggiornamento è pronto.',
    'calibration.duplicate': 'Questo input è già in uso. Scegline un altro.', 'calibration.recognized': 'Riconosciuto · rilascia e centra', 'calibration.axisUsed': 'Questo asse dello stick è già in uso.', 'calibration.complete': 'Calibrazione completata',
  },
  es: {
    'top.close': 'Cerrar',
    'common.cancel': 'Cancelar', 'native.updateChoose': 'Elegir la carpeta de la nueva aplicación', 'native.updateCheck': 'Buscar actualización', 'native.updateTitle': 'Actualización de software', 'native.updateDetail': 'Archivos verificados. Reinicia para usar la versión seleccionada conservando los ajustes y la calibración actuales.', 'native.restart': 'Reiniciar',
    'system.result.maintenance-busy': 'El servicio de entrada está procesando otra operación.', 'system.result.firmware-vendor-required': 'Conecta un mando antes de abrir la asistencia de firmware del fabricante.', 'system.result.update-ready': 'La actualización está lista.',
    'calibration.duplicate': 'Esa entrada ya está en uso. Elige otra.', 'calibration.recognized': 'Reconocido · suelta y centra', 'calibration.axisUsed': 'Ese eje de la palanca ya está en uso.', 'calibration.complete': 'Calibración terminada',
  },
};
for (const [language, values] of Object.entries(extraStrings)) Object.assign(dictionaries?.[language] ?? {}, values);

const collapsedRoleText = {
  'zh-CN': 'Ⓛ 鼠标　Ⓡ 四向滚动', 'zh-TW': 'Ⓛ 滑鼠　Ⓡ 四向捲動', en: 'Ⓛ Mouse　Ⓡ Four-way scroll', ja: 'Ⓛ マウス　Ⓡ 4方向スクロール', fr: 'Ⓛ Souris　Ⓡ Défilement à quatre directions', de: 'Ⓛ Maus　Ⓡ Vier-Wege-Scroll', it: 'Ⓛ Mouse　Ⓡ Scorrimento a quattro direzioni', es: 'Ⓛ Ratón　Ⓡ Desplazamiento en cuatro direcciones',
};
for (const [language, value] of Object.entries(collapsedRoleText)) dictionaries[language]['controller.roleCollapsedHint'] = value;
const ariaText = {
  'zh-CN': {'nav.categories': '设置分类', 'system.actions': '系统操作'}, 'zh-TW': {'nav.categories': '設定分類', 'system.actions': '系統操作'}, en: {'nav.categories': 'Settings categories', 'system.actions': 'System actions'}, ja: {'nav.categories': '設定カテゴリ', 'system.actions': 'システム操作'}, fr: {'nav.categories': 'Catégories des paramètres', 'system.actions': 'Actions système'}, de: {'nav.categories': 'Einstellungskategorien', 'system.actions': 'Systemaktionen'}, it: {'nav.categories': 'Categorie impostazioni', 'system.actions': 'Azioni di sistema'}, es: {'nav.categories': 'Categorías de ajustes', 'system.actions': 'Acciones del sistema'},
};
for (const [language, values] of Object.entries(ariaText)) Object.assign(dictionaries[language], values);
Object.assign(en, {'controller.roleCollapsedHint': collapsedRoleText.en});
const physicalNames = {
  'zh-CN': {'physical.menu': '菜单', 'physical.view': '视图', 'physical.lb': 'LB', 'physical.rb': 'RB', 'physical.lt': 'LT', 'physical.rt': 'RT', 'physical.r3': 'R3'},
  'zh-TW': {'physical.menu': '選單', 'physical.view': '檢視', 'physical.lb': 'LB', 'physical.rb': 'RB', 'physical.lt': 'LT', 'physical.rt': 'RT', 'physical.r3': 'R3'},
  en: {'physical.menu': 'Menu', 'physical.view': 'View', 'physical.lb': 'LB', 'physical.rb': 'RB', 'physical.lt': 'LT', 'physical.rt': 'RT', 'physical.r3': 'R3'},
  ja: {'physical.menu': 'メニュー', 'physical.view': '表示', 'physical.lb': 'LB', 'physical.rb': 'RB', 'physical.lt': 'LT', 'physical.rt': 'RT', 'physical.r3': 'R3'},
  fr: {'physical.menu': 'Menu', 'physical.view': 'Vue', 'physical.lb': 'LB', 'physical.rb': 'RB', 'physical.lt': 'LT', 'physical.rt': 'RT', 'physical.r3': 'R3'},
  de: {'physical.menu': 'Menü', 'physical.view': 'Ansicht', 'physical.lb': 'LB', 'physical.rb': 'RB', 'physical.lt': 'LT', 'physical.rt': 'RT', 'physical.r3': 'R3'},
  it: {'physical.menu': 'Menu', 'physical.view': 'Vista', 'physical.lb': 'LB', 'physical.rb': 'RB', 'physical.lt': 'LT', 'physical.rt': 'RT', 'physical.r3': 'R3'},
  es: {'physical.menu': 'Menú', 'physical.view': 'Vista', 'physical.lb': 'LB', 'physical.rb': 'RB', 'physical.lt': 'LT', 'physical.rt': 'RT', 'physical.r3': 'R3'},
};
for (const [language, values] of Object.entries(physicalNames)) Object.assign(dictionaries[language], values);
Object.assign(en, physicalNames.en);
export const REQUIRED_KEYS = Object.freeze(Object.keys(en));

export function normalizeLocale(value) {
  return LOCALES.includes(value) ? value : 'zh-CN';
}

export function getLocale(locale) {
  return dictionaries[normalizeLocale(locale)];
}

export function translate(locale, key, values = {}) {
  const text = getLocale(locale)[key] ?? zhCN[key] ?? key;
  return String(text).replace(/\{([\w.-]+)\}/g, (_, name) => values[name] == null ? `{${name}}` : String(values[name]));
}

export const t = translate;

const ACTION_KEY = {
  none: 'binding.none', Y: 'binding.upper', A: 'binding.lower', X: 'binding.left', B: 'binding.right', menu: 'binding.menu', space: 'binding.space', backspace: 'binding.backspace', enter: 'binding.enter', shift: 'binding.shift', lighter: 'binding.lighter', solid: 'binding.solid', mouseLeft: 'binding.mouseLeft', mouseRight: 'binding.mouseRight', mouseMiddle: 'binding.mouseMiddle', leftY: 'binding.leftUpper', leftA: 'binding.leftLower', leftX: 'binding.leftLeft', leftB: 'binding.leftRight', cycleLeft: 'binding.cycleLeft', cycleRight: 'binding.cycleRight', 'modifier:ctrl': 'binding.ctrl', 'modifier:shift': 'binding.shift', 'key:mediaPlay': 'binding.mediaPlay', 'key:mediaPrevious': 'binding.mediaPrevious', 'key:mediaNext': 'binding.mediaNext', 'layer:auxiliary': 'binding.auxiliary', 'app:keyboard': 'binding.keyboardApp',
};

export function actionLabel(locale, action, values = {}) {
  if (action === 'inherit') return translate(locale, 'binding.inherit', values);
  const key = ACTION_KEY[action];
  if (key) return translate(locale, key, values);
  if (action?.startsWith('key:')) {
    const name = action.slice(4);
    const special = translate(locale, `binding.key.${name}`, values);
    return special !== `binding.key.${name}` ? special : translate(locale, 'binding.keyboard', {key: name.length === 1 ? name.toUpperCase() : name});
  }
  return action || translate(locale, 'binding.none', values);
}

export function installTranslations({locale = 'zh-CN', root = document} = {}) {
  const current = normalizeLocale(locale);
  root.documentElement?.setAttribute('lang', current);
  for (const element of root.querySelectorAll?.('[data-i18n]') ?? []) element.textContent = translate(current, element.dataset.i18n, element.dataset.i18nValues ? JSON.parse(element.dataset.i18nValues) : {});
  for (const element of root.querySelectorAll?.('[data-i18n-aria]') ?? []) element.setAttribute('aria-label', translate(current, element.dataset.i18nAria));
  for (const element of root.querySelectorAll?.('[data-i18n-title]') ?? []) element.setAttribute('title', translate(current, element.dataset.i18nTitle));
  for (const element of root.querySelectorAll?.('[data-i18n-placeholder]') ?? []) element.setAttribute('placeholder', translate(current, element.dataset.i18nPlaceholder));
  return current;
}

export function systemActionMessage(locale, result = {}) {
  const code = result.code || (result.ok ? 'diagnostics-ok' : 'action-failed');
  const key = `system.result.${code}`;
  const safeKey = Object.hasOwn(getLocale(locale), key) ? key : 'system.result.action-failed';
  const values = {files: Array.isArray(result.details?.restoredFiles) ? result.details.restoredFiles.join(', ') : result.details?.files ?? ''};
  return translate(locale, safeKey, values);
}
