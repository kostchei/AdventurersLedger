# Run this script ONCE to create a desktop shortcut for Tale-Keeper

$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ProjectDir = $PSScriptRoot
$ShortcutPath = Join-Path $DesktopPath "Start Tale-Keeper.lnk"

$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = Join-Path $ProjectDir "start-talekeeper.bat"
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.Description = "Start Tale-Keeper Services (PocketBase + Cloudflare Tunnel)"
$Shortcut.IconLocation = "shell32.dll,13"  # Server/computer icon
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Double-click the shortcut on your desktop to start Tale-Keeper services." -ForegroundColor White
Read-Host "Press Enter to exit"
