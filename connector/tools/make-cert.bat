@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM  make-cert.bat - generate config\cert.pem + config\key.pem for the
REM  CVAccess push receiver HTTPS mode. Requires openssl on PATH.
REM
REM  Then import config\cert.pem into Windows "Trusted Root Certification
REM  Authorities" so CVAccess trusts our local HTTPS listener.
REM ═══════════════════════════════════════════════════════════════════════════
setlocal
set DIR=%~dp0
set OUT=%DIR%..\config
if not exist "%OUT%" mkdir "%OUT%"

where openssl >nul 2>nul
if errorlevel 1 (
  echo [make-cert] openssl not found on PATH.
  echo              Install OpenSSL (e.g. https://slproweb.com/products/Win32OpenSSL.html)
  echo              or use: choco install openssl / winget install openssl
  exit /b 1
)

openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 825 ^
  -keyout "%OUT%\key.pem" -out "%OUT%\cert.pem" ^
  -subj "/CN=GymDoorConnectorLocal" ^
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

if errorlevel 1 exit /b 1
echo [make-cert] wrote "%OUT%\cert.pem" + "%OUT%\key.pem"
echo [make-cert] Import cert.pem into Windows trusted root:
echo   certutil -addstore Root "%OUT%\cert.pem"
endlocal