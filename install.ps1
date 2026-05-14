# ============================================================================
# INFOHAS ClawHub — One-Line Installer for Windows PowerShell
# ============================================================================
# Install:  irm https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.ps1 | iex
# Update:   irm https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.ps1 | iex
# Uninstall: Remove-Item -Recurse -Force "$env:USERPROFILE\clawhub"
# ============================================================================

$ErrorActionPreference = "Stop"

# Banner
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host "  |                                                              |" -ForegroundColor Cyan
Write-Host "  |              INFOHAS ClawHub AI Desktop Dashboard            |" -ForegroundColor Cyan
Write-Host "  |          Multi-Model Orchestration - 58 API Routes           |" -ForegroundColor Cyan
Write-Host "  |                                                              |" -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------
function Write-Step([string]$Step, [string]$Message) {
    Write-Host ""
    Write-Host "[STEP $Step] $Message" -ForegroundColor Green
}

function Write-Ok([string]$Message) {
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn([string]$Message) {
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err([string]$Message) {
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# ---------------------------------------------------------------------------
# Check & Install Node.js
# ---------------------------------------------------------------------------
$nodeInstalled = $false
try {
    $nodeVersion = node -v 2>$null
    $major = [int]($nodeVersion -replace 'v(\d+).*', '$1')
    if ($major -ge 18) {
        Write-Ok "Node.js $nodeVersion found"
        $nodeInstalled = $true
    } else {
        Write-Warn "Node.js $nodeVersion is too old (need >= 18). Upgrading..."
    }
} catch {
    Write-Warn "Node.js not found"
}

if (-not $nodeInstalled) {
    Write-Step "0" "Installing Node.js 20.x..."
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $installer = "$env:TEMP\node-installer.msi"

    Write-Host "  Downloading Node.js..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installer -UseBasicParsing

    Write-Host "  Running Node.js installer (this may take a minute)..." -ForegroundColor Yellow
    Start-Process msiexec.exe -ArgumentList "/i", $installer, "/quiet", "/norestart" -Wait
    Remove-Item $installer -Force -ErrorAction SilentlyContinue

    Refresh-Path

    # Verify
    try {
        $ver = node -v
        Write-Ok "Node.js $ver installed successfully"
    } catch {
        Write-Err "Node.js installation failed. Please install manually from https://nodejs.org/"
        Write-Host "  After installing, restart PowerShell and re-run this installer." -ForegroundColor Yellow
        exit 1
    }
}

# ---------------------------------------------------------------------------
# Check & Install Git
# ---------------------------------------------------------------------------
$gitInstalled = $false
try {
    git --version | Out-Null
    Write-Ok "Git found"
    $gitInstalled = $true
} catch {
    Write-Warn "Git not found"
}

if (-not $gitInstalled) {
    Write-Step "0" "Installing Git for Windows..."
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $installer = "$env:TEMP\git-installer.exe"

    Write-Host "  Downloading Git..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $gitUrl -OutFile $installer -UseBasicParsing

    Write-Host "  Running Git installer (silent)..." -ForegroundColor Yellow
    Start-Process $installer -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL", "/SP-" -Wait
    Remove-Item $installer -Force -ErrorAction SilentlyContinue

    Refresh-Path

    try {
        git --version | Out-Null
        Write-Ok "Git installed successfully"
    } catch {
        Write-Err "Git installation failed. Please install manually from https://git-scm.com/"
        exit 1
    }
}

# ---------------------------------------------------------------------------
# Install ClawHub
# ---------------------------------------------------------------------------
$installDir = if ($env:CLAWHUB_DIR) { $env:CLAWHUB_DIR } else { "$env:USERPROFILE\clawhub" }

# Step 1: Clone
Write-Step "1/6" "Cloning INFOHAS ClawHub..."

if (Test-Path "$installDir\.git") {
    Write-Host "  Existing installation found, pulling latest..." -ForegroundColor Yellow
    Push-Location $installDir
    git fetch --all -q 2>$null
    git reset --hard origin/main -q 2>$null
    if ($LASTEXITCODE -ne 0) { git pull -q 2>$null }
    Pop-Location
} else {
    if (Test-Path $installDir) { Remove-Item -Recurse -Force $installDir }
    git clone -q https://github.com/rachidSabah/clawhub.git $installDir
}

Push-Location $installDir

# Step 2: Install Dependencies
Write-Step "2/6" "Installing dependencies..."
npm install --legacy-peer-deps

# Step 3: Generate Prisma Client
Write-Step "3/6" "Generating Prisma client..."
npx prisma generate

# Step 4: Setup Database
Write-Step "4/6" "Setting up SQLite database..."
npx prisma db push

# Step 5: Seed Data
Write-Step "5/6" "Seeding providers, agents, and settings..."
try {
    npx tsx prisma/seed.ts 2>$null
    Write-Ok "Database seeded"
} catch {
    Write-Warn "Seed script had warnings (non-fatal, continuing...)"
}

# Step 6: Build
Write-Step "6/6" "Building production application..."
npm run build

Pop-Location

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  |          INFOHAS ClawHub Installed Successfully!             |" -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  |  Start (dev):   cd $installDir && npm run dev         " -ForegroundColor Green
Write-Host "  |  Start (prod):  cd $installDir && npm start            " -ForegroundColor Green
Write-Host "  |  URL:           http://localhost:3000                        " -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  |  WhatsApp:      cd $installDir\mini-services\whatsapp-bridge" -ForegroundColor Green
Write-Host "  |                  && npm start                                " -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  |  WebSocket:     cd $installDir\mini-services\agent-ws      " -ForegroundColor Green
Write-Host "  |                  && npm start                                " -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  |  Command Palette:  Ctrl+K                                    " -ForegroundColor Green
Write-Host "  |  Keyboard Help:    Ctrl+Shift+/                              " -ForegroundColor Green
Write-Host "  |                                                              |" -ForegroundColor Green
Write-Host "  ================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Docs: https://github.com/rachidSabah/clawhub" -ForegroundColor Cyan
Write-Host ""
