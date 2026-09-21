# Conroller Plus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 在现有仓库中实现符合已确认 Figma 设计与输入规则的 Conroller Plus Windows 便携验收版。

**Architecture:** 保留 .NET Framework 4.8 + 共享 WebView2 宿主以及 SDL/XInput 输入后端。设置界面和输入规则继续独立，通过 window.desktop 与宿主通信；配置按全局外观与设备档案拆分，维护下载和文件替换使用独立宿主模块。

**Tech Stack:** HTML/CSS/JavaScript ES modules、Node 内置测试、WPF/WebView2、C# net48、SDL3、PowerShell、现有 Playwright 开发依赖。

**Spec:** [2026-09-21-conroller-plus-design.md](../specs/2026-09-21-conroller-plus-design.md)

**Status:** 规格中的四个末尾问题已获用户裁定；本计划待审阅和选择执行方式。当前仅完成代码调查、原型扫描和图标导出取样，尚未实现下列产品改动。

## Global Constraints

- 产品名严格为 Conroller Plus；本地验收版本 1.0.0，不推送、发布或修改远端发行版。
- Windows 10/11 x64；沿用现有宿主，不恢复 Electron，不新增 UI 框架。
- 固定窗口尺寸对应 Figma 实际窗口边框；禁止最大化和手动改变窗口大小。
- 从 Figma 原节点导出所有符号/按钮图标；普通文字内置 SF Pro、中文苹方、日文 Hiragino。
- 三语 zh-CN/en/ja；首次跟随 Windows，不支持的语言回退 en；配置文件保存用户选择。
- 默认 Single、abc、Opaque 50%、Size 100%；Size 50%–150%；左右死区各 10%，范围 0%–40%。
- 鼠标速度默认 5500，范围 150–8000；滚动速度默认 10，范围 1–20。
- 状态键 L3 与当前输入状态的选字绑定锁定；其余键可自定义。
- 连发 400ms 起、60ms 间隔；R3 三次短按窗口 600ms；字符布局切换 220ms 弹簧。
- 新配置不迁移旧版本；以独立目录首次初始化，以后启动/更新保留新版配置。
- 主窗口隐藏/最小化不能停用运行引擎；断联释放输入并显示未接入界面。
- 删除旧校准、辅助层、颜色自定义、固件入口和桌面截图预览的运行路径与发布文件。

## Review Focus

1. 死区设为 0% 且摇杆精确回中时仍必须不选字；不可发生除零或保留旧选区。任务 2 加入零向量与跨扇区长按测试。
2. 收进托盘、拖动/最小化窗口或切换设置页时输入引擎不能停止；只有设备断联、退出或目标会话失效清理按键。任务 5 加入宿主状态测试和桌面验收。
3. R3 普通自定义按键与三连按不得重复执行；连发不能让切换动作来回抖动。任务 2 加入时间边界和输入释放测试。
4. 两只同型号手柄、无序列号设备及设备断联不能套用另一设备的档案或悄悄转移控制。任务 1/2 覆盖设备身份与选择状态。
5. 更新下载失败、损坏 ZIP、替换中断或依赖缺失时，应保留可运行旧版和用户设置。任务 7 使用本地固定数据与临时目录验证，任务 8 检查打包完整性。

## 文件职责与接口约定

| 文件/模块 | 职责 |
| --- | --- |
| src/controls.js | 动作目录、默认和锁定绑定、物理键位置 |
| src/appearance.js、system.js | 参数归一化、主题材质规则、三语系统设置 |
| src/device-profiles.js（新增） | 设备身份与独立三状态绑定/左右死区档案 |
| src/activation.js、radial.js、session.js、pointer.js | 手势、死区、选字/连发、键鼠动作 |
| src/repeat-actions.js（新增） | 共用的按键边沿和 400/60ms 连发规则 |
| src/runtime-engine.js、runtime-entry.js | 设备配置合成与状态广播，保持已有平台边界 |
| assets/figma-ui/、assets/fonts/ | 图标、背景、logo 与固定字体 |
| src/figma-assets.js、wheel-motion.js（新增） | 原型素材索引、220ms 弹簧时间轴 |
| settings.html、src/settings.js、settings.css、settings-controls.js（新增） | 两页界面、菜单、映射与禁用状态 |
| src/i18n.js、theme.js、wheel-view.js、wheel.css、overlay.js | 三语、主题、共用转盘渲染 |
| host/BrowserWindow.cs、AppHost.cs、NativeWindows.cs | 固定窗口、拖动、后台生命周期、无焦点转盘 |
| host/OverlayPlacement.cs（新增）、HostPolicy.cs | 纯定位算法、窗口输入参数和系统设置策略 |
| host/ReleaseClient.cs、UpdateRunner.cs、DependencyRepair.cs（新增） | 发布检查/下载、更新替换与回滚、依赖修复 |
| host/Maintenance.cs、NativeService.cs | 完整性验证和输入服务停启 |
| scripts/package-webview2.ps1、verify-package.mjs | 干净构建白名单、哈希清单、便携包 |

