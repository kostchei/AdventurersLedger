# Stop-TaleKeeper.ps1
# This script stops the PocketBase backend and Cloudflare Tunnel

Write-Host "Stopping Tale-Keeper Services..." -ForegroundColor Red

# Stop processes silently
$procs = "pocketbase", "cloudflared"
foreach ($p in $procs) {
    if (Get-Process -Name $p -ErrorAction SilentlyContinue) {
        Stop-Process -Name $p -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped $p." -ForegroundColor Gray
    }
}

Write-Host "All services stopped." -ForegroundColor Green
Start-Sleep -Seconds 2
