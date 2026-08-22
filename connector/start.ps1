# ═══════════════════════════════════════════════════════════════════════════════
#  start.ps1 - start the GymDoorConnector service
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Stop'
$ServiceName = 'GymDoorConnector'
$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $svc) {
  Write-Host "[start] service '$ServiceName' not installed - run install.ps1 first." -ForegroundColor Yellow
  exit 1
}
if ($svc.Status -eq 'Running') {
  Write-Host '[start] already running.'
  exit 0
}
Start-Service -Name $ServiceName
$svc.Refresh()
$svc.WaitForStatus('Running', (New-TimeSpan -Seconds 30))
Write-Host "[start] '$ServiceName' is $($svc.Status)."
# quick smoke: show recent connector log line if any
$day = Get-Date -Format yyyy-MM-dd
$log = Join-Path $PSScriptRoot "logs\connector-$day.ndjson"
if (Test-Path $log) {
  Write-Host '--- last connector log line ---'
  Get-Content $log -Tail 1
}