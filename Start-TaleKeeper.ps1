# Tale-Keeper Startup Script
# Place this on your desktop and run it to start all services

$ErrorActionPreference = "Stop"

# Project directory - UPDATE THIS if your project is in a different location
$ProjectDir = "D:\Code\AdventurersLedger\Check\AdventurersLedger_Codex"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting Tale-Keeper Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify project directory exists
if (-not (Test-Path $ProjectDir)) {
    Write-Host "[ERROR] Project directory not found: $ProjectDir" -ForegroundColor Red
    Write-Host "Please update the `$ProjectDir variable in this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location $ProjectDir

# Check and start PocketBase
Write-Host "Checking PocketBase..." -NoNewline
$pbProcess = Get-Process -Name "pocketbase" -ErrorAction SilentlyContinue

if ($pbProcess) {
    Write-Host " [OK] Already running" -ForegroundColor Green
} else {
    Write-Host " [*] Starting..." -ForegroundColor Yellow

    $pbPath = Join-Path $ProjectDir "pocketbase\bin\pocketbase.exe"
    if (-not (Test-Path $pbPath)) {
        Write-Host "[ERROR] PocketBase not found at: $pbPath" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    Start-Process -FilePath $pbPath -ArgumentList "serve" -WorkingDirectory (Join-Path $ProjectDir "pocketbase") -WindowStyle Normal
    Start-Sleep -Seconds 3

    $pbProcess = Get-Process -Name "pocketbase" -ErrorAction SilentlyContinue
    if ($pbProcess) {
        Write-Host "   [OK] PocketBase started on http://127.0.0.1:8090" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] PocketBase failed to start" -ForegroundColor Red
    }
}

Write-Host ""

# Check and start Cloudflare Tunnel
Write-Host "Checking Cloudflare Tunnel..." -NoNewline
$cfProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue

if ($cfProcess) {
    Write-Host " [OK] Already running" -ForegroundColor Green
} else {
    Write-Host " [*] Starting..." -ForegroundColor Yellow

    $cfPath = Join-Path $ProjectDir "pocketbase\cloudflared\cloudflared.exe"
    $cfConfig = Join-Path $ProjectDir "pocketbase\cloudflared\config.yml"

    if (-not (Test-Path $cfPath)) {
        Write-Host "[ERROR] Cloudflared not found at: $cfPath" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }

    Start-Process -FilePath $cfPath -ArgumentList "tunnel", "--config", "config.yml", "run" -WorkingDirectory (Join-Path $ProjectDir "pocketbase\cloudflared") -WindowStyle Normal
    Start-Sleep -Seconds 4

    $cfProcess = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($cfProcess) {
        Write-Host "   [OK] Cloudflare Tunnel started for api.talekeeper.org" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Cloudflare Tunnel failed to start" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Tale-Keeper Services Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Final status check
$pbRunning = Get-Process -Name "pocketbase" -ErrorAction SilentlyContinue
$cfRunning = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue

if ($pbRunning) {
    Write-Host "  ✓ PocketBase:       " -NoNewline -ForegroundColor Green
    Write-Host "RUNNING" -ForegroundColor White
} else {
    Write-Host "  ✗ PocketBase:       " -NoNewline -ForegroundColor Red
    Write-Host "NOT RUNNING" -ForegroundColor White
}

if ($cfRunning) {
    Write-Host "  ✓ Cloudflare Tunnel:" -NoNewline -ForegroundColor Green
    Write-Host "RUNNING" -ForegroundColor White
} else {
    Write-Host "  ✗ Cloudflare Tunnel:" -NoNewline -ForegroundColor Red
    Write-Host "NOT RUNNING" -ForegroundColor White
}

Write-Host ""

if ($pbRunning -and $cfRunning) {
    Write-Host "All services running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  API (local):  http://127.0.0.1:8090" -ForegroundColor White
    Write-Host "  API (public): https://api.talekeeper.org" -ForegroundColor White
    Write-Host "  Admin UI:     http://127.0.0.1:8090/_/" -ForegroundColor White
    Write-Host "  Frontend:     http://localhost:5173" -ForegroundColor White
    Write-Host ""

    $openAdmin = Read-Host "Open Admin UI in browser? (Y/N)"
    if ($openAdmin -eq "Y" -or $openAdmin -eq "y") {
        Start-Process "http://127.0.0.1:8090/_/"
    }
} else {
    Write-Host "Some services failed to start!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
}
