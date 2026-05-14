#!/usr/bin/env bash
# ============================================================================
# INFOHAS ClawHub — One-Line Installer for Linux / WSL / macOS
# ============================================================================
# Install:  curl -fsSL https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.sh | bash
# Update:   curl -fsSL https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.sh | bash
# Uninstall: rm -rf ~/clawhub
# ============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
step()  { echo -e "\n${CYAN}${BOLD}[STEP $1]${NC} $2"; }
fail()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------
echo -e "${CYAN}
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║     ██████╗ ██╗     ███╗   ██╗ █████╗ ██╗    ██╗   ██╗     ║
  ║    ██╔═══██╗██║     ████╗  ██║██╔══██╗██║    ╚██╗ ██╔╝     ║
  ║    ██║   ██║██║     ██╔██╗ ██║███████║██║     ╚████╔╝      ║
  ║    ██║   ██║██║     ██║╚██╗██║██╔══██║██║      ╚██╔╝       ║
  ║    ╚██████╔╝███████╗██║ ╚████║██║  ██║███████╗   ██║        ║
  ║     ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝   ╚═╝        ║
  ║                                                              ║
  ║              INFOHAS ClawHub AI Desktop Dashboard            ║
  ║          Multi-Model Orchestration • 58 API Routes           ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
${NC}"

# ---------------------------------------------------------------------------
# Detect Platform
# ---------------------------------------------------------------------------
detect_platform() {
  local os_type="$(uname -s 2>/dev/null || echo 'Unknown')"
  case "$os_type" in
    Linux*)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
      else
        echo "linux"
      fi
      ;;
    Darwin*)
      echo "macos"
      ;;
    MINGW*|MSYS*|CYGWIN*|Windows_NT)
      echo "windows"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

PLATFORM=$(detect_platform)
info "Detected platform: ${YELLOW}${PLATFORM}${NC}"

# ---------------------------------------------------------------------------
# Install Prerequisites
# ---------------------------------------------------------------------------
install_node_linux() {
  info "Installing Node.js 20.x via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
}

install_prerequisites() {
  local need_node=false
  local need_git=false
  local need_chromium=false

  # Check Node.js
  if command -v node &>/dev/null; then
    local node_ver=$(node -v 2>/dev/null)
    # Ensure Node.js >= 18
    local major=${node_ver%%.*}
    major=${major#v}
    if [ "$major" -lt 18 ]; then
      warn "Node.js ${node_ver} is too old (need >= 18). Will upgrade."
      need_node=true
    else
      info "Node.js ${node_ver} found"
    fi
  else
    need_node=true
    warn "Node.js not found"
  fi

  # Check npm
  if command -v npm &>/dev/null; then
    info "npm $(npm -v 2>/dev/null) found"
  else
    need_node=true
    warn "npm not found"
  fi

  # Check git
  if command -v git &>/dev/null; then
    info "Git found"
  else
    need_git=true
    warn "Git not found"
  fi

  # Install missing
  if [ "$need_node" = true ] || [ "$need_git" = true ]; then
    echo ""
    warn "Installing missing prerequisites..."

    if [ "$PLATFORM" = "linux" ] || [ "$PLATFORM" = "wsl" ]; then
      sudo apt-get update -qq 2>/dev/null || true

      if [ "$need_git" = true ]; then
        sudo apt-get install -y git
      fi

      if [ "$need_node" = true ]; then
        install_node_linux
      fi
    elif [ "$PLATFORM" = "macos" ]; then
      if [ "$need_git" = true ]; then
        xcode-select --install 2>/dev/null || true
      fi
      if [ "$need_node" = true ]; then
        if command -v brew &>/dev/null; then
          brew install node@20
        else
          fail "Homebrew not found. Install Node.js manually: https://nodejs.org/"
        fi
      fi
    else
      fail "Unsupported platform for automatic prerequisite installation. Please install Node.js >= 18, npm, and git manually."
    fi
  fi

  # Verify Node.js is now available
  if ! command -v node &>/dev/null; then
    fail "Node.js installation failed. Please install Node.js >= 18 manually: https://nodejs.org/"
  fi
}

# ---------------------------------------------------------------------------
# Main Installation
# ---------------------------------------------------------------------------
install_clawhub() {
  local install_dir="${CLAWHUB_DIR:-$HOME/clawhub}"

  # --- Step 1: Clone ---
  step "1/6" "Cloning INFOHAS ClawHub..."

  if [ -d "$install_dir/.git" ]; then
    info "Existing installation found at ${install_dir}, pulling latest..."
    cd "$install_dir"
    git fetch --all -q 2>/dev/null || true
    git reset --hard origin/main -q 2>/dev/null || git pull -q 2>/dev/null || warn "Could not pull latest, using existing code"
  else
    rm -rf "$install_dir" 2>/dev/null || true
    git clone -q https://github.com/rachidSabah/clawhub.git "$install_dir"
    cd "$install_dir"
  fi

  # --- Step 2: Install Dependencies ---
  step "2/6" "Installing dependencies..."

  if command -v bun &>/dev/null; then
    info "Using Bun $(bun -v 2>/dev/null)"
    bun install
  else
    info "Using npm $(npm -v 2>/dev/null)"
    npm install --legacy-peer-deps
  fi

  # --- Step 3: Generate Prisma Client ---
  step "3/6" "Generating Prisma client..."
  npx prisma generate

  # --- Step 4: Setup Database ---
  step "4/6" "Setting up SQLite database..."
  npx prisma db push

  # --- Step 5: Seed Data ---
  step "5/6" "Seeding providers, agents, and settings..."
  npx tsx prisma/seed.ts 2>/dev/null || {
    warn "Seed script had warnings (non-fatal, continuing...)"
  }

  # --- Step 6: Build ---
  step "6/6" "Building production application..."
  if command -v bun &>/dev/null; then
    bun run build
  else
    npm run build
  fi

  # --- Done ---
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                                              ║${NC}"
  echo -e "${GREEN}║              INFOHAS ClawHub Installed Successfully!         ║${NC}"
  echo -e "${GREEN}║                                                              ║${NC}"
  echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║                                                              ║${NC}"
  echo -e "${GREEN}║  Start (dev):   cd ${install_dir} && npm run dev       ${NC}"
  echo -e "${GREEN}║  Start (prod):  cd ${install_dir} && npm start          ${NC}"
  echo -e "${GREEN}║  URL:           http://localhost:3000                        ║${NC}"
  echo -e "${GREEN}║                                                              ║${NC}"
  echo -e "${GREEN}║  WhatsApp:      cd ${install_dir}/mini-services/whatsapp-bridge${NC}"
  echo -e "${GREEN}║                 && npm start                                 ║${NC}"
  echo -e "${GREEN}║                                                              ║${NC}"
  echo -e "${GREEN}║  WebSocket:     cd ${install_dir}/mini-services/agent-ws    ${NC}"
  echo -e "${GREEN}║                 && npm start                                 ║${NC}"
  echo -e "${GREEN}║                                                              ║${NC}"
  echo -e "${GREEN}║  Command Palette:  Ctrl+K                                    ║${NC}"
  echo -e "${GREEN}║  Keyboard Help:    Ctrl+Shift+/                              ║${NC}"
  echo -e "${GREEN}║                                                              ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${CYAN}Docs: https://github.com/rachidSabah/clawhub${NC}"
  echo ""
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
install_prerequisites
install_clawhub
