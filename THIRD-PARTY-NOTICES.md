# Third-party notices

This project began with htlin222/web-gamepad-starter, MIT licensed. See LICENSE and the upstream Git history.

- Microsoft WebView2 SDK 1.0.4078.44: https://www.nuget.org/packages/Microsoft.Web.WebView2/1.0.4078.44 . The Windows package redistributes the SDK loader and managed controls under Microsoft's redistribution terms. Its LICENSE.txt is included when packaging. The Evergreen browser runtime is shared and is not bundled.
- SDL 3 and SDL_GameControllerDB: vendor versions, source URLs, hashes and license text are retained in native/vendor/provenance.json and the adjacent license files; the package includes these in native/.
- The interface's wheel artwork comes from the project owner's supplied Figma design. Keep those assets and their layout together when editing the UI.

No binary or source from the commercial Controller Companion application is included in the release package.

## Conroller Plus v1.1 assets

- PlayStation input prompts: Kenney Input Prompts, CC0. Original notice: `assets/controller-icons/Kenney-LICENSE.txt`; source: https://kenney.nl/assets/input-prompts .
- SF Pro, PingFang and Hiragino font files are included as requested for the supplied design. They are third-party fonts subject to their respective rightsholders' terms, not the project's MIT license. Their presence does not grant additional redistribution rights.
- New settings graphics are exported from the project owner's Figma design. Source node identifiers are recorded in `assets/figma-ui/sources.json`.
