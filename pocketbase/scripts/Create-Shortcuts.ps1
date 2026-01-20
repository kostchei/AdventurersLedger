# Create-Shortcuts.ps1
# This script creates desktop shortcuts for Start and Stop scripts

$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")

# Start Shortcut
$StartShortcut = $WshShell.CreateShortcut("$DesktopPath\Start TaleKeeper.lnk")
$StartShortcut.TargetPath = "powershell.exe"
$StartShortcut.Arguments = "-ExecutionPolicy Bypass -File `"$PSScriptRoot\Start-TaleKeeper.ps1`""
$StartShortcut.WorkingDirectory = "$PSScriptRoot"
$StartShortcut.WindowStyle = 7 # Minimized
$StartShortcut.Description = "Start Tale-Keeper Backend and Tunnel"
$StartShortcut.Save()

# Stop Shortcut
$StopShortcut = $WshShell.CreateShortcut("$DesktopPath\Stop TaleKeeper.lnk")
$StopShortcut.TargetPath = "powershell.exe"
$StopShortcut.Arguments = "-ExecutionPolicy Bypass -File `"$PSScriptRoot\Stop-TaleKeeper.ps1`""
$StopShortcut.WorkingDirectory = "$PSScriptRoot"
$StopShortcut.WindowStyle = 7 # Minimized
$StopShortcut.Description = "Stop Tale-Keeper Services"
$StopShortcut.Save()

Write-Host "Shortcuts created on your Desktop!" -ForegroundColor Green