继续使用 getAppearance/setAppearance/onAppearance、getRuntime/onRuntime、getSystem/setSystem/onSystem、controllerAction 和 windowAction。禁止设置组件直接执行原生输入或读写任意文件。

合成后的外观对象使用 `deadzoneLeft`、`deadzoneRight` 和 `bindings`；这三个字段存于设备档案，其余外观字段存于全局配置。`setAppearance(patch)` 在引擎中按字段分流保存，不由 UI 实现两套配置。

## Task 1: 默认配置、锁定映射与设备档案

**Files:** 修改 src/controls.js、appearance.js、system.js、i18n.js、host/HostPolicy.cs；新建 src/device-profiles.js；修改 tests/appearance.test.js、system.test.js、HostPolicyTests.cs；新建 tests/device-profiles.test.js。

**Interfaces:**
- `normalizeAppearance(value = {})` 返回完整的有效设置视图；保留 opacity/scale/keyboardMode/leftDisc/rightDisc/mouseSpeed/scrollSpeed 名称。
- `normalizeBindings(value = {})` 返回 idle/typing/dual 三套绑定，并强制恢复 LOCKED_BINDINGS 中的动作。
- `deviceKey(device)` 优先稳定硬件身份；仅 GUID/型号可用时明确该限制，不用会变动的连接序号当永久身份。
- `normalizeControllerSettings(value = {})` 返回 `{preferredKey, profiles}`。
- `getDeviceProfile(settings, device)` 与 `setDeviceProfile(settings, device, patch)` 提供独立 bindings/deadzoneLeft/deadzoneRight。

- [ ] 先加入实质性断言并运行，确认旧默认值/可改选字行为会失败：

```js
const a = normalizeAppearance({deadzoneLeft: 0, deadzoneRight: 99});
assert.equal(a.deadzoneLeft, 0);
assert.equal(a.deadzoneRight, 40);
assert.equal(a.scale, 100);
assert.equal(a.opacity, 50);
assert.equal(a.mouseSpeed, 5500);
assert.equal(normalizeBindings({typing: {A: 'mouseLeft'}}).typing.A, 'A');
assert.equal(normalizeBindings({idle: {A: 'key:tab'}}).idle.A, 'key:tab');
```

- [ ] 实现三套默认绑定与锁定表：idle 箭头为 key:up/down/left/right，A/B 为 mouseLeft/mouseRight；typing 面键固定，方向键默认 space/enter/cyclePrevious/cycleNext；dual 面键与方向键固定；其他键 none。
- [ ] 动作列表保留通用键盘/鼠标/修饰键，加 cyclePrevious/cycleNext/cycleLeft/cycleRight/ime；删除辅助层与颜色动作。锁定检查在配置归一化和提交时均生效。
- [ ] 将系统语言缩减为三种，Windows 语言仅在无保存值时应用；关闭行为仅 tray/quit。
- [ ] 覆盖设备 A/B 独立设置、断开重连稳定身份、无序列号同型号的可识别边界。原生设备字段不足时在 native/ControllerInput.cs 与 SdlNative.cs 增补可用身份字段，先核对官方 API。
- [ ] 运行 `node --test tests/appearance.test.js tests/system.test.js tests/device-profiles.test.js` 及宿主策略测试；Expected: 默认值、边界、锁定绑定和档案隔离通过。
- [ ] 提交本任务改动，保留原第三方许可。

## Task 2: 三状态输入、死区、连发与 R3

