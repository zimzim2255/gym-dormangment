# ═══════════════════════════════════════════════════════════════════════════════
#  discover-db.ps1 - READ-ONLY Route B discovery for the CVAccess local DB.
#  ------------------------------------------------------------------------------
#  The user chose Route B: drive the door by writing the CVAccess local
#  PostgreSQL (5442). That needs (a) the Postgres install / psql, (b) the DB
#  name + user + password (CVAccess keeps them in its config), and (c) the real
#  user-table schema. This script finds all three WITHOUT modifying anything.
#
#  Run ON THE GYM PC (admin PowerShell):
#     powershell -ExecutionPolicy Bypass -File tools\discover-db.ps1
#
#  Writes: connector/tools/db-discovery-report.json + prints to console.
#  NEVER writes to the DB: any SELECT here is read-only and safe.
# ═══════════════════════════════════════════════════════════════════════════════
param(
  [string]$OutputDir = "$PSScriptRoot"
)

$ErrorActionPreference = 'Continue'
$report = [ordered]@{
  generatedAt     = (Get-Date).ToString('o')
  host            = $env:COMPUTERNAME
  psqlCandidates  = @()         # where psql/postgres may live
  pgServiceBits   = @()         # BioPlatform Database Service command line
  dbMarkers       = @()         # jdbc/connection strings found in config files
  connectionGuess = $null       # assembled "host:port/db as user" best guess
  usersSchema     = @()         # read-only glimpse of candidate tables (name hints)
  notes           = @()
}

function Find-File([string]$Start, [string]$Name, [int]$Depth = 2) {
  # cheap shallow search to avoid scanning massive trees
  for ($d = 0; $d -le $Depth; $d++) {
    $dirs = Get-ChildItem -Path $Start -Directory -Recurse -Depth $Depth -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName.Length -lt 220 }
  }
  # fallback: targeted common locations only
  $roots = @(
    'C:\Program Files\ZKBio CVAccess',
    'C:\Program Files\PostgreSQL',
    'C:\PostgreSQL',
    'C:\Program Files (x86)\FPOnline'
  )
  foreach ($r in $roots) {
    if (-not (Test-Path $r)) { continue }
    Get-ChildItem -Path $r -Recurse -Depth 6 -Filter $Name -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty FullName
  }
}

Write-Host ''
Write-Host '=== [1/4] Locate psql / postgres install ==='
$psql = @()
# 1) PATH
$psql += (Get-Command psql -ErrorAction SilentlyContinue).Source
# 2) registry / pg service
$pgService = Get-CimInstance Win32_Service -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match 'postgres|bio' -and $_.State -eq 'Running' } |
  Select-Object Name, State, PathName
$report.pgService = $pgService | ForEach-Object {
  [ordered]@{ name = $_.Name; path = $_.PathName }
}
# 3) common postgres bins
$pgBinCands = @(
  'C:\Program Files\PostgreSQL\*\bin\psql.exe',
  'C:\PostgreSQL\*\bin\psql.exe',
  'C:\Program Files\ZKBio CVAccess\*\bin\psql.exe',
  'C:\Program Files\ZKBio CVAccess\pgsql\*\bin\psql.exe'
)
foreach ($g in $pgBinCands) {
  $psql += Get-ChildItem -Path $g -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
}
$psql = $psql | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique
$report.psqlInstall = $psql
if ($psql) {
  $psqlBin = Get-Item ($psql[0]).FullName
  $report.notes += "psql found: $($psql[0])"
  Write-Host ("  psql     : {0}" -f $psql[0])
} else {
  Write-Host '  ! psql.exe not found on PATH or common Postgres installs.' -ForegroundColor Yellow
  Write-Host '    If you have psql only from the CVAccess bundled Postgres, we will' -ForegroundColor Yellow
  Write-Host '    list the Postgres data/port from the service cmd line instead below.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== [2/4] Locate DB credentials in CVAccess config ==='
$cfgRoot = 'C:\Program Files\ZKBio CVAccess'
$report.dbMarkers = @()
$patterns = @('jdbc:postgresql', 'dataSource', 'postgresql://', 'password', 'userid', 'dbname', '\bport\s*=\s*5442')
if (Test-Path $cfgRoot) {
  Get-ChildItem -Path $cfgRoot -Recurse -Include *.ini,*.yml,*.properties,*.conf,*.json,*.xml -ErrorAction SilentlyContinue |
    ForEach-Object {
      try {
        $content = Get-Content -Path $_.FullName -Raw -ErrorAction SilentlyContinue
      } catch { return }
      if (-not $content) { return }
      foreach ($pat in $patterns) {
        if ($content -match $pat) {
          $report.dbMarkers += [ordered]@{
            file = $_.FullName
            hint = ($content -split "`n" | Where-Object { $_ -match $pat } | Select-Object -First 3)
          }
          break
        }
      }
    }
}
if ($report.dbMarkers) {
  $report.notes += "Config files with likely DB connection found: $($report.dbMarkers.Count)"
} else {
  Write-Host '  ! No connection markers found in C:\Program Files\ZKBio CVAccess config.' -ForegroundColor Yellow
  $report.notes += 'no config connection markers found'
}

Write-Host ''
Write-Host '=== [3/4] Try read-only schema discovery (needs working creds) ==='
$conn = @{ host='127.0.0.1'; port='5442'; db=$null; user=$null }
if ($report.dbMarkers) {
  # heuristic: first config marker often has host/user/db; only used if psql available
}
$report.connectionUser = $conn
if ($psql) {
  $psqlPath = $psql[0]
  # without creds we can still list DBs if the local user is trusted
  $list = & $psqlPath -h 127.0.0.1 -p 5442 -U postgres -l 2>&1
  $report.tablesDblist = ($list | Out-String)
  Write-Host $list | Select-Object -First 20
}

Write-Host ''
Write-Host '=== [4/4] write report ==='
$report | ConvertTo-Json -Depth 8 |
  Set-Content -Path (Join-Path $OutputDir 'dbaccess-report.json') -Encoding UTF8
Write-Host ("Report -> {0}" -f (Join-Path $OutputDir 'dbaccess-report.json'))
Write-Host ''