@echo off
echo ========================================
echo   Starting Tale-Keeper Services
echo ========================================
echo.

REM Check if PocketBase is already running
tasklist /FI "IMAGENAME eq pocketbase.exe" 2>NUL | find /I /N "pocketbase.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] PocketBase is already running
) else (
    echo [*] Starting PocketBase...
    start "PocketBase" /D "%~dp0pocketbase" "%~dp0pocketbase\bin\pocketbase.exe" serve
    timeout /t 2 /nobreak >nul
    echo [OK] PocketBase started on http://127.0.0.1:8090
)

echo.

REM Check if Cloudflare Tunnel is already running
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>NUL | find /I /N "cloudflared.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Cloudflare Tunnel is already running
) else (
    echo [*] Starting Cloudflare Tunnel...
    start "Cloudflare Tunnel" /D "%~dp0pocketbase\cloudflared" "%~dp0pocketbase\cloudflared\cloudflared.exe" tunnel --config config.yml run
    timeout /t 3 /nobreak >nul
    echo [OK] Cloudflare Tunnel started for api.talekeeper.org
)

echo.
echo ========================================
echo   Tale-Keeper Services Started!
echo ========================================
echo.
echo   API (local):  http://127.0.0.1:8090
echo   API (public): https://api.talekeeper.org
echo   Admin UI:     http://127.0.0.1:8090/_/
echo.
echo Press any key to open Admin UI...
pause >nul
start http://127.0.0.1:8090/_/
