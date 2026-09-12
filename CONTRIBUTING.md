# 贡献与开发流程

1. 从 `main` 创建短期功能分支，例如 `codex/settings-redesign`。
2. 明确变更范围。UI 变更优先局限于设置页；输入与原转盘应保持可独立回归。
3. 运行 `npm test`；涉及原生后端时运行 `npm run build:native` 和 `npm run test:controllers`；涉及宿主、配置、维护时运行 `npm run test:host`。
4. 使用 `npm run package:desktop` 生成全新发布目录并执行 `npm run verify:package`。不把 `artifacts/`、用户配置或缓存提交到 Git。
5. 提交小而清晰的 commit，创建 Pull Request，说明用户可见行为、验证结果和已知限制。等待 CI 完成后检查差异。
6. 宿主或输入变更必须补充 Windows 普通用户桌面验证。需要实际手柄的结果应写明设备，不能用模拟输入替代硬件结论。
7. 版本更新使用 SemVer，更新 CHANGELOG.md 与验证记录。通过验收后再创建版本标签和 Release；安装包作为 Release 附件，不放入源码目录。

不要在问题、日志或提交中包含令牌、截图中的个人内容、完整输入文本或用户配置。软件只应启动自己管理的输入组件，修复只处理清单中的三个原生文件。