**Files:** 修改 src/activation.js、radial.js、session.js、pointer.js、runtime-engine.js、runtime-entry.js、native/Bridge.cs、native/Ime.cs；新建 src/repeat-actions.js；更新 tests/radial.test.js、session.test.js、pointer.test.js、runtime-engine.test.js、newgesture.test.js、dual.test.js。

**Interfaces:**
- 保留 `InputSession.step(packet, now, settings)` 和 `PointerInput.step(packet, active, settings, now, enabled)` 的调用形状。
- `RepeatActions.step(downSet, now, repeatableSet)` 返回本帧应触发的动作集合；reset 清除所有计时。
- 手势输出继续携带 toggle/tapR3/tapCount/imeSwitch/pointerButtons，L3 的 layout 使用 settings.keyboardMode，不再识别 L3+R3 双盘组合。
- `RuntimeEngine.getAppearance()` 合成选中设备档案；`getRuntime()` 继续广播 connected/layout/left/right/device/devices/selectedDevice/pulses，并提供按键预览状态。

- [ ] 添加时间轴测试，在旧实现上确认失败：

```js
const gate = new RepeatActions();
const held = new Set(['key:space']);
const repeatable = new Set(['key:space']);
assert.deepEqual([...gate.step(held, 0, repeatable)], ['key:space']);
assert.equal(gate.step(held, 399, repeatable).size, 0);
assert.equal(gate.step(held, 400, repeatable).size, 1);
assert.equal(gate.step(held, 459, repeatable).size, 0);
assert.equal(gate.step(held, 460, repeatable).size, 1);
```

- [ ] 修改 `sectorFromStick`，中心/死区/上方缺口返回 null；不把上一选区作为中心返回值。测试 deadzoneLeft=0、坐标精确 0、跨扇区移动、双盘不同死区。
- [ ] L3 按设置打开 single/dual；每次打开读取默认字符布局；去掉组合键延迟。保持失焦/断联输入释放。
- [ ] 字符、空格、退格、回车和键盘方向键采用 400/60 连发；切换类动作边沿触发；鼠标/修饰键发送 down/up 生命周期。
- [ ] R3 保留 600ms 三连按仲裁。三连按只产生一次 ime 事件；一个/两个短按到期重放普通绑定；持续按住及释放不会留下按键。测试 599/600/601ms 边界。
- [ ] 输入法动作与 R3 三连按走同一原生实现；保留已安装输入法，不安装语言包、不修改界面语言。
- [ ] 运行 `node --test tests/radial.test.js tests/session.test.js tests/pointer.test.js tests/runtime-engine.test.js tests/newgesture.test.js tests/dual.test.js`；Expected: 新规则全部通过，设备断联没有继续输出。
- [ ] 提交本任务；已删除功能的旧断言同步删除，不能靠跳过有效回归测试掩盖失败。

## Task 3: Figma 素材、固定文字字体与 220ms 动画

**Files:** 新建 assets/figma-ui/、assets/fonts/、src/figma-assets.js、src/wheel-motion.js、tests/wheel-motion.test.js；核对/修改 src/figma-layout.js、wheel-view.js、wheel.css、appearance.js。

**Interfaces:**
- `FIGMA_ASSETS` 以语义角色映射 `{src, nodeId, width, height}`；尺寸显式，源图层名称仅作线索，最终按实际图形确认物理键。
- 图标使用原始 SVG 导出或原始位图。导出自 Figma 的 path 可保留；不手工编写替代 path。
- `WHEEL_TRANSITION_MS = 220`；`springProgress(t)` 在 t=0 为 0、t=1 为 1，使用原弹簧形状并在结束时稳定落位。
- `createWheel(host)` 保留 update/pulse/size 接口，渲染输入统一为 `{mode, selected, shift}`。

- [ ] 从 software 扫描清单逐个导出 22 类符号、按钮图、logo 和固定背景，去重并记源节点。型号文字与符号混在同一图层时分别布局真实文字和图标图片；不能把整段固定型号文字作为不可更新图片。
- [ ] 逐个检查导出图形。已发现单独 PNG 导出可能成为全黑块，必须检查像素/渲染结果；优先 `exportAsync({format:'SVG_STRING',svgOutlineText:true})` 的原始 SVG 轮廓，失败则读源节点重新导出。
- [ ] 图标涵盖 ABXY、方向键、肩键/扳机、View/Menu/L3/R3、型号、导航、设置按钮；PS/NS 缺少的实际图形必须从源原型或用户确认的素材获取，不从自动组名猜测。
- [ ] 字体复制到应用资源并定义 @font-face；SF Pro 负责拉丁文字，PingFang SC 负责中文，Hiragino 负责日文。符号不再占用字体特殊字符位。
- [ ] 核对三个字符布局的每个字符和扇区，以真实文字/位置修正旧 figma-layout；不得仅认为旧素材已正确。
- [ ] 加入动画端点和中断重启测试：

