# INFOHAS ClawHub — Windows PowerShell Installer
# Run: irm https://raw.githubusercontent.com/infohas/clawhub/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║         INFOHAS ClawHub AI Desktop Dashboard     ║" -ForegroundColor Cyan
Write-Host "  ║            Multi-Model Orchestration             ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeInstalled = $false
try { $nodeVersion = node -v; $nodeInstalled = $true; Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green }
catch { Write-Host "[MISSING] Node.js not found" -ForegroundColor Red }

if (-not $nodeInstalled) {
    Write-Host "[INSTALL] Downloading Node.js..." -ForegroundColor Yellow
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $installer = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installer
    Write-Host "[INSTALL] Running Node.js installer..." -ForegroundColor Yellow
    Start-Process msiexec.exe -ArgumentList "/i", $installer, "/quiet", "/norestart" -Wait
    Remove-Item $installer -Force
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "[OK] Node.js installed" -ForegroundColor Green
}

# Check Git
$gitInstalled = $false
try { git --version | Out-Null; $gitInstalled = $true; Write-Host "[OK] Git found" -ForegroundColor Green }
catch { Write-Host "[MISSING] Git not found" -ForegroundColor Red }

if (-not $gitInstalled) {
    Write-Host "[INSTALL] Downloading Git..." -ForegroundColor Yellow
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $installer = "$env:TEMP\git-installer.exe"
    Invoke-WebRequest -Uri $gitUrl -OutFile $installer
    Start-Process $installer -ArgumentList "/VERYSILENT", "/NORESTART" -Wait
    Remove-Item $installer -Force
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "[OK] Git installed" -ForegroundColor Green
}

# Install ClawHub
$installDir = if ($env:CLAWHUB_DIR) { $env:CLAWHUB_DIR } else { "$env:USERPROFILE\clawhub" }

Write-Host ""
Write-Host "[STEP 1/5] Cloning INFOHAS ClawHub..." -ForegroundColor Green

if (Test-Path $installDir) {
    Write-Host "[INFO] Directory exists, pulling latest..." -ForegroundColor Yellow
    Set-Location $installDir
    git pull -q 2>$null
} else {
    git clone -q https://github.com/rachidSabah/clawhub.git $installDir
    Set-Location $installDir
}

Write-Host "[STEP 2/5] Installing dependencies..." -ForegroundColor Green
npm install

Write-Host "[STEP 3/5] Setting up database..." -ForegroundColor Green
npx prisma db push

Write-Host "[STEP 4/5] Seeding providers and agents..." -ForegroundColor Green
npx tsx prisma/seed.ts

Write-Host "[STEP 5/5] Building application..." -ForegroundColor Green
npm run build

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║          INFOHAS ClawHub Installed!              ║" -ForegroundColor Green
Write-Host "  ╠══════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "  ║                                                  ║" -ForegroundColor Green
Write-Host "  ║  Start:  cd $installDir && npm run dev   " -ForegroundColor Green
Write-Host "  ║  URL:    http://localhost:3000                    ║" -ForegroundColor Green
Write-Host "  ║                                                  ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
