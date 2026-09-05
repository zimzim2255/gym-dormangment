# ═══════════════════════════════════════════════════════════════════════════════
#  watch-push.ps1 - watch who connects to the connector's push port (8091)
#  ───────────────────────────────────────────────────────────────────────────────
#  Run this in a SECOND terminal while the connector is running, then do a
#  fingerprint scan at a door. It prints every NEW connection to 8091 with the
#  owning process name, so you can SEE whether CVAccess is pushing to us.
#
#  If you see a `java` / `ZKBio` / `cvconnect` process → CVAccess IS reaching us.
#  If you only see `powershell` / `curl` → it's only our own tests (not CVAccess).
#
#  Usage:  powershell -ExecutionPolicy Bypass -File tools\watch-push.ps1
# �
$ErrorActionPreference = 'Continue'
$port = 8091
$seen = @{}
Write-Host "Watching TCP connections to 0.0.0.0:$port ... (Ctrl+C to stop)"
Write-Host "Do a door scan NOW and watch for a new java / ZKBio / cvconnect process."
while ($true) {
  $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    if ($c.State -eq 'Listen') { continue }
    $key = "$($c.OwningProcess)-$($c.RemoteAddress)-$($c.RemotePort)"
    if (-not $seen[$key]) {
      $seen[$key] = $true
      $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
      $pname = if ($p) { $p.ProcessName } else { 'unknown' }
      Write-Host ("{0:HH:mm:ss}  {1,-10} {2} (PID {3}) <- {4}:{5}" -f (Get-Date), $c.State, $pname, $c.OwningProcess, $c.RemoteAddress, $c.RemotePort)
    }
  }
  Start-Sleep -Milliseconds 800
}