```js
assert.equal(WHEEL_TRANSITION_MS, 220);
assert.equal(springProgress(0), 0);
assert.equal(springProgress(1), 1);
for (const t of [0.1, 0.3, 0.5, 0.9]) assert.ok(Number.isFinite(springProgress(t)));
```

- [ ] 实现统一切换时间轴和浅/深材质连续插值，0/50/100 精确对应原型端点。主题色、字符反色和透明度独立，不能把 0% 设为整盘 opacity:0。
- [ ] 运行 `node --test tests/wheel-motion.test.js tests/radial.test.js`；在素材预览中逐项确认图标可见、无缺字和黑块；Expected: 字符布局与原型一致，切换 220ms 完成。
- [ ] 提交素材来源索引与渲染改动，不提交临时下载 URL。

## Task 4: 固定设置界面与功能接线

**Files:** 重写 settings.html、src/settings.js、settings.css；新建 src/settings-controls.js；修改 src/i18n.js、theme.js；新建 tests/conroller-plus-ui.mjs。

**Interfaces:**
- 仅调用 window.desktop 的既有 API；所有下拉组件提供相同的 value/change/disabled 行为。
- 页面状态来自 onRuntime/onAppearance/onSystem，不另造演示用永久连接状态。
- `windowAction('hide')` 为 Get started；`systemAction({action:'check-update'|'download-update'|'install-update'|'diagnose'|'repair'})` 对接任务 7。

- [ ] 根据 Figma 实际坐标及边框确定固定画布；消除预留最大化位置；两页切换不销毁运行引擎。
- [ ] 复现未接入/已接入外观页、Controller 页和语言风格菜单；转盘预览固定背景、溢出裁切、随 Size 同比缩放。
- [ ] 加入三态主题、三材质预设及连续滑块、左右死区、Single/Dual、abc/ABC/123 默认、速度和系统控件；数字范围以全局约束为准。
- [ ] 映射表按状态呈现锁定项及可编辑项，修改后同步功能键图例；Restore Defaults 仅作用当前状态。
- [ ] 手柄型号组件内提供选择菜单，使用实际物理键符号；未接入禁用参数/绑定，但语言、更新、修复及窗口操作可用。
- [ ] 三语覆盖弹层、错误、状态、按钮及原生提示；删除旧多余语言和功能入口。
- [ ] 使用桌面接口 stub 驱动有意义的 UI 测试：

```js
await page.locator('[data-tab="controller"]').click();
await page.locator('[data-bind-mode="typing"]').click();
assert.equal(await page.locator('[data-physical="A"]').isDisabled(), true);
assert.equal(await page.locator('[data-physical="LT"]').isEnabled(), true);
// Feed disconnected state through the stub's onRuntime callback.
assert.equal(await page.locator('[data-action="update"]').isEnabled(), true);
assert.equal(await page.locator('[data-physical="LT"]').isDisabled(), true);
```

- [ ] 执行 `node tests/conroller-plus-ui.mjs`；Expected: 真实 change 调用被捕获，三个语言/主题/连接状态正确，预览裁切不改变 Size 数值。
- [ ] 对固定窗口截图与 Figma 进行一次逐区对照；只针对发现的差异修复。提交本任务。

## Task 5: Windows 窗口、托盘、后台与新配置

**Files:** 修改 host/BrowserWindow.cs、AppHost.cs、HostPolicy.cs、ControllerCompanion.csproj、src/webview-bridge.js、runtime-entry.js；新建 host/WindowLifecycle.cs、tests/WindowLifecycleTests.cs 及其 csproj；更新 scripts/test-host.ps1。

