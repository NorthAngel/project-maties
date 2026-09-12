# Project Maties

Windows 手柄输入工具，支持透明单转盘/双转盘选字、鼠标与滚轮、按键映射、手柄校准和 Windows 中英日输入法。

当前 v0.6.0 将 v5.5 的 Electron 桌面壳迁移到 **.NET Framework 4.8 + 共享 WebView2**。主要目标是减少安装体积，同时让设置界面可以独立重绘。此候选版本的实际桌面验收尚未完成，详见 [验证记录](docs/验证记录-v0.6.0.md)。

## 开发

Windows x64，Node.js 22 或更新版本、PowerShell 7、.NET SDK 10（构建 net48），本机安装共享 WebView2。使用 Visual Studio 时打开 `ControllerCompanion.sln`。

```powershell
npm ci
npm test
npm run build:native
npm run test:controllers
npm run test:host
npm run package:desktop
```

发布过程先在 `artifacts/` 使用新目录完成构建，`artifacts/latest-build.json` 记录程序目录、ZIP、大小和 SHA-256。经过检查的候选二进制会复制到受控的 `release/` 目录，方便私有 GitHub 仓库直接下载；运行其中的 `ControllerCompanion.exe` 时仍需要系统共享 WebView2。开发源码不能直接作为安装目录使用。

`npm run dev` 仅预览设置网页，系统托盘、输入、校准和系统操作需使用 Windows 宿主。浏览器预览不能作为桌面功能验收。

## 代码职责

| 目录/文件 | 职责 |
| --- | --- |
| `host/` | 窗口、托盘、共享 WebView2、消息路由、配置持久化、服务生命周期和恢复 |
| `native/` | SDL/XInput 手柄读取、系统鼠标/键盘输入、IME |
| `src/runtime-engine.js` | 连接输入会话、手柄状态和设置；不依赖 Electron |
| `src/session.js`, `activation.js`, `pointer.js` | 输入与手势逻辑 |
| `settings.html`, `src/settings.js`, `src/settings.css` | 可重绘的设置界面 |
| `assets/exact/`, `src/figma-layout.js`, `wheel-view.js`, `wheel.css` | 原转盘素材、布局与绘制 |
| `tests/` | 逻辑、原生后端、宿主服务/维护测试 |
| `scripts/package-webview2.ps1` | 最小发布白名单、恢复包、完整性清单和 ZIP |

旧 Electron 宿主、打包脚本及历史桌面测试暂留作迁移参考；它们不参与 v0.6.0 打包，项目已移除 Electron 依赖。旧版维护测试仍保留为历史回归；新宿主维护由 C# 测试覆盖。

## UI 后续重绘

先修改设置 HTML/CSS 和交互层，继续通过 `window.desktop` 接口调用功能。避免把按键映射、手柄状态、文件访问与系统操作移入页面组件。转盘素材保持独立；需要调整布局时同时检查单盘和双盘、缩放、浅色/深色及输入脉冲。

[架构与界面改版说明](docs/架构与界面改版.md) · [使用说明](docs/使用说明.md) · [贡献流程](CONTRIBUTING.md) · [依赖许可](THIRD-PARTY-NOTICES.md)

## 发布与隐私

源码保留原上游 MIT 许可与历史： https://github.com/htlin222/web-gamepad-starter 。此项目的目标仓库为私有 `NorthAngel/project-maties`；README 中的目标名称不代表远程仓库已创建。

持续集成只构建和保存测试产物，不部署 GitHub Pages，也不自动发布 Release。发布清单不含缓存、截图、个人配置或共享浏览器本体。用户配置继续存储在 `%APPDATA%/ControllerCompanion`。

ZIP 压缩体积和解压安装体积应分别报告；共享 WebView2 的已有安装和后续缓存不包含在程序目录体积中。
