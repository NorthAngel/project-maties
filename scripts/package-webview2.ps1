param([string]$OutputRoot = (Join-Path $PSScriptRoot '../artifacts'))
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$version = (Get-Content (Join-Path $repo 'package.json') -Raw | ConvertFrom-Json).version
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid version' }
$destination = [IO.Path]::GetFullPath($OutputRoot)
New-Item -ItemType Directory -Force -Path $destination | Out-Null
# Every build uses a fresh destination and never overwrites an existing delivery.
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$build = Join-Path $destination "build-$version-$stamp"
$appDir = Join-Path $build "ControllerCompanion-$version"
New-Item -ItemType Directory -Path $appDir | Out-Null
Push-Location $repo
try {
 & dotnet build host/ControllerCompanion.csproj -c Release --nologo
 if ($LASTEXITCODE -ne 0) { throw 'Host build failed' }
 & node scripts/build-native.mjs
 if ($LASTEXITCODE -ne 0) { throw 'Native build failed' }
 $hostBin = Join-Path $repo 'host/bin/Release/net48'
 foreach ($file in @('ControllerCompanion.exe','ControllerCompanion.exe.config','Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.Wpf.dll','WebView2Loader.dll')) { Copy-Item -LiteralPath (Join-Path $hostBin $file) -Destination $appDir }
 $web = Join-Path $appDir 'web'
 New-Item -ItemType Directory -Path $web,(Join-Path $web 'src'),(Join-Path $web 'assets'),(Join-Path $appDir 'native') | Out-Null
 foreach ($file in @('settings.html','overlay.html')) { Copy-Item -LiteralPath (Join-Path $repo $file) -Destination $web }
 foreach ($file in @('activation.js','appearance.js','calibration.js','controls.js','figma-layout.js','i18n.js','overlay.js','overlay.css','pointer.js','radial.js','runtime-engine.js','runtime-entry.js','webview-bridge.js','session.js','settings.js','settings.css','system.js','theme.js','wheel-view.js','wheel.css')) { Copy-Item -LiteralPath (Join-Path $repo "src/$file") -Destination (Join-Path $web 'src') }
 foreach ($file in @('app-icon.ico','app-icon.png','app-icon.svg','appearance-icon.svg','controller-icon.png')) { Copy-Item -LiteralPath (Join-Path $repo "assets/$file") -Destination (Join-Path $web 'assets') }
 Copy-Item -LiteralPath (Join-Path $repo 'assets/exact') -Destination (Join-Path $web 'assets') -Recurse
 foreach ($file in @('ControllerBridge.exe','SDL3.dll','gamecontrollerdb.txt','SDL-LICENSE.txt','GameControllerDB-LICENSE.txt','provenance.json')) { Copy-Item -LiteralPath (Join-Path $repo "native/bin/$file") -Destination (Join-Path $appDir 'native') }
 & node scripts/export-translations.mjs (Join-Path $web 'native-translations.json')
 if ($LASTEXITCODE -ne 0) { throw 'Translation export failed' }
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 [IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $repo 'recovery'),(Join-Path $appDir 'recovery.zip'),[IO.Compression.CompressionLevel]::Optimal,$false)
 foreach ($file in @('LICENSE','THIRD-PARTY-NOTICES.md')) { Copy-Item -LiteralPath (Join-Path $repo $file) -Destination $appDir }
 Copy-Item -LiteralPath (Join-Path $repo 'docs/使用说明.md') -Destination $appDir
 Copy-Item -LiteralPath (Join-Path $repo 'docs/验证记录-v0.6.0.md') -Destination $appDir
 # Include the SDK redistribution license, not any fixed browser runtime.
 $webviewLicense = Join-Path $env:USERPROFILE '.nuget/packages/microsoft.web.webview2/1.0.4078.44/LICENSE.txt'
 if (Test-Path -LiteralPath $webviewLicense) { Copy-Item -LiteralPath $webviewLicense -Destination (Join-Path $appDir 'WebView2-LICENSE.txt') }
 $files = [ordered]@{}
 Get-ChildItem -LiteralPath $appDir -Recurse -File | Sort-Object FullName | ForEach-Object {
   $key = [IO.Path]::GetRelativePath($appDir,$_.FullName).Replace('\','/')
   $files[$key] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
 }
 @{product='ControllerCompanion';version=$version;host='webview2';files=$files} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $appDir 'release-manifest.json') -Encoding utf8
 $zip = Join-Path $destination "ControllerCompanion-$version-$stamp-win-x64.zip"
 [IO.Compression.ZipFile]::CreateFromDirectory($appDir,$zip,[IO.Compression.CompressionLevel]::Optimal,$true)
 $report = [ordered]@{version=$version;appDirectory=$appDir;zip=$zip;installedBytes=(Get-ChildItem -LiteralPath $appDir -Recurse -File | Measure-Object -Property Length -Sum).Sum;zipBytes=(Get-Item -LiteralPath $zip).Length;sha256=(Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant();sharedRuntime='Microsoft Edge WebView2 Evergreen';desktopVerification='pending-interactive-session'}
 $report | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $destination 'latest-build.json') -Encoding utf8
 $report | ConvertTo-Json
} finally { Pop-Location }
