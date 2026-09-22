$ErrorActionPreference='Stop'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Push-Location $repo
try {
 foreach ($name in @('HostPolicyTests','HostMaintenanceTests','WindowLifecycleTests','OverlayPlacementTests','ReleaseClientTests')) {
  & dotnet build "tests/$name.csproj" -c Release --nologo -v:q
  if ($LASTEXITCODE -ne 0) { throw "$name build failed" }
  & "tests/bin/Release/net48/$name.exe"
  if ($LASTEXITCODE -ne 0) { throw "$name failed" }
 }
} finally { Pop-Location }
