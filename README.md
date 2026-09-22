# Conroller Plus

Windows 手柄输入软件，提供单／双转盘输入、鼠标与四向滚动、按键自定义，以及根据 Figma 原型制作的设置界面。

## 下载 v1.1

**[进入 GitHub Releases 下载 Windows x64 预览版](https://github.com/NorthAngel/project-maties/releases/tag/v1.1)**

下载 `ConrollerPlus-v1.1-win-x64.zip`，完整解压，然后打开 `ConrollerPlus.exe`。请保留同目录文件。需要 Windows 10/11 x64、.NET Framework 4.8 和 Microsoft Edge WebView2 Runtime。

这是公开预览版。自动更新替换、回滚和完整依赖修复尚未完成；对应入口会提示。Figma Glass 的光学折射目前为近似实现。真实手柄跨型号和不同应用中的输入兼容性仍需实机验收。

## 使用

- 接入手柄后自动识别，可在多个已连接手柄之间选择。
- L3 呼出／收起转盘，支持单盘和双盘；固定选字按键之外的按键可自定义。
- 设置中调整透明度、尺寸、深浅色、左右摇杆死区、鼠标速度与滚动速度。
- 点击“开始使用”隐藏到系统托盘；单击托盘图标打开设置，右键菜单可退出。
- 支持简体中文、英文、日文。配置保存在 `%APPDATA%\ConrollerPlus`，新版首次运行不迁移旧版配置。
- 登录后启动默认关闭；窗口固定大小、支持拖动、最小化至托盘和关闭行为设置。

## v1.1 界面修正

- 修正图标重复平铺和裁切。
- 语言按钮仅在打开选项时显示选中颜色。
- 使用 Figma 原始透明度图标、轨道和玻璃滑块参数。
- 恢复字符颜色，补充 Frosted 预览模糊效果。
- 圆角窗口与支持深浅色的托盘菜单。

## 开发与构建

Windows x64，Node.js 22+、PowerShell 7、.NET SDK 10（构建 net48）。

```powershell
npm ci
npm test
npm run build:native
npm run test:controllers
npm run test:host
npm run package:desktop
npm run verify:package
```

程序包输出到 `artifacts/`；`artifacts/latest-build.json` 记录文件位置与 SHA-256。`npm run dev` 只预览网页，不提供原生手柄、托盘或系统输入功能。

| 目录 | 职责 |
| --- | --- |
| `host/` | Windows 窗口、托盘、WebView2、配置及原生服务生命周期 |
| `native/` | SDL/XInput 手柄读取、Windows 鼠标键盘与输入法操作 |
| `src/` | 设置界面、按键映射、转盘会话和绘制 |
| `assets/` | Figma 图形、手柄图标和界面字体 |
| `tests/` | 逻辑及宿主检查 |

仓库中的 `release/` 保留 v0.6.0 历史构件；新版下载统一使用 GitHub Releases。旧校准、固件等历史模块不属于新版界面功能。

[使用说明](docs/预览版使用说明.md) · [第三方说明](THIRD-PARTY-NOTICES.md)

项目基于 MIT 许可的 [htlin222/web-gamepad-starter](https://github.com/htlin222/web-gamepad-starter) 演进，保留上游许可与历史。第三方素材和字体适用各自许可，不自动包含在项目 MIT 授权中。

设计与维护：NorthAngel。代码贡献：GPT。
