#!/bin/bash
# ============================================================================
# INFOHAS ClawHub — Docker Entrypoint
# ============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              INFOHAS ClawHub AI Desktop Dashboard           ║"
echo "║          Multi-Model Orchestration • Docker Container       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Ensure data directory exists
mkdir -p /app/data

# Setup database if not exists
if [ ! -f /app/data/clawhub.db ]; then
    echo "[SETUP] Initializing SQLite database..."
    cd /app
    DATABASE_URL="file:/app/data/clawhub.db" npx prisma db push --skip-generate 2>/dev/null || true
    DATABASE_URL="file:/app/data/clawhub.db" npx tsx prisma/seed.ts 2>/dev/null || {
        echo "[WARN] Seed had warnings (non-fatal, continuing...)"
    }
    echo "[OK] Database initialized"
else
    echo "[OK] Database found at /app/data/clawhub.db"
fi

# Start services in background
echo ""
echo "[START] Starting ClawHub services..."
echo ""

# 1. Main Next.js application (port 3000)
echo "[1/4] Starting Next.js app on port 3000..."
cd /app
DATABASE_URL="file:/app/data/clawhub.db" node server.js &
PID_MAIN=$!

# 2. Agent WebSocket service (port 3003)
echo "[2/4] Starting Agent WebSocket on port 3003..."
cd /app/mini-services/agent-ws
node -e "
const { createRequire } = require('module');
const req = createRequire(__dirname + '/package.json');
" 2>/dev/null || true
# Use tsx for TS support
npx tsx index.ts &
PID_WS=$!

# 3. WhatsApp Bridge (port 3004)
if [ "${WHATTSAPP_ENABLED:-false}" = "true" ]; then
    echo "[3/4] Starting WhatsApp Bridge on port 3004..."
    cd /app/mini-services/whatsapp-bridge
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium node index.js &
PID_WHATSAPP=$!
else
    echo "[3/4] WhatsApp Bridge disabled (set WHATTSAPP_ENABLED=true to enable)"
fi

# 4. Messaging Gateway (port 3005)
if [ "${MESSAGING_ENABLED:-false}" = "true" ]; then
    echo "[4/4] Starting Messaging Gateway on port 3005..."
    cd /app/mini-services/messaging-gateway
    npx tsx index.ts &
PID_MESSAGING=$!
else
    echo "[4/4] Messaging Gateway disabled (set MESSAGING_ENABLED=true to enable)"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ClawHub is running!                            ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Dashboard:    http://localhost:3000                        ║"
echo "║  WebSocket:    ws://localhost:3003                          ║"
echo "║  WhatsApp:     http://localhost:3004 (if enabled)           ║"
echo "║  Messaging:    http://localhost:3005 (if enabled)           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Wait for any process to exit
wait -n 2>/dev/null || wait

# If one exits, kill all
echo "[STOP] A service exited, shutting down..."
kill $PID_MAIN 2>/dev/null || true
kill $PID_WS 2>/dev/null || true
kill $PID_WHATSAPP 2>/dev/null || true
kill $PID_MESSAGING 2>/dev/null || true
