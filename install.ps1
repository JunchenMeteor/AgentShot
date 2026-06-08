param(
  [string]$Tool = "generic",
  [string]$Ask = "Analyze this screenshot",
  [switch]$SkipDaemon
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Ensure-Node {
  $node = Get-Command node -ErrorAction SilentlyContinue
  $npm = Get-Command npm -ErrorAction SilentlyContinue
  if (-not $node -or -not $npm) {
    throw "Node.js and npm are required. Install Node.js 18+ from https://nodejs.org/ and rerun this script."
  }

  $major = (& node -p "process.versions.node.split('.')[0]").Trim()
  if ([int]$major -lt 18) {
    throw "Node.js 18+ is required. Current major version: $major."
  }
}

function Test-DirectoryWritable {
  param([string]$Path)
  try {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
    $probe = Join-Path $Path ".agentshot-write-test"
    Set-Content -Path $probe -Value "ok"
    Remove-Item -Path $probe -Force
    return $true
  } catch {
    return $false
  }
}

function Ensure-NpmPrefix {
  $currentPrefix = (& npm prefix -g).Trim()
  $targetPrefix = Join-Path $env:USERPROFILE ".npm-global"

  if (Test-DirectoryWritable $currentPrefix) {
    Write-Step "npm global prefix is writable: $currentPrefix"
    return $currentPrefix
  }

  Write-Step "npm global prefix is not writable: $currentPrefix"
  Write-Step "Configuring user npm prefix: $targetPrefix"
  New-Item -ItemType Directory -Force -Path $targetPrefix | Out-Null
  & npm config set prefix $targetPrefix
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to configure npm user prefix."
  }

  return $targetPrefix
}

function Ensure-UserPath {
  param([string]$Prefix)

  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if ($null -eq $userPath) {
    $userPath = ""
  }

  $paths = $userPath.Split(";", [System.StringSplitOptions]::RemoveEmptyEntries)
  if ($paths -contains $Prefix) {
    Write-Step "User PATH already contains: $Prefix"
  } else {
    Write-Step "Adding AgentShot npm prefix to user PATH"
    $newPath = if ($userPath.Trim()) { "$userPath;$Prefix" } else { $Prefix }
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
  }

  if (-not (($env:Path.Split(";", [System.StringSplitOptions]::RemoveEmptyEntries)) -contains $Prefix)) {
    $env:Path = "$env:Path;$Prefix"
  }
}

function Install-AgentShot {
  Write-Step "Installing @junchenmeteor/agentshot from npm"
  if ($SkipDaemon) {
    $env:AGENTSHOT_SKIP_POSTINSTALL = "1"
  }

  & npm install -g "@junchenmeteor/agentshot"
  if ($LASTEXITCODE -ne 0) {
    throw "npm install failed."
  }
}

function Configure-Daemon {
  if ($SkipDaemon) {
    Write-Step "Skipping daemon setup"
    return
  }

  Write-Step "Installing AgentShot daemon"
  & agentshot daemon install --tool $Tool --ask $Ask
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "AgentShot installed, but daemon setup failed. Run manually: agentshot daemon install --tool $Tool --ask `"$Ask`""
  }
}

Ensure-Node
$prefix = Ensure-NpmPrefix
Ensure-UserPath -Prefix $prefix
Install-AgentShot
Configure-Daemon

Write-Step "AgentShot is ready"
& agentshot --help
