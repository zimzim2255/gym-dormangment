# ═══════════════════════════════════════════════════════════════════════════════
#  install.ps1 - register GymDoorConnector as a Windows service
#
#  RUN AS ADMINISTRATOR on the gym PC (or run normally - it self-elevates).
#
#  Strategy: the connector ships two ways to run as a service:
#    1. NSSM  (recommended: auto-start + auto-restart on crash, stdout capture)
#       - downloaded automatically to <connector>\bin\nssm.exe if absent
#    2. sc.exe native fallback (no auto-restart on crash)
#
#  The connector is started with:
#       node <connector>\src\main.js serve
#
#  Secrets are NOT stored here - the connector loads them from
#  <connector>\.env and <connector>\config\config.json (GDC_HOME is set for
#  the service).
# ═══════════════════════════════════════════════════════════════════════════════

[CmdletBinding()]
param(
  [switch]$Force = $false
)

$ErrorActionPreference = 'Stop'

$ConnectorRoot = $PSScriptRoot

function Get-ConnectorRoot {
  if (Test-Path (Join-Path $ConnectorRoot 'src\main.js')) { return $ConnectorRoot }
  if (Test-Path '.\connector\src\main.js') { return (Resolve-Path '.\connector').Path }
  throw 'Cannot find connector root. Run this script from inside connector\ or from the repo root.'
}
$ConnectorRoot = Get-ConnectorRoot

$ServiceName = 'GymDoorConnector'
$BinDir      = Join-Path $ConnectorRoot 'bin'
$NodeExe     = (Get-Command node -ErrorAction Stop).Source

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object Security.Principal.WindowsPrincipal($id)
  $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# ── self-elevate ──────────────────────────────────────────────────────────────
if (-not (Test-Admin)) {
  Write-Host 'Requesting administrator rights...' -ForegroundColor Yellow
  $extra = if ($Force) { ' -Force' } else { '' }
  $args = '-NoProfile -ExecutionPolicy Bypass -File "' + $MyInvocation.MyCommand.Path + '"' + $extra
  Start-Process powershell.exe -Verb RunAs -ArgumentList $args -Wait
  exit 0
}

# ── prereqs ──────────────────────────────────────────────────────────────────
Write-Host "[install] node            : $(node --version)"
Write-Host "[install] connector root  : $ConnectorRoot"

# make sure first-run config exists (never overwrites existing)
$envFile = Join-Path $ConnectorRoot '.env'
if (-not (Test-Path $envFile) -and (Test-Path (Join-Path $ConnectorRoot '.env.example'))) {
  Copy-Item (Join-Path $ConnectorRoot '.env.example') $envFile
  Write-Host '[install] created .env from .env.example - EDIT IT WITH YOUR SECRETS' -ForegroundColor Yellow
}
$cfgDir  = Join-Path $ConnectorRoot 'config'
$cfgFile = Join-Path $cfgDir 'config.json'
if (-not (Test-Path $cfgFile) -and (Test-Path (Join-Path $ConnectorRoot 'config\config.example.json'))) {
  New-Item -ItemType Directory -Force $cfgDir | Out-Null
  Copy-Item (Join-Path $ConnectorRoot 'config\config.example.json') $cfgFile
  Write-Host '[install] created config/config.json from example' -ForegroundColor Yellow
}

# sanity check the connector starts
& $NodeExe (Join-Path $ConnectorRoot 'src\main.js') help | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Connector failed basic start check.' }
Write-Host '[install] connector OK.'
# ── NSSM ─────────────────────────────────────────────────────────────────────
$NssmPath = Join-Path $ConnectorRoot 'bin\nssm.exe'
if (-not (Test-Path $NssmPath)) {
  $candidate = Get-Command nssm -ErrorAction SilentlyContinue
  if ($candidate) { $NssmPath = $candidate.Source }
}
if (-not (Test-Path $NssmPath)) {
  Write-Host '[install] NSSM not found - downloading (for auto-restart support)...'
  New-Item -ItemType Directory -Force (Split-Path $NssmPath) | Out-Null
  try {
    $url = 'https://nssm.cc/ci/nssm-2.24-101-g897c7ad.zip'
    $zip = Join-Path $env:TEMP ('nssm-' + [Guid]::NewGuid().ToString('N') + '.zip')
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
    $unzip = Join-Path $env:TEMP ('nssm-' + [Guid]::NewGuid().ToString('N'))
    Expand-Archive -Path $zip -DestinationPath $unzip -Force
    $exe = Get-ChildItem $unzip -Recurse -Filter nssm.exe -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match 'win64' } | Select-Object -First 1
    if (-not $exe) { $exe = Get-ChildItem $unzip -Recurse -Filter nssm.exe | Select-Object -First 1 }
    if ($exe) { Copy-Item $exe.FullName $NssmPath -Force } else { throw 'no nssm.exe in zip' }
    Write-Host "[install] downloaded NSSM -> $NssmPath"
  } catch {
    Write-Warning ("NSSM download failed ({0}). Falling back to native sc.exe service (no auto-restart on crash)." -f $_.Exception.Message)
    Remove-Item $NssmPath -Force -ErrorAction SilentlyContinue
  }
}

# ── (re)install the service ──────────────────────────────────────────────────
$mainJs = Join-Path $ConnectorRoot 'src\main.js'
if (Test-Path $NssmPath) {
  & $NssmPath stop $ServiceName | Out-Null
  & $NssmPath remove $ServiceName confirm | Out-Null
  Start-Sleep -Milliseconds 500

  & $NssmPath install $ServiceName "$NodeExe" "$mainJs serve" | Out-Null
  & $NssmPath set $ServiceName AppDirectory "$ConnectorRoot"
  & $NssmPath set $ServiceName AppEnvironmentExtra "GDC_HOME=$ConnectorRoot"
  & $NssmPath set $ServiceName Start SERVICE_AUTO_START
  & $NssmPath set $ServiceName AppStdout "$ConnectorRoot\logs\service-out.log"
  & $NssmPath set $ServiceName AppStderr "$ConnectorRoot\logs\service-err.log"
  & $NssmPath set $ServiceName AppRotateFiles 1
  & $NssmPath set $ServiceName AppRotateBytes 10485760
  & $NssmPath set $ServiceName AppExit Default Restart
  & $NssmPath set $ServiceName AppRestartDelay 5000
  Write-Host "[install] service installed via NSSM: $ServiceName"
} else {
  $binPath = '"' + $NodeExe + '" "' + $mainJs + '" serve'
  sc.exe create $ServiceName binPath= $binPath start= auto DisplayName= 'Gym Door Connector' | Out-Null
  sc.exe description $ServiceName 'Gym access-control connector: CVAccess fingerprint events to Supabase validation' | Out-Null
  Write-Host '[install] service installed via sc.exe (native fallback - no auto-restart)' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Next steps:'
Write-Host '  1. Edit connector\.env -> SUPABASE_WEBHOOK_URL / ZKTECO_WEBHOOK_SECRET / CONNECTOR_ID'
Write-Host '  2. Run  tools\probe-cvaccess.ps1  on this PC and fill config/config.json sources'
Write-Host '  3. Start: .\start.ps1    4. Status: .\status.ps1'
Write-Host ''