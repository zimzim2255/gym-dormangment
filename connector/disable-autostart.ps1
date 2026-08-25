# ═══════════════════════════════════════════════════════════════════════════════
#  disable-autostart.ps1 - remove the GymDoorConnector auto-start task
#  Run once as Administrator (self-elevates). Safe - only removes the task.
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Stop'
$TaskName = 'GymDoorConnector'

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object Security.Principal.WindowsPrincipal($id)
  $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}
if (-not (Test-Admin)) {
  Start-Process powershell.exe -Verb RunAs -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + $MyInvocation.MyCommand.Path + '"') -Wait
  exit 0
}

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "[disable-autostart] Task '$TaskName' removed."
} else {
  Write-Host "[disable-autostart] Task '$TaskName' not found - nothing to remove."
}