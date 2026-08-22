# ═══════════════════════════════════════════════════════════════════════════════
#  uninstall.ps1 - stop + remove the GymDoorConnector service
#  Run as administrator (self-elevates otherwise).
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Stop'
$ServiceName = 'GymDoorConnector'
$ConnectorRoot = $PSScriptRoot

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object Security.Principal.WindowsPrincipal($id)
  $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
  Start-Process powershell.exe -Verb RunAs -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + $MyInvocation.MyCommand.Path + '"') -Wait
  exit 0
}

# stop and remove regardless of how it was installed
sc.exe stop $ServiceName | Out-Null
Start-Sleep -Milliseconds 800

$nssm = Join-Path $ConnectorRoot 'bin\nssm.exe'
if (Test-Path $nssm) {
  & $nssm stop $ServiceName | Out-Null
  & $nssm remove $ServiceName confirm | Out-Null
}
sc.exe delete $ServiceName | Out-Null

$desc = sc.exe qc $ServiceName 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "[uninstall] service '$ServiceName' removed."
} else {
  Write-Host "[uninstall] WARNING: service '$ServiceName' may still exist - remove manually if needed." -ForegroundColor Yellow
}

# clean the PID/state? leave logs + data (audit trail) unless -PurgeData
if ($args -contains '-PurgeData') {
  Remove-Item (Join-Path $ConnectorRoot 'data') -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host '[uninstall] data/ removed (queue, dedupe, cursors, state).'
}