**Interfaces:**
- `window.action` 支持 drag/minimize/close/hide/settings/quit；hide 不停止输入。
- `WindowLifecycle.Decide(action, closeBehavior, connected)` 返回窗口/退出意图，使后台行为可脱离 WPF 测试。
- `runtime.connected` 的 true→false 边沿触发显示主窗口；启动未连接不能反复抢焦点。
- 配置目录 `%APPDATA%/ConrollerPlus`；WebView2 子目录继续独立。默认版本 1.0.0。

- [ ] 先测试 hide/minimize/close-to-tray 不发 stop-input，quit/断联发 release；为 repeated disconnected packet 加入只显示一次断言。
- [ ] WPF 固定窗口、移除最大化能力；拖动通过鼠标消息与排除交互控件的 hit test 实现，不依赖 Electron app-region。
- [ ] 删除 CaptureAsync、desktop.preview、captureDesktop、onDesktop 及所有相关状态；打开设置不再截图。
- [ ] 修正 StateChanged、OpenSettings、CloseSettings 的 StopInput 调用位置；设置显示/隐藏不影响手柄鼠标能力，退出/失效会话仍释放输入。
- [ ] 添加托盘菜单及 logo 状态色；更新托盘/窗口/错误提示名称；手动启动显示窗口，--background 登录启动隐藏。
- [ ] 新配置只初始化一次；跟随系统语言/主题；开机启动只在用户更改时写入启动项，取消启动项同样有效。
- [ ] 运行 `npm run test:host` 与 `npm run build:host`；Expected: 新生命周期测试、原信任边界和配置策略通过。
- [ ] 启动测试构建并实际验证拖动、最小化、托盘返回、右键退出以及后台模拟包处理；不把模拟包验证写成真手柄验证。提交本任务。

## Task 6: 转盘定位、焦点与显示器边界

**Files:** 新建 host/OverlayPlacement.cs、tests/OverlayPlacementTests.cs 及其 csproj；修改 NativeWindows.cs、HostPolicy.cs、AppHost.cs、src/overlay.js、overlay.css。

**Interfaces:**
- `OverlayPlacement.Calculate(anchor, caret, workArea, wheelSize, notchOffset)` 返回物理像素矩形；caret 可缺失。
- `NativeWindows.Position` 负责鼠标/输入位置、显示器 DPI 的采集与调用算法；仅从隐藏→显示时确定位置。
- size/notchOffset 从实际 Figma 布局导出的常量获得，双盘使用两缺口中心的中点。

- [ ] 先测试下方优先、下方不足改上方/侧边、负坐标显示器、混合 DPI、避让文字矩形、打开后鼠标移动不重新定位。
- [ ] 读取 Windows 可用文字光标/输入区域，失败时使用鼠标锚点；不能在失败时返回屏幕原点当有效光标。
- [ ] 保持 WS_EX_NOACTIVATE/鼠标穿透；不添加盘体鼠标事件或拖动。
- [ ] 当实际盘体超过整个工作区时记录尺寸证据，向用户确认适配方案；不能暗中改变用户 Size 或裁切盘体来声称满足完整可见。
- [ ] 执行 `npm run test:host` 并在可用显示器上验证一次普通文本输入定位；Expected: 焦点留在输入应用，盘体不追随鼠标，正常大小满足边界与避让。
- [ ] 提交本任务。

## Task 7: 月度更新、确认安装与完整性修复

**Files:** 新建 host/ReleaseClient.cs、UpdateRunner.cs、DependencyRepair.cs、tests/ReleaseClientTests.cs、tests/UpdateRunnerTests.cs 及对应 csproj；修改 AppHost.cs、Maintenance.cs、HostPolicy.cs；新增 scripts/Repair-ConrollerPlus.ps1 与 .cmd 入口。

**Interfaces:**
- `ReleaseClient.CheckAsync(currentVersion, lastCheckUtc, force)` 只取最新正式版元数据，返回 `{available, version, checkedAt, error}`；下载是独立操作。
- `ReleaseClient.DownloadAsync(release, progress)` 返回经哈希和完整性验证的暂存目录；拒绝非预期来源、跨产品包和低版本。
- `UpdateRunner.Apply(stagedRoot, installRoot, previousPid)` 在旧进程退出后替换；失败回滚；独立配置目录不在替换范围。
- `DependencyRepair.Diagnose(appRoot)` 返回依赖与文件清单，`RepairAsync(report, progress)` 仅处理确认的诊断结果。

