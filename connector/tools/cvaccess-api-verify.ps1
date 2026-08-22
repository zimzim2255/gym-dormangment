# ═══════════════════════════════════════════════════════════════════════════════
#  cvaccess-api-verify.ps1 - READ-ONLY OpenAPI verifier for ZKBio CVAccess
#
#  Run ON THE GYM PC (192.168.100.30) after creating an OpenAPI app in the
#  CVAccess web admin (~System -> Open API/Advanced API~):
#
#     powershell -ExecutionPolicy Bypass -File tools\cvaccess-api-verify.ps1 `
#       -BaseUrl http://192.168.100.30:8098 `
#       -AppCode <your-app-code> -AppSecret <your-app-secret>
#
#  All read-only:
#    1. POST /api/token/temp  { appCode, appSecret }  -> prints raw JSON (tempCode)
#    2. GET-market-discovery: crawl CVAccess web UI JS bundles for "/api/..." paths
#    3. Writes connector\tools\cvaccess-openapi-report.json (raw evidence)
#
#  This turns "the OpenAPI is alive on 8098" into the exact endpoint names we
#  wire into config/config.json. Nothing here is guessed.
# ═══════════════════════════════════════════════════════════════════════════════
param(
  [string]$BaseUrl   = 'http://192.168.100.30:8098',
  [string]$AppCode   = $env:CVAACCESS_APP_CODE,
  [string]$AppSecret = $env:CVAACCESS_APP_SECRET,
  [string]$OutDir    = $PSScriptRoot,
  [switch]$CrawlWeb  = $true
)

$ErrorActionPreference = 'Continue'
$report = [ordered]@{
  generatedAt = (Get-Date).ToString('o')
  baseUrl     = $BaseUrl
  tokenTemp   = $null
  token       = $null
  apiEndpoints = @()
  notes       = @()
}

function PostJson($Url, $BodyObj) {
  $json = $BodyObj | ConvertTo-Json -Compress
  try {
    $resp = Invoke-WebRequest -Uri $Url -Method Post -ContentType 'application/json' -Body $json -TimeoutSec 8 -UseBasicParsing
    return [pscustomobject]@{ ok=$true; status=$resp.StatusCode; body=$resp.Content }
  } catch {
    $detail = ''
    try {
      if ($_.Exception.Response -and $_.Exception.Response.GetResponseStream) {
        $s = $_.Exception.Response.GetResponseStream()
        if ($s) {
          $reader = New-Object System.IO.StreamReader($s)
          $detail = $reader.ReadToEnd()
        }
      }
    } catch {}
    return [pscustomobject]@{ ok=$false; status='exception'; body="$($_.Exception.Message)`n$detail" }
  }
}

Write-Host ''
Write-Host "=== [1/3] POST $BaseUrl/api/token/temp ==="
if (-not $AppCode -or -not $AppSecret) {
  Write-Host '  ! AppCode/AppSecret missing.' -ForegroundColor Yellow
  Write-Host '    Pass -AppCode / -AppSecret, or set CVAACCESS_APP_CODE / CVAACCESS_APP_SECRET.'
  Write-Host '    (Create the OpenAPI app in the CVAccess web admin first.)'
  $report.tokenTemp = 'skipped-no-credentials'
} else {
  $r1 = PostJson "$BaseUrl/api/token/temp" @{ appCode=$AppCode; appSecret=$AppSecret }
  $report.tokenTemp = $r1
  Write-Host ("  status : {0}" -f $r1.status)
  Write-Host ("  body   : {0}" -f $r1.body)

  # ── 2. exchange tempCode -> accessToken ───────────────────────────────
  if ($r1.ok -and $r1.status -eq 200) {
    Write-Host ''
    Write-Host '=== [2/3] POST /api/token (tempCode) ==='
    $parsed = $r1.body | ConvertFrom-Json
    $tempCode = $null
    foreach ($key in @('tempCode','temp_code','code','data')) {
      if ($parsed.$key) { $tempCode = $parsed.$key; break }
      if ($parsed.data -and $parsed.data.$key) { $tempCode = $parsed.data.$key; break }
    }
    if ($tempCode) {
      $r2 = Post-Json "$BaseUrl/api/token" @{ tempCode = "$tempCode" }
      $report.token = $r2
      Write-Host ("  status : {0}" -f $r2.status)
      Write-Host ("  body   : {0}" -f $r2.body)
    } else {
      $report.notes += 'could not locate tempCode field in token/temp response'
      Write-Host '  ! Could not locate the tempCode in the response - see body above.' -ForegroundColor Yellow
    }
  }
}
}

# ── 3. crawl CVAccess web UI JS for real /api/* endpoints ────────────────────
Write-Host ''
Write-Host '=== [3/3] Crawl web UI JS for /api/* endpoints ==='
if (-not $CrawlWeb) {
  Write-Host '  skip (no -CrawlWeb)'
} else {
  $urls = @(
    "$BaseUrl",
    "$BaseUrl/index.html",
    "$BaseUrl/login"
  )
  $seen = @{}
  foreach ($u in $urls) {
    try {
      $resp = Invoke-WebRequest -Uri $u -TimeoutSec 8 -UseBasicParsing -ErrorAction SilentlyContinue
      $html = $resp.Content
      if (-not $html) { continue }
      # extract <script src="...js"> urls
      $js = [regex]::Matches($html, 'src="([^"]+\.js(?:\?[^"]*)?)"') |
        ForEach-Object { $_.Groups[1].Value } |
        ForEach-Object {
          if ($_ -match '^https?://') { $_ }
          elseif ($_ -match '^/') { $BaseUrl + $_ }
          else { "$BaseUrl/" + $_ }
        }
      foreach ($script in $js | Select-Object -Unique) {
        if ($seen.ContainsKey($script)) { continue }
        $seen[$script] = $true
        try {
          $jsContent = (Invoke-WebRequest -Uri $script -TimeoutSec 8 -UseBasicParsing -ErrorAction SilentlyContinue).Content
        } catch { continue }
        if (-not $jsContent) { continue }
        # gather /api/* paths (both quoted JSON strings and template form)
        $paths = [regex]::Matches($jsContent, '["`''](/api/[A-Za-z0-9_\-/{}$]+)') |
          ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
        if ($paths.Count -gt 0) {
          $report.apiEndpoints += [ordered]@{ source=$script; endpoints=@($paths) }
          Write-Host ("  {0,+0} : {1} paths" -f $script, $paths.Count)
          $paths | Select-Object -First 25 | ForEach-Object { Write-Host "      $_" }
        }
      }
    } catch { $report.notes += "crawl $u failed: $($_.Exception.Message)" }
  }
}

# ── write report ──────────────────────────────────────────────────────────────
if ($OutDir) {
  $null = New-Item -ItemType Directory -Force $OutDir
  $report | ConvertTo-Json -Depth 8 |
    Set-Content -Path (Join-Path $OutDir 'cvaccess-openapi-report.json') -Encoding UTF8
}
Write-Host ''
Write-Host "Report -> $(Join-Path $OutDir 'cvaccess-openapi-report.json')"
Write-Host ''
Write-Host 'Next: paste this report back to the developer so we can wire'
Write-Host 'the exact endpoint + field mapping into config/config.json.'
Write-Host ''