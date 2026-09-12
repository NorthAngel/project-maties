# Project Maties 0.6.0: shared WebView2 migration

Approved user intent: preserve every v5.5 feature while minimizing application size; use a shared WebView2 runtime; private GitHub repository NorthAngel/project-maties; source and new release under C:/Users/Northangle/Downloads/project/1. User may later redraw every UI except the radial wheel.

The application remains Windows x64. Reuse current JavaScript input/activation/pointer/calibration/wheel modules, all exact SVG wheel assets, and C# SDL3/SendInput/TSF helper. Replace Electron with a .NET Framework 4.8 WPF host using the shared Evergreen WebView2 runtime. Follow MicrosoftEdge/WebView2Samples and official WebView2CompositionControl guidance. Retain all upstream and third-party notices. The private repo retains the upstream git history.

Architecture: one native host owns files, tray, windows, monitor/DPI coordinates, update/repair, startup, and the helper process. A platform-independent JS engine owns input/session state and receives native packets. The existing settings view uses the unchanged window.desktop contract. The overlay renders the unchanged wheel in a transparent, nonactivating, click-through composition WebView. Future settings redesign replaces only settings.html, settings.js and settings.css; input and wheel modules have explicit invariants documented.

The UI/native bridge is local-origin-only, allowlisted and message-based. No arbitrary shell, file path, JavaScript evaluation or external navigation is exposed. A test-only CDP port and synthetic input endpoints are enabled only with --test. Normal execution exposes no debugging endpoint.

Feature parity includes 8 UI locales, 3 theme modes, actual minimize/tray/quit behavior, startup, capture preview, calibration, binding layers, L3 single, 300 ms dual chord, R3 triple IME, real SendInput, persistent configs, focus/disconnect release, fine continuous scrolling, diagnostic/repair, local verified update and official firmware support.

Acceptance: complete feature matrix with live Windows tests; preserve original wheel asset hashes; smaller measured program and compressed package; no bundled Chromium or Node; missing runtime gets actionable install link; source build reproducible with pinned dependencies; private GitHub main with CI, license/provenance, README, changelog, CONTRIBUTING, security instructions and tagged release assets. Do not claim upload until remote state is verified. Do not delete old working deliverable until parity and new launch are proven.
