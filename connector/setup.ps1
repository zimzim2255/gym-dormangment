# ═══════════════════════════════════════════════════════════════════════════════
#  setup.ps1 - One-time connector setup on the gym PC
#  ───────────────────────────────────────────────────────────────────────────────
#  Does all of this automatically:
#    1. Generates a strong random webhook secret (64 hex chars, crypto-random)
#    2. Creates config\config.json from config\config.example.json
#    3. Creates .env from .env.example
#    4. Injects SUPABASE_WEBHOOK_URL + ZKTECO_WEBHOOK_SECRET into .env
#       (WHEN_MATCHED: keeps your existing secret if .env already has a real one)
#    5. Prints the secret so you can set the SAME value on Supabase.
#
#  Usage (in PowerShell, from inside the connector folder):
#     .\setup.ps1
#
#  After running, set the printed secret on Supabase (from the project root):
#     cd F:\techventur work\gym-project
#     supabase secrets set --project-ref xquhrwwsgmtpycdzziyt ZKTECO_WEBHOOK_SECRET=<printed-secret>
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$url = 'https://xquhrwwsgmtpycdzziyt.supabase.co/functions/v1/zkteco-webhook'

# ── 1) Generate a crypto-random 64-hex secret (or reuse existing .env value) ──
$existing = $null
if (Test-Path '.env') {
  $existing = (Select-String -Path '.env' -Pattern '^ZKTECO_WEBHOOK_SECRET=(.+)$' -ErrorAction SilentlyContinue).Matches.Groups[1].Value
}
if ($existing -and $existing -ne 'replace-me-with-a-long-random-secret' -and $existing.Length -ge 32) {
  $secret = $existing
  Write-Host "[setup] Reusing existing webhook secret from .env (no change)."
} else {
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $bytes = New-Object byte[] 32
  $rng.GetBytes($bytes)
  $rng.Dispose()
  $secret = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
  Write-Host "[setup] Generated a new crypto-random webhook secret."
}

# ── 2) Create config\config.json if missing ───────────────────────────────────
New-Item -ItemType Directory -Path 'config' -Force | Out-Null
if (-not (Test-Path 'config\config.json')) {
  Copy-Item 'config\config.example.json' 'config\config.json'
  Write-Host "[setup] Created config\config.json from config.example.json"
} else {
  Write-Host "[setup] config\config.json already exists - kept as-is."
}

# ── 3) Create .env if missing ─────────────────────────────────────────────────
if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host "[setup] Created .env from .env.example"
} else {
  Write-Host "[setup] .env already exists - updating values."
}

# ── 4) Inject URL + secret into .env ──────────────────────────────────────────
$lines = Get-Content '.env'
$lines = $lines | ForEach-Object {
  if ($_ -match '^ZKTECO_WEBHOOK_SECRET=') { "ZKTECO_WEBHOOK_SECRET=$secret" }
  elseif ($_ -match '^SUPABASE_WEBHOOK_URL=') { "SUPABASE_WEBHOOK_URL=$url" }
  else { $_ }
}
$lines | Set-Content '.env' -Encoding UTF8
Write-Host "[setup] Wrote SUPABASE_WEBHOOK_URL + ZKTECO_WEBHOOK_SECRET into .env"

# ── 5) Print summary ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "┌─────────────────────────────────────────────────────────────────┐"
Write-Host "│ Webhook URL : $url"
Write-Host "│ Webhook SECRET : $secret"
Write-Host "└─────────────────────────────────────────────────────────────────┘"
Write-Host ""
Write-Host "Next step - set the SAME secret on Supabase (from the project root):"
Write-Host "  cd F:\techventur work\gym-project"
Write-Host "  supabase secrets set --project-ref xquhrwwsgmtpycdzziyt ZKTECO_WEBHOOK_SECRET=$secret"
Write-Host ""
Write-Host "[setup] Done. Start the connector with:  node src\main.js serve"