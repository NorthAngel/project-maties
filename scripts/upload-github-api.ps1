param(
  [string]$Repository = 'NorthAngel/project-maties',
  [string]$FeatureBranch = 'codex/webview2-migration',
  [string]$Message = 'chore: publish project-maties WebView2 migration',
  [switch]$ReuseLocalBlobs
)

$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Push-Location $repoRoot
try {
  gh auth status | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'GitHub CLI is not authenticated.' }

  $entries = @()
  # Keep Unicode filenames literal; Git's default quotePath output is not a
  # filesystem path when it contains CJK characters.
  $paths = @(git -c core.quotePath=false ls-files)
  foreach ($relative in $paths) {
    $relative = $relative.Trim()
    if ([string]::IsNullOrWhiteSpace($relative)) { continue }
    $absolute = Join-Path $repoRoot $relative
    if ($ReuseLocalBlobs) {
      # GitHub's blob API hashes the exact bytes sent.  `git hash-object`
      # can hash a line-ending-normalized version when core.autocrlf is set,
      # so calculate the object id from the bytes we will reference instead.
      $bytes = [IO.File]::ReadAllBytes($absolute)
      $header = [Text.Encoding]::ASCII.GetBytes("blob $($bytes.Length)`0")
      $gitBlob = New-Object byte[] ($header.Length + $bytes.Length)
      [Buffer]::BlockCopy($header, 0, $gitBlob, 0, $header.Length)
      [Buffer]::BlockCopy($bytes, 0, $gitBlob, $header.Length, $bytes.Length)
      $digest = [Security.Cryptography.SHA1]::Create().ComputeHash($gitBlob)
      $sha = ([BitConverter]::ToString($digest)).Replace('-','').ToLowerInvariant()
    } else {
      $bytes = [IO.File]::ReadAllBytes($absolute)
      $payload = @{ content = [Convert]::ToBase64String($bytes); encoding = 'base64' } | ConvertTo-Json -Compress
      $blob = ($payload | gh api --method POST "repos/$Repository/git/blobs" --input - | ConvertFrom-Json)
      $sha = $blob.sha
    }
    if (-not $sha) { throw "GitHub did not return a blob SHA for $relative" }
    $entries += @{path = $relative.Replace('\','/'); mode = '100644'; type = 'blob'; sha = $sha}
    Write-Host ("Uploaded blob {0}/{1}: {2}" -f $entries.Count,$paths.Count,$relative)
  }

  $treePayload = @{tree = $entries} | ConvertTo-Json -Depth 8 -Compress
  # Passing a large JSON string through Windows PowerShell's native stdin can
  # transcode CJK paths; write a BOM-free UTF-8 request body instead.
  $treeInput = Join-Path ([IO.Path]::GetTempPath()) ("project-maties-tree-{0}.json" -f [guid]::NewGuid())
  [IO.File]::WriteAllText($treeInput, $treePayload, (New-Object Text.UTF8Encoding($false)))
  try {
    $tree = (gh api --method POST "repos/$Repository/git/trees" --input $treeInput | ConvertFrom-Json)
  } finally {
    Remove-Item -LiteralPath $treeInput -Force -ErrorAction SilentlyContinue
  }
  if (-not $tree.sha) { throw 'GitHub did not return a tree SHA.' }

  $mainRef = gh api "repos/$Repository/git/ref/heads/main" 2>$null | ConvertFrom-Json
  $parents = if ($mainRef.object.sha) { @($mainRef.object.sha) } else { @() }
  # Windows PowerShell collapses a one-element array during JSON conversion;
  # build the small commit body explicitly so GitHub always receives parents[].
  $messageJson = $Message | ConvertTo-Json -Compress
  $treeJson = $tree.sha | ConvertTo-Json -Compress
  $parentJson = (($parents | ForEach-Object { $_ | ConvertTo-Json -Compress }) -join ',')
  $commitPayload = '{"message":' + $messageJson + ',"tree":' + $treeJson + ',"parents":[' + $parentJson + ']}'
  $commitInput = Join-Path ([IO.Path]::GetTempPath()) ("project-maties-commit-{0}.json" -f [guid]::NewGuid())
  [IO.File]::WriteAllText($commitInput, $commitPayload, (New-Object Text.UTF8Encoding($false)))
  try {
    $commit = (gh api --method POST "repos/$Repository/git/commits" --input $commitInput | ConvertFrom-Json)
  } finally {
    Remove-Item -LiteralPath $commitInput -Force -ErrorAction SilentlyContinue
  }
  if (-not $commit.sha) { throw 'GitHub did not return a commit SHA.' }

  foreach ($branch in @('main',$FeatureBranch) | Select-Object -Unique) {
    $refPayload = @{ref = "refs/heads/$branch"; sha = $commit.sha} | ConvertTo-Json -Compress
    $refInput = Join-Path ([IO.Path]::GetTempPath()) ("project-maties-ref-{0}.json" -f [guid]::NewGuid())
    [IO.File]::WriteAllText($refInput, $refPayload, (New-Object Text.UTF8Encoding($false)))
    $branchExists = $true
    try {
      $existing = gh api "repos/$Repository/git/ref/heads/$branch" 2>$null
    } catch {
      $branchExists = $false
    }
    try {
      if ($branchExists) {
        $result = gh api --method PATCH "repos/$Repository/git/refs/heads/$branch" --input $refInput
      } else {
        $result = gh api --method POST "repos/$Repository/git/refs" --input $refInput
      }
    } finally {
      Remove-Item -LiteralPath $refInput -Force -ErrorAction SilentlyContinue
    }
    if ($LASTEXITCODE -ne 0) { throw "Could not update branch $branch" }
    Write-Host "Updated branch $branch"
  }

  Write-Host "Published commit $($commit.sha) to $Repository"
} finally {
  Pop-Location
}
