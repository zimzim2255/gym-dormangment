# ═══════════════════════════════════════════════════════════════════════════════
#  probe-cvaccess.ps1 - READ-ONLY diagnostic for the gym PC (192.168.100.30)
#
#  Purpose (requirement #1): inspect the installed ZKBio CVAccess system and
#  discover which integration surface actually exists on the gym PC:
#    * CVAccess services / listening ports (8088, 8098, 8089, 8090, 4370, ...)
#    * installed CVAccess folders + config files
#    * local SQL Server instance CVAccess may use
#    * whether the OpenAPI token endpoint is reachable
#
#  This script NEVER modifies anything: no ports, no services, no files outside
#  its own report output.
#
#  Run it ON THE GYM PC (you have AnyDesk there) with an admin PowerShell:
#     cd connector
#     powershell -ExecutionPolicy Bypass -File tools\probe-cvaccess.ps1
#
#  Report: connector/tools/cvaccess-report.json  +  console summary.
# ═══════════════════════════════════════════════════════════════════════════════
param(
  [string]$OutputDir = "$PSScriptRoot"
)

$ErrorActionPreference = 'Continue'

$report = [ordered]@{
  generatedAt     = (Get-Date).ToString('o')
  host            = $env:COMPUTERNAME
  ipv4            = @()
  operatingSystem = [System.Environment]::OSVersion.VersionString
  services        = @()
  listeners       = @()
  installDirs     = @()
  configFiles     = @()
  sqlServer       = $null
  openApi         = @()
  notes           = @()
  summary         = $null
}

# ── ip addresses ─────────────────────────────────────────────────────────────
$report.ipv4 = @(
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notmatch '^127\.' } |
    Select-Object -ExpandProperty IPAddress
)

# ── CVAccess / ZKBio-related services ────────────────────────────────────────
try {
  $report.services = @(
    Get-CimInstance Win32_Service -ErrorAction SilentlyContinue |
      Where-Object {
        $_.Name -match 'CV|ZKBio|cvaccess|zkd|ZKTeco|biometric' -or
        $_.DisplayName -match 'CVAccess|ZKBio|Access|bio' -or
        $_.PathName -match 'CVAccess|ZKBio'
      } |
      ForEach-Object {
        [ordered]@{
          name    = $_.Name
          display = $_.DisplayName
          state   = $_.State
          start   = $_.StartMode
          path    = $_.PathName
        }
      }
  )
} catch { $report.notes += "services scan failed: $($_.Exception.Message)" }

# ── listeners (port -> process) ──────────────────────────────────────────────
try {
  $report.listeners = @(
    Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      ForEach-Object {
        $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        [ordered]@{
          port    = $_.LocalPort
          address = $_.LocalAddress
          pid     = $_.OwningProcess
          proc    = if ($proc) { $proc.ProcessName } else { '?' }
        }
      } | Sort-Object @{e={$_.port}}
  )
} catch {
  $report.notes += "listener scan failed: $($_.Exception.Message)"
}
# ── install dirs ─────────────────────────────────────────────────────────────
$candidates = @(
  'C:\Program Files\ZKTeco',
  'C:\Program Files (x86)\ZKTeco',
  'C:\Program Files\ZKBio CVAccess',
  'C:\Program Files\ZKBio CVAccess\Pubs\Protect',
  'C:\Program Files\ZKBio CVAccess\service',
  'C:\ZKTeco',
  "${env:ProgramFiles}\CVAccess",
  "${env:ProgramFiles(x86)}\CVAccess",
  'D:\ZKTeco',
  'C:\BioConso'
)
$report.installDirs = @($candidates | Where-Object { Test-Path -LiteralPath $_ })

# ── config files under those dirs ────────────────────────────────────────────
foreach ($dir in $report.installDirs) {
  try {
    $report.configFiles += @(
      Get-ChildItem -LiteralPath $dir -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match 'appsettings|web\.config|config\.json|\.config$|\.ini$' } |
        Select-Object -First 200 -ExpandProperty FullName
    )
  } catch {}
}

# ── local SQL Server instance (CVAccess commonly uses an embedded instance) ──
try {
  $inst = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL' 'MSSQLSERVER' -ErrorAction SilentlyContinue).MSSQLSERVER
  if (-not $inst) {
    $inst = (Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL' -ErrorAction SilentlyContinue).PSChildName |
      Where-Object { $_ -match 'CV|ZKBio|SQLEXPRESS|MSSQL' } | Select-Object -First 1
  }
  $report.sqlServer = if ($inst) { $inst } else { '(no SQL instance named like CVAccess/SQLEXPRESS found)' }
} catch {
  $report.notes += "sql registry scan failed: $($_.Exception.Message)"
}

# ── probe CVAccess OpenAPI token endpoint on common ports ───────────────────
$bases = @('http://localhost:8098', 'http://127.0.0.1:8090', 'http://127.0.0.1:8089')
foreach ($base in $bases) {
  $try = "$base/api/token/temp"
  try {
    $resp = Invoke-WebRequest -Uri $try -Method Post -ContentType 'application/json' `
      -Body '{"appCode":"probe","appSecret":"probe"}' -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
    $report.openApi += [ordered]@{
      url    = $try
      status = $resp.StatusCode
      body   = $resp.Content.Substring(0, [Math]::Min(200, $resp.Content.Length))
    }
  } catch {
    $report.openApi += [ordered]@{ url = $try; status = 'no-response'; error = $_.Exception.Message.Split("`n")[0] }
  }
}
# ── summary ──────────────────────────────────────────────────────────────────
$report.summary = [ordered]@{
  servicesFound    = $report.services.Count
  pushPortsFound   = @($report.listeners | Where-Object { $_.port -in 8088,8098,8089,8090,4370 } | ForEach-Object { $_.port })
  bioStackPorts    = @($report.listeners | Where-Object { $_.port -in 5442,6390,38088 } | ForEach-Object { $_.port })
  openApiLive      = @($report.openApi | Where-Object { $_.status -ne 'no-response' }).Count
  sqlInstance      = $report.sqlServer
}

# ── write report ─────────────────────────────────────────────────────────────
if ($OutputDir) {
  $null = New-Item -ItemType Directory -Force $OutputDir
  $report | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $OutputDir 'cvaccess-report.json') -Encoding UTF8
}

Write-Host ''
Write-Host '  === CVAccess integration probe (read-only) ==='
Write-Host ''
Write-Host ("  Services (CV/access/bio)  : {0}" -f $report.summary.servicesFound)
Write-Host ("  Push/listen ports         : {0}" -f (($report.summary.pushPortsFound) -join ', '))
Write-Host ("  Bio stack ports (pg/redis/fp): {0}" -f (($report.summary.bioStackPorts) -join ', '))
Write-Host ("  OpenAPI endpoints live    : {0}" -f $report.summary.openApiLive)
Write-Host ("  SQL server                : {0}" -f $report.summary.sqlInstance)
Write-Host ''
Write-Host '  Listener ports (8088/8098/8089/8090/4370) -> processes:'
$report.listeners | Where-Object { $_.port -in 8088,8098,8089,8090,4370 } | ForEach-Object {
  Write-Host ("      {0,6} {1,-16} {2} (pid {3})" -f $_.port, $_.address, $_.proc, $_.pid)
}
Write-Host ''
Write-Host ("  Report written to: {0}" -f (Join-Path $OutputDir 'cvaccess-report.json'))
Write-Host ''
Write-Host '  Use this report to fill connector/config/config.json'
Write-Host '  (port 8088 belongs to CVAccess - the connector never touches it).'
Write-Host ''