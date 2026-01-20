# Start-TaleKeeper.ps1
# This script launches the PocketBase backend and Cloudflare Tunnel

$POCKETBASE_PATH = "$PSScriptRoot\..\bin\pocketbase.exe"
$CLOUDFLARED_PATH = "$PSScriptRoot\..\bin\cloudflared.exe"
$CONFIG_PATH = "$PSScriptRoot\..\cloudflared\config.yml"
$DB_DIR = "$PSScriptRoot\..\pb_data"

# Check if binaries exist
if (!(Test-Path $POCKETBASE_PATH)) {
    Write-Error "pocketbase.exe not found in bin directory. Please download it from https://pocketbase.io/docs/."
    exit 1
}

if (!(Test-Path $CLOUDFLARED_PATH)) {
    Write-Error "cloudflared.exe not found in bin directory. Please download it from https://github.com/cloudflare/cloudflared/releases."
    exit 1
}

Write-Host "Starting Project Codex (Tale-Keeper) Services..." -ForegroundColor Cyan

# Start PocketBase in a minimized window
Start-Process -FilePath $POCKETBASE_PATH -ArgumentList "serve --dir $DB_DIR" -WindowStyle Minimized

# Wait a moment for PB to initialize
Start-Sleep -Seconds 2

# Start Cloudflare Tunnel in a minimized window
if (Test-Path $CONFIG_PATH) {
    Start-Process -FilePath $CLOUDFLARED_PATH -ArgumentList "tunnel --config $CONFIG_PATH run" -WindowStyle Minimized
    Write-Host "Tunnel and Database are now active." -ForegroundColor Green
} else {
    Write-Warning "Cloudflare config not found. Database is running locally only."
}

Write-Host "Services started! You can now access Tale-Keeper." -ForegroundColor Green
Write-Host "Use Stop-TaleKeeper.ps1 to shut down." -ForegroundColor Yellow
Start-Sleep -Seconds 3
