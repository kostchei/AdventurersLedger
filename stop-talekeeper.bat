@echo off
echo ========================================
echo   Stopping Tale-Keeper Services
echo ========================================
echo.

REM Stop PocketBase
tasklist /FI "IMAGENAME eq pocketbase.exe" 2>NUL | find /I /N "pocketbase.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [*] Stopping PocketBase...
    taskkill /F /IM pocketbase.exe >nul 2>&1
    echo [OK] PocketBase stopped
) else (
    echo [OK] PocketBase was not running
)

echo.

REM Stop Cloudflare Tunnel
tasklist /FI "IMAGENAME eq cloudflared.exe" 2>NUL | find /I /N "cloudflared.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [*] Stopping Cloudflare Tunnel...
    taskkill /F /IM cloudflared.exe >nul 2>&1
    echo [OK] Cloudflare Tunnel stopped
) else (
    echo [OK] Cloudflare Tunnel was not running
)

echo.
echo ========================================
echo   Tale-Keeper Services Stopped!
echo ========================================
echo.
pause
