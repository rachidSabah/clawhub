# ============================================================================
# INFOHAS ClawHub — One-Line Uninstaller for Windows PowerShell
# ============================================================================
# Uninstall: irm https://raw.githubusercontent.com/rachidSabah/clawhub/main/uninstall.ps1 | iex
# ============================================================================

$ErrorActionPreference = "Stop"

# Banner
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Yellow
Write-Host "  |              INFOHAS ClawHub Uninstaller                     |" -ForegroundColor Yellow
Write-Host "  ================================================================" -ForegroundColor Yellow
Write-Host ""

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
$installDir = if ($env:CLAWHUB_DIR) { $env:CLAWHUB_DIR } else { "$env:USERPROFILE\clawhub" }

# ---------------------------------------------------------------------------
# Check if installed
# ---------------------------------------------------------------------------
if (-not (Test-Path $installDir)) {
    Write-Host "[WARN] ClawHub installation not found at $installDir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  If installed in a custom location, run:" -ForegroundColor Cyan
    Write-Host "  `$env:CLAWHUB_DIR='C:\path\to\clawhub'; irm https://raw.githubusercontent.com/rachidSabah/clawhub/main/uninstall.ps1 | iex" -ForegroundColor Cyan
    exit 0
}

# ---------------------------------------------------------------------------
# Show what will be removed
# ---------------------------------------------------------------------------
Write-Host "The following will be removed:" -ForegroundColor Cyan
Write-Host "  $installDir (application code, node_modules, database)" -ForegroundColor Yellow
Write-Host ""

# ---------------------------------------------------------------------------
# Stop running processes
# ---------------------------------------------------------------------------
$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "next dev" -or $_.CommandLine -match "clawhub" -or $_.CommandLine -match "agent-ws" -or $_.CommandLine -match "whatsapp-bridge" -or $_.CommandLine -match "messaging-gateway"
}

if ($processes) {
    Write-Host "[WARN] ClawHub processes appear to be running." -ForegroundColor Yellow
    Write-Host "  Stopping known processes..." -ForegroundColor Yellow
    $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Processes stopped." -ForegroundColor Green
    Start-Sleep -Seconds 1
}

# ---------------------------------------------------------------------------
# Confirmation
# ---------------------------------------------------------------------------
Write-Host "Are you sure you want to uninstall ClawHub?" -ForegroundColor Yellow
Write-Host "  This will delete $installDir and all its contents." -ForegroundColor Yellow
Write-Host "  This action cannot be undone." -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Type 'yes' to confirm uninstall"

if ($confirm -ne "yes") {
    Write-Host "[OK] Uninstall cancelled." -ForegroundColor Green
    exit 0
}

# ---------------------------------------------------------------------------
# Remove installation
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "[OK] Removing ClawHub installation..." -ForegroundColor Green

try {
    Remove-Item -Recurse -Force $installDir
    Write-Host "[OK] Installation directory removed." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Could not remove $installDir. Close any running processes and try again." -ForegroundColor Red
    Write-Host "  You can also try removing it manually: Remove-Item -Recurse -Force '$installDir'" -ForegroundColor Yellow
    exit 1
}

# ---------------------------------------------------------------------------
# Optional: Remove Start Menu shortcut
# ---------------------------------------------------------------------------
$startMenuShortcut = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\ClawHub.lnk"
if (Test-Path $startMenuShortcut) {
    Remove-Item -Force $startMenuShortcut -ErrorAction SilentlyContinue
    Write-Host "[OK] Start Menu shortcut removed." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Optional: Remove Desktop shortcut
# ---------------------------------------------------------------------------
$desktopShortcut = "$env:USERPROFILE\Desktop\ClawHub.lnk"
if (Test-Path $desktopShortcut) {
    Remove-Item -Force $desktopShortcut -ErrorAction SilentlyContinue
    Write-Host "[OK] Desktop shortcut removed." -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  |          INFOHAS ClawHub Uninstalled Successfully!          |" -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  |  All files and services have been removed.                  |" -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  |  To reinstall:                                               |" -ForegroundColor Green
Write-Host "  |    irm https://raw.githubusercontent.com/                    |" -ForegroundColor Green
Write-Host "  |      rachidSabah/clawhub/main/install.ps1 | iex             |" -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  |  Thanks for trying ClawHub!                                  |" -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host ""
