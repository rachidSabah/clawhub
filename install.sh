#!/usr/bin/env bash
# ============================================================================
# INFOHAS ClawHub — One-Line Installer
# ============================================================================
# Install: curl -fsSL https://raw.githubusercontent.com/infohas/clawhub/main/install.sh | bash
# Or:      wget -qO- https://raw.githubusercontent.com/infohas/clawhub/main/install.sh | bash
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

BANNER="${CYAN}
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
  ║                  Multi-Model Orchestration                   ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
${NC}"

echo -e "$BANNER"

# Detect platform
detect_platform() {
  local os_type="$(uname -s 2>/dev/null || echo 'Unknown')"
  local os_arch="$(uname -m 2>/dev/null || echo 'Unknown')"

  case "$os_type" in
    Linux*)
      # Check if WSL
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
echo -e "${GREEN}[INFO]${NC} Detected platform: ${YELLOW}${PLATFORM}${NC}"

# Check prerequisites
check_prerequisites() {
  local missing=()

  # Check Node.js
  if command -v node &>/dev/null; then
    local node_version=$(node -v 2>/dev/null)
    echo -e "${GREEN}[OK]${NC} Node.js ${node_version} found"
  else
    missing+=("node")
    echo -e "${RED}[MISSING]${NC} Node.js not found"
  fi

  # Check npm/bun
  if command -v bun &>/dev/null; then
    echo -e "${GREEN}[OK]${NC} Bun found"
  elif command -v npm &>/dev/null; then
    echo -e "${GREEN}[OK]${NC} npm found"
  else
    missing+=("npm")
    echo -e "${RED}[MISSING]${NC} Neither bun nor npm found"
  fi

  # Check git
  if command -v git &>/dev/null; then
    echo -e "${GREEN}[OK]${NC} Git found"
  else
    missing+=("git")
    echo -e "${RED}[MISSING]${NC} Git not found"
  fi

  if [ ${#missing[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}[INSTALL]${NC} Installing missing prerequisites..."

    if [ "$PLATFORM" = "linux" ] || [ "$PLATFORM" = "wsl" ]; then
      echo -e "${CYAN}[INFO]${NC} Running apt-based install..."
      sudo apt-get update -qq
      for pkg in "${missing[@]}"; do
        case "$pkg" in
          node|npm)
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
          git)
            sudo apt-get install -y git
            ;;
        esac
      done
    fi
  fi
}

# Install Node.js if missing (Windows native)
install_node_windows() {
  echo -e "${CYAN}[INFO]${NC} Downloading Node.js for Windows..."
  local node_url="https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
  local tmp_dir="$(mktemp -d 2>/dev/null || echo "$TEMP")"
  curl -fsSL "$node_url" -o "$tmp_dir/node-installer.msi"
  echo -e "${YELLOW}[INFO]${NC} Running Node.js installer..."
  msiexec /i "$tmp_dir/node-installer.msi" /quiet /norestart
  rm -f "$tmp_dir/node-installer.msi"
}

# Main installation
install_clawhub() {
  local install_dir="${CLAWHUB_DIR:-$HOME/clawhub}"

  echo -e "\n${GREEN}[STEP 1/5]${NC} Cloning INFOHAS ClawHub..."
  
  if [ -d "$install_dir" ]; then
    echo -e "${YELLOW}[INFO]${NC} Directory $install_dir exists, pulling latest..."
    cd "$install_dir"
    git pull -q 2>/dev/null || echo -e "${YELLOW}[WARN]${NC} Could not pull, using existing code"
  else
    git clone -q https://github.com/infohas/clawhub.git "$install_dir"
    cd "$install_dir"
  fi

  echo -e "${GREEN}[STEP 2/5]${NC} Installing dependencies..."
  if command -v bun &>/dev/null; then
    bun install
  else
    npm install
  fi

  echo -e "${GREEN}[STEP 3/5]${NC} Setting up database..."
  if command -v bun &>/dev/null; then
    bun run db:push
  else
    npx prisma db push
  fi

  echo -e "${GREEN}[STEP 4/5]${NC} Seeding providers and agents..."
  if command -v bun &>/dev/null; then
    bun run seed 2>/dev/null || npx tsx prisma/seed.ts
  else
    npx tsx prisma/seed.ts
  fi

  echo -e "${GREEN}[STEP 5/5]${NC} Building application..."
  if command -v bun &>/dev/null; then
    bun run build
  else
    npm run build
  fi

  echo -e "\n${GREEN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║          INFOHAS ClawHub Installed! 🎉          ║${NC}"
  echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║                                                  ║${NC}"
  echo -e "${GREEN}║  Start:    cd $install_dir && bun dev     ${NC}"
  echo -e "${GREEN}║  Or:       cd $install_dir && npm run dev ${NC}"
  echo -e "${GREEN}║  URL:      http://localhost:3000                  ║${NC}"
  echo -e "${GREEN}║                                                  ║${NC}"
  echo -e "${GREEN}║  WhatsApp: cd mini-services/whatsapp-bridge      ║${NC}"
  echo -e "${GREEN}║            && npm start                          ║${NC}"
  echo -e "${GREEN}║                                                  ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
}

# Run
check_prerequisites
install_clawhub
