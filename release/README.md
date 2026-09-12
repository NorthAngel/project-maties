# Controller Companion v0.6.0

This directory contains the reviewed Windows x64 candidate binaries and the sidecar files needed to run the host from this folder.

- `ControllerCompanion.exe` is the .NET Framework 4.8 WebView2 host.
- `ControllerBridge.exe` is the companion input service.
- `ControllerCompanion-0.6.0-win-x64.zip` is the complete portable package, including the WebView2 SDK assemblies, web interface, native DLLs, wheel artwork, recovery archive and release manifest.
- Keep `ControllerCompanion.exe` beside `ControllerCompanion.exe.config`, the two `Microsoft.Web.WebView2.*.dll` assemblies, `WebView2Loader.dll`, and the `web/` and `native/` folders. The root executable is now runnable directly from this directory; downloading only the `.exe` file will omit those required sidecars.

The Evergreen WebView2 Runtime is shared with Windows and is intentionally not bundled. See the root README and `docs/验证记录-v0.6.0.md` for requirements and the current desktop verification boundary.