- [ ] 用注入 HTTP handler、本地 ZIP 与临时目录先覆盖：未到月度期限不请求、到期只请求元数据、用户下载前不取包、忽略预发布、无网络显示可重试状态。
- [ ] 使用 GitHub 官方 Releases API 与正式版 assets；更新右侧绿点来自真实 available 状态，下载完成等待单独的重启确认。
- [ ] 校验 ZIP 路径不越界、清单每文件 SHA-256、产品/版本及必需文件；修复下载同版本文件，更新才允许升版本。
- [ ] 实现退出等待、原目录备份、替换、回滚和重新启动；失败保留错误记录而不删除可运行旧版本。
- [ ] 检测 .NET/WebView2/输入后端及应用清单；确认修复后下载全部缺失/损坏项并执行安装/恢复。官方依赖安装若需要权限，交给 Windows 正常提示。
- [ ] 软件缺少 WebView2/网页文件无法打开时，原生启动诊断仍可指引；.NET 无法启动时提供独立 PowerShell 修复入口。
- [ ] 测试下载中断、错误哈希、损坏 ZIP、文件占用、替换失败回滚、配置不变；测试不得真的替换用户旧程序或安装全局运行时。
- [ ] 运行 `npm run test:host`；Expected: 所有维护异常路径通过，用户未确认时无下载/安装。提交本任务。

## Task 8: 清理、构建、验收与交付

**Files:** 修改 package.json、scripts/package-webview2.ps1、verify-package.mjs、build-native.mjs、build-icons.cjs、export-translations.mjs、README.md、CHANGELOG.md、docs/使用说明.md、THIRD-PARTY-NOTICES.md；新建 docs/验证记录-Conroller-Plus-1.0.0.md。

**Interfaces:**
- 产物 `artifacts/ConrollerPlus-1.0.0-<timestamp>-win-x64.zip`，入口 `ConrollerPlus.exe`。
- `artifacts/latest-build.json` 记录程序目录、ZIP、字节数和 SHA-256。
- 发布清单覆盖原生文件、网页、图标、固定背景和字体；无用户配置、旧截图、开发工具和旧 Electron 文件。

- [ ] 使用已有 pnpm-lock.yaml，执行 `pnpm install --frozen-lockfile`（必要时调用已配置的 bundled pnpm 路径）；不执行缺少 package-lock.json 的 npm ci，不全局安装新工具。
- [ ] 删除只服务已移除功能的模块/路由/翻译/发布项，保留必需的 SDL 数据库与许可。更新打包白名单和产品版本。
- [ ] 用导出的 Figma logo 生成实际应用与托盘图标；脚本只转换原素材，不自行重画图案。
- [ ] 运行一次完整验证链：`npm test`、`npm run build:native`、`npm run test:controllers`、`npm run test:host`、`node tests/conroller-plus-ui.mjs`。
- [ ] 执行 `npm run package:desktop` 与 `npm run verify:package`；Expected: 全新产物、清单完整、正确入口、ZIP 无个人文件。
- [ ] 从新包启动进行固定窗口、主题/语言、未接入、连接/切换、托盘、转盘定位与输入的验收。硬件类型逐个记录实际设备；无法验证的硬件明确列出。
- [ ] 对手头可用设备走一遍完整使用流程，缺陷修复后仅重跑受影响测试；不要重复全套截图或把测试通过代替视觉检查。
- [ ] 根据选定执行方式完成独立代码审查，处理真实问题，报告限制。只交付本地程序目录、ZIP、使用说明、验证记录；不发布 GitHub。

## 计划自审记录

- 规格第 1–3 节对应任务 1/4/5；第 4–6 节对应任务 1/2/3；第 7 节对应任务 3/4；第 8 节对应任务 6；第 9 节对应任务 1/5；第 10–11 节对应任务 7；第 12–13 节对应任务 8。
- 全部配置值使用规格已确认值，图标来源和 220ms 动画已纳入最新用户裁定。
- 任务间共享接口：配置合成统一由引擎负责；UI 不改原生后端，窗口不改输入绑定，维护进程不接触用户配置目录。
- Figma 散落图层、错误组名和非实际窗口边框不可用于猜物理键或窗口尺寸；用实际图形与位置核对。
- 计划中的极小工作区适配是已明确的潜在约束，需要发生实际尺寸冲突时再向用户报告证据；不会预先悄悄改变固定尺寸或 Size 范围。
