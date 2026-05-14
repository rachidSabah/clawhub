# ============================================================================
# INFOHAS ClawHub — Multi-stage Docker Build
# ============================================================================
# docker build -t clawhub .
# docker run -p 3000:3000 -p 3003:3003 -p 3004:3004 clawhub
# ============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Dependencies
# ---------------------------------------------------------------------------
FROM node:20-slim AS deps
WORKDIR /app

# Install prerequisites for native modules
RUN apt-get update && apt-get install -y \
    python3 make g++ git \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* bun.lock* ./
RUN npm install --legacy-peer-deps --ignore-scripts

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js standalone
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Mini-services build
# ---------------------------------------------------------------------------
FROM node:20-slim AS mini-builder
WORKDIR /app

# Build WhatsApp bridge
COPY mini-services/whatsapp-bridge/package.json mini-services/whatsapp-bridge/package-lock.json* ./mini-services/whatsapp-bridge/
RUN cd mini-services/whatsapp-bridge && npm install --production

# Build Agent WS
COPY mini-services/agent-ws/package.json mini-services/agent-ws/package-lock.json* ./mini-services/agent-ws/
RUN cd mini-services/agent-ws && npm install --production

# Build Messaging Gateway
COPY mini-services/messaging-gateway/package.json mini-services/messaging-gateway/package-lock.json* ./mini-services/messaging-gateway/
RUN cd mini-services/messaging-gateway && npm install --production 2>/dev/null || true

# ---------------------------------------------------------------------------
# Stage 4: Production Runtime
# ---------------------------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/clawhub.db

# Install runtime dependencies for WhatsApp (Chromium)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1001 clawhub && \
    useradd --uid 1001 --gid clawhub --shell /bin/bash --create-home clawhub

# Copy standalone Next.js app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy mini-services
COPY --from=mini-builder /app/mini-services ./mini-services
COPY mini-services/agent-ws/index.ts ./mini-services/agent-ws/index.ts
COPY mini-services/whatsapp-bridge/index.js ./mini-services/whatsapp-bridge/index.js
COPY mini-services/messaging-gateway/ ./mini-services/messaging-gateway/

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create data directory
RUN mkdir -p /app/data && chown -R clawhub:clawhub /app/data
VOLUME ["/app/data"]

# WhatsApp auth sessions
RUN mkdir -p /app/mini-services/whatsapp-bridge/.wwebjs_auth && \
    chown -R clawhub:clawhub /app/mini-services/whatsapp-bridge/.wwebjs_auth
VOLUME ["/app/mini-services/whatsapp-bridge/.wwebjs_auth"]

# Environment file
RUN mkdir -p /app && touch /app/.env

USER clawhub

EXPOSE 3000 3003 3004 3005

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/docker-entrypoint.sh"]
