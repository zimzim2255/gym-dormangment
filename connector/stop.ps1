# ═══════════════════════════════════════════════════════════════════════════════
#  stop.ps1 - stop the GymDoorConnector service
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Stop'
$ServiceName = 'GymDoorConnector'
$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $svc) {
  Write-Host "[stop] service '$ServiceName' not installed - nothing to stop." -ForegroundColor Yellow
  exit 1
}
if ($svc.Status -eq 'Stopped') {
  Write-Host '[stop] already stopped.'
  exit 0
}
Stop-Service -Name $ServiceName -Force
$svc.Refresh()
$svc.WaitForStatus('Stopped', (New-TimeSpan -Seconds 30))
Write-Host "[stop] '$ServiceName' is $($svc.Status)."