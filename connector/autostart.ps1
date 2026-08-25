# ═══════════════════════════════════════════════════════════════════════════════
#  autostart.ps1 - make GymDoorConnector start automatically at logon
#  ───────────────────────────────────────────────────────────────────────────────
#  Uses ONLY Windows built-ins (Task Scheduler) - no NSSM download, no risky
#  registry edits. Creates a scheduled task "GymDoorConnector" that runs the
#  connector hidden (via tools\run-hidden.vbs) at every Windows logon, and
#  restarts it if it crashes.
#
#  Run once as Administrator (script self-elevates if you double-click).
#  To remove: run disable-autostart.ps1
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Stop'

$TaskName = 'GymDoorConnector'
$ConnectorRoot = $PSScriptRoot
$Vbs = Join-Path $ConnectorRoot 'tools\run-hidden.vbs'
$NodeExe = (Get-Command node -ErrorAction SilentlyContinue)
if ($NodeExe) {
  $NodeExe = $NodeExe.Source
} else {
  $candidates = @(
    "$env:ProgramFiles\nodejs\node.exe",
    "${env:ProgramFiles(x86)}\nodejs\node.exe",
    "$env:LocalAppData\Programs\nodejs\node.exe"
  )
  $NodeExe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $NodeExe) { throw 'Node.js not found. Install Node first (nodejs.org).' }
}

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object Security.Principal.WindowsPrincipal($id)
  $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
  Write-Host 'Requesting administrator rights...' -ForegroundColor Yellow
  Start-Process powershell.exe -Verb RunAs -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "' + $MyInvocation.MyCommand.Path + '"') -Wait
  exit 0
}

if (-not (Test-Path $Vbs)) { throw "Missing helper: $Vbs" }

Write-Host "[autostart] node     : $NodeExe"
Write-Host "[autostart] connector: $ConnectorRoot"

# Sanity: the connector starts
& $NodeExe (Join-Path $ConnectorRoot 'src\main.js') help | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Connector failed basic start check.' }
Write-Host '[autostart] connector OK.'

# ── create the scheduled task ────────────────────────────────────────────────
# Runs at EVERY logon of ANY user, hidden, and restarts if it stops.
$action = New-ScheduledTaskAction -Execute (Join-Path $env:SystemRoot 'System32\wscript.exe') -Argument ('"{0}"' -f $Vbs)
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host '[autostart] Task "GymDoorConnector" created: starts connector hidden at every logon.'
Write-Host '[autostart] It will restart the connector if it stops.'
Write-Host ''
Write-Host 'What happens now:'
Write-Host '  • Every time the gym PC logs in, the connector starts automatically (no admin, no window).'
Write-Host '  • Check it anytime:  node src\main.js status   (in C:\connector)'
Write-Host '  • To STOP/remove:    run disable-autostart.ps1'
Write-Host ''