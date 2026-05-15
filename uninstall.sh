#!/usr/bin/env bash
# ============================================================================
# INFOHAS ClawHub — One-Line Uninstaller for Linux / WSL / macOS
# ============================================================================
# Uninstall: curl -fsSL https://raw.githubusercontent.com/rachidSabah/clawhub/main/uninstall.sh | bash
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
fail()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ---------------------------------------------------------------------------
# Banner
# ---------------------------------------------------------------------------
echo -e "${YELLOW}
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║              INFOHAS ClawHub Uninstaller                     ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
${NC}"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
INSTALL_DIR="${CLAWHUB_DIR:-$HOME/clawhub}"

# ---------------------------------------------------------------------------
# Check if installed
# ---------------------------------------------------------------------------
if [ ! -d "$INSTALL_DIR" ]; then
  warn "ClawHub installation not found at ${INSTALL_DIR}"
  echo ""
  echo -e "  If installed in a custom location, run:"
  echo -e "  ${CYAN}CLAWHUB_DIR=/path/to/clawhub curl -fsSL https://raw.githubusercontent.com/rachidSabah/clawhub/main/uninstall.sh | bash${NC}"
  exit 0
fi

# ---------------------------------------------------------------------------
# Show what will be removed
# ---------------------------------------------------------------------------
echo -e "${CYAN}The following will be removed:${NC}"
echo -e "  ${YELLOW}${INSTALL_DIR}${NC} (application code, node_modules, database)"
echo ""

# Check for running processes
if pgrep -f "next dev" > /dev/null 2>&1 || pgrep -f "clawhub" > /dev/null 2>&1; then
  warn "ClawHub processes appear to be running."
  echo -e "  Stopping known processes..."
  
  # Kill Next.js dev server
  pkill -f "next dev" 2>/dev/null || true
  # Kill agent-ws
  pkill -f "agent-ws" 2>/dev/null || true
  # Kill whatsapp-bridge
  pkill -f "whatsapp-bridge" 2>/dev/null || true
  # Kill messaging-gateway
  pkill -f "messaging-gateway" 2>/dev/null || true
  
  info "Processes stopped."
  sleep 1
fi

# ---------------------------------------------------------------------------
# Confirmation
# ---------------------------------------------------------------------------
echo -e "${YELLOW}${BOLD}Are you sure you want to uninstall ClawHub?${NC}"
echo -e "  This will delete ${INSTALL_DIR} and all its contents."
echo -e "  ${RED}This action cannot be undone.${NC}"
echo ""
read -rp "Type 'yes' to confirm uninstall: " confirm

if [ "$confirm" != "yes" ]; then
  info "Uninstall cancelled."
  exit 0
fi

# ---------------------------------------------------------------------------
# Remove installation
# ---------------------------------------------------------------------------
echo ""
info "Removing ClawHub installation..."

rm -rf "$INSTALL_DIR"

if [ -d "$INSTALL_DIR" ]; then
  fail "Could not remove ${INSTALL_DIR}. Try running with sudo."
fi

info "Installation directory removed."

# ---------------------------------------------------------------------------
# Optional: Remove desktop shortcut (if exists)
# ---------------------------------------------------------------------------
DESKTOP_FILE="$HOME/.local/share/applications/clawhub.desktop"
if [ -f "$DESKTOP_FILE" ]; then
  rm -f "$DESKTOP_FILE"
  info "Desktop shortcut removed."
fi

# ---------------------------------------------------------------------------
# Optional: Remove shell alias (if exists)
# ---------------------------------------------------------------------------
SHELL_RC=""
if [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
elif [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
fi

if [ -n "$SHELL_RC" ] && grep -q "clawhub" "$SHELL_RC" 2>/dev/null; then
  echo ""
  echo -e "${YELLOW}Found ClawHub alias in ${SHELL_RC}${NC}"
  read -rp "Remove ClawHub aliases from shell config? [y/N]: " remove_alias
  if [ "$remove_alias" = "y" ] || [ "$remove_alias" = "Y" ]; then
    sed -i '/# ClawHub/d' "$SHELL_RC"
    sed -i '/alias clawhub/d' "$SHELL_RC"
    info "Shell aliases removed."
  fi
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║          INFOHAS ClawHub Uninstalled Successfully!          ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  All files and services have been removed.                  ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  To reinstall:                                               ║${NC}"
echo -e "${GREEN}║    curl -fsSL https://raw.githubusercontent.com/              ║${NC}"
echo -e "${GREEN}║      rachidSabah/clawhub/main/install.sh | bash              ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  Thanks for trying ClawHub!                                  ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
