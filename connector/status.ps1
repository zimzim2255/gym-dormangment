# ═══════════════════════════════════════════════════════════════════════════════
#  status.ps1 - show service state + connector health summary (health command)
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Continue'
$ServiceName = 'GymDoorConnector'
$Root = $PSScriptRoot

Write-Host ''
Write-Host ('=== Service: {0} ===' -f $ServiceName)
$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($svc) {
  Write-Host ("  State   : {0}" -f $svc.Status)
  Write-Host ("  StartType: {0}" -f $svc.StartType)
} else {
  Write-Host '  State   : NOT INSTALLED (run install.ps1)'
}

Write-Host ''
Write-Host '=== Connector health (node src\main.js status) ==='
if (Test-Path (Join-Path $Root 'src\main.js')) {
  & node (Join-Path $Root 'src\main.js') status
} else {
  Write-Host '  connector not present at expected path.'
}

Write-Host ''
Write-Host '=== NSSM process guard (if installed) ==='
$proc = Get-Process -Name 'nssm' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($proc) {
  Write-Host ("  nssm running (captures service stdout/stderr): pid={0}" -f $proc.Id)
} else {
  Write-Host '  nssm not running (expected if service was installed via sc.exe)'
}
Write-Host ''