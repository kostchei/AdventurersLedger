# Stop-TaleKeeper.ps1
# This script stops the PocketBase backend and Cloudflare Tunnel

Write-Host "Stopping Tale-Keeper Services..." -ForegroundColor Red

Get-Process -Name "pocketbase" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "All services stopped." -ForegroundColor Green
Start-Sleep -Seconds 2
