@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM  db-fix-logs.ps1 - apply the access_logs/access_sessions schema fix.
REM  Opens the Supabase SQL Editor ready to paste your own run; also copies the
REM  SQL into the clipboard so you can just Ctrl+V in the SQL Editor.
REM ═══════════════════════════════════════════════════════════════════════════
Get-Content -Raw "%~dp0db-fix.sql" | Set-Clipboard
Write-Host "[db-fix] SQL copied to clipboard. Paste it into Supabase SQL Editor and Run."
Write-Host "[db-fix] Dashboard: https://supabase.com/dashboard/project/orjkjrdobjyctrsuiwek/sql"
Start-Process "https://supabase.com/dashboard/project/orjkjrdobjyctrsuiwek/sql"