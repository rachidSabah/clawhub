# INFOHAS ClawHub

> **AI Desktop Dashboard — Multi-Model Orchestration, RAG, Agent Gallery & Cron Automation**

![ClawHub](https://img.shields.io/badge/INFOHAS-ClawHub-emerald?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20WSL%20%7C%20Linux%20%7C%20macOS-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![API Routes](https://img.shields.io/badge/API_Routes-68+-orange?style=flat-square)
![Providers](https://img.shields.io/badge/AI_Providers-31+-purple?style=flat-square)
![Tools](https://img.shields.io/badge/Tools-48-red?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker)

---

## 🚀 One-Line Install

| Platform | Command |
|----------|---------|
| **Linux / WSL / macOS** | `curl -fsSL https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.sh \| bash` |
| **Windows PowerShell** | `irm https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.ps1 \| iex` |

The installer automatically:
- Detects your platform (Linux, WSL, macOS, Windows)
- Installs Node.js 20+ and Git if missing
- Clones the repository to `~/clawhub` (or `%USERPROFILE%\clawhub` on Windows)
- Installs all npm dependencies including mini-services
- Generates Prisma client and pushes the SQLite database
- Seeds 31+ AI providers, 4 prebuilt agents, and 12 default settings
- Builds the production application

After installation, start with:
```bash
cd ~/clawhub && npm run dev
```

Open **http://localhost:3000** in your browser.

### Manual Install
```bash
git clone https://github.com/rachidSabah/clawhub.git
cd clawhub
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

### Custom Install Directory
```bash
# Linux/WSL/macOS
CLAWHUB_DIR=/opt/clawhub curl -fsSL https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.sh | bash

# Windows PowerShell
$env:CLAWHUB_DIR = "C:\Apps\ClawHub"; irm https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.ps1 | iex
```

---

## 🐳 Docker

ClawHub ships with full Docker support for containerized deployment:

```bash
# Build and run locally
docker compose up -d

# Or pull from GitHub Container Registry
docker pull ghcr.io/rachidsabah/clawhub:latest
docker run -p 3000:3000 -p 3003:3003 -p 3004:3004 -p 3005:3005 ghcr.io/rachidsabah/clawhub:latest
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| **Main Dashboard** | 3000 | Next.js web application |
| **Agent WebSocket** | 3003 | Real-time agent streaming |
| **WhatsApp Bridge** | 3004 | WhatsApp integration (optional) |
| **Messaging Gateway** | 3005 | Telegram, Discord, Slack, Signal, HA (optional) |

### Docker Environment Variables
```yaml
environment:
  - DATABASE_URL=file:/app/data/clawhub.db
  - WHATTSAPP_ENABLED=true          # Enable WhatsApp bridge
  - MESSAGING_ENABLED=true          # Enable messaging gateway
  - OPENAI_API_KEY=your-key
  - ANTHROPIC_API_KEY=your-key
  - TELEGRAM_BOT_TOKEN=your-token
  - DISCORD_BOT_TOKEN=your-token
```

### Docker Volumes
- `clawhub-data` — Persistent SQLite database
- `clawhub-whatsapp` — WhatsApp auth session data

---

## 🔄 Auto-Update System

ClawHub automatically checks GitHub for new releases and updates — no need to re-run the installer.

### How It Works
- Every **60 minutes**, ClawHub checks the GitHub repo for new commits
- When a new version is detected, a notification appears in the dashboard
- Click **"Update Now"** to automatically pull the latest changes, rebuild, and restart
- Updates are also available via the `/status` slash command
- You can configure the check interval and enable/disable auto-update in Settings

### Manual Update (if preferred)
```bash
# Linux/WSL/macOS
curl -fsSL https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.sh | bash

# Windows PowerShell
irm https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.ps1 | iex
```

The installer detects existing installations and pulls the latest changes.

---

## ✨ Features

### 🤖 Real AI Streaming
- Live streaming chat responses via z-ai-web-dev-sdk
- SSE (Server-Sent Events) for real-time token delivery
- Fallback to simulated responses when no provider is configured
- Message history context sent with each request for multi-turn conversations

### ⌨️ Slash Commands
Type `/` in the chat input to access built-in commands:

| Command | Description |
|---------|-------------|
| `/compress` | Compress conversation context via AI summarization |
| `/usage` | Show token usage stats |
| `/insights [--days N]` | Usage insights for last N days (default 7) |
| `/skills` | Browse available skills |
| `/<skill-name>` | Execute a skill by name |
| `/stop` | Interrupt current streaming response |
| `/platforms` | Show messaging platform status |
| `/status` | Show overall app status |
| `/sethome <path>` | Set workspace home directory |
| `/help` | Show all available commands |

### 🔍 Web Search
- Real-time web search integrated directly into chat
- Dedicated Web Search panel with result cards
- Search via Command Palette (Ctrl+K) or Search button in input bar
- Results include title, snippet, URL, and host name

### 🎨 Image Generation
- AI image generation from text descriptions
- Multiple sizes: 1024x1024, 1344x768, 768x1344, 1152x864, 1440x720
- Image gallery with download button
- Generate directly from chat input or dedicated panel

### 📊 Token Usage & Cost Tracking
- Real-time token usage dashboard with daily bar chart
- Per-model breakdown (tokens, cost, request count)
- Estimated cost calculation
- `/insights` command for time-range analysis

### ⚡ Model Fallback Chains
- Configure primary + auxiliary models per ModelConfig
- Auto-switch to backup models on error
- Sequential fallback through the entire chain
- Error reporting with last failure message

### 🔄 Model Comparison Mode
- Send the same prompt to 2-4 models simultaneously
- Side-by-side response comparison in columns
- Response time tracking per model
- Vote for the best response (Trophy icon)

### 🌿 Conversation Branching
- Fork any conversation from any message point
- One-click branching via GitBranch icon on message hover
- Branched conversations marked with branch indicator in sidebar
- Original conversation remains untouched

### 📝 Code Syntax Highlighting
- Automatic detection of code blocks (```language ... ```)
- Prism-based syntax highlighting with oneDark theme
- Copy-to-clipboard button on all code blocks
- Inline code, bold, italic, links, headings, and images rendered

### 🎯 Command Palette (Ctrl+K)
- 18 commands across 6 groups: Chat, Navigation, Mode, Tools, Workspace, Model
- Quick access to all features via keyboard
- Fuzzy search across commands
- Keyboard shortcuts displayed for power users

### 📄 RAG Document Upload
- Upload text files (.txt, .md, .json, .csv, .ts, .js, .py, .html, .css, .yaml, .xml)
- Automatic text chunking (512 chars per chunk)
- Ask questions about your documents with AI-powered synthesis
- Drag & drop upload with file metadata display

### 📋 Prompt Templates
- 8 built-in templates: Code Review, Debug Error, API Design, Explain Concept, Write Documentation, Data Analysis, System Design, Creative Story
- `{{variable}}` placeholder substitution with dialog input
- Create custom templates with auto-detected variables
- Templates organized by category: Coding, Writing, Analysis, System, Creative

### 🔧 48 AI Tools (Function Calling)
Tools organized across 8 categories with risk levels and approval flows:

| Category | Tools |
|----------|-------|
| **Web & Search** (8) | web_search, url_fetch, web_scrape, api_call, dns_lookup, ssl_check, ping, port_scan |
| **File Operations** (8) | file_read, file_write, file_delete, file_list, file_search, file_diff, file_backup, file_watch |
| **Code & Dev** (8) | code_execute, code_format, code_lint, code_test, git_status, git_diff, git_log, npm_install |
| **System & Shell** (6) | shell_execute, process_list, process_kill, env_get, env_set, system_info |
| **AI & Data** (6) | image_generate, image_analyze, speech_to_text, text_to_speech, data_query, data_visualize |
| **Memory & Knowledge** (5) | memory_store, memory_search, memory_summarize, document_query, knowledge_graph |
| **Scheduling** (4) | schedule_task, schedule_list, notify, webhook_trigger |
| **Messaging** (3) | message_send, email_send, contact_search |

### 📡 Messaging Gateway
Connect ClawHub to your favorite messaging platforms:

| Platform | Features |
|----------|----------|
| **Telegram** | Bot integration, commands, DM pairing |
| **Discord** | Bot integration, DM + @mention, message chunking |
| **Slack** | Bolt integration, `/clawhub` slash command |
| **Signal** | Via signal-cli-rest-api, polling mode |
| **Home Assistant** | Webhook receiver, persistent notifications |

### 🏪 Agent Gallery
- 8 pre-built agent templates: Full-Stack Developer, Data Analyst, Security Auditor, Technical Writer, DevOps Engineer, UI/UX Designer, Research Assistant, API Architect
- One-click install to create swarm agents
- Search and filter by category
- Each template includes system prompt, tool list, rating, and downloads

### 📥 Export / Import System
- Selective data export: conversations, providers, model configs, workspaces, skills, memories, agents, cron jobs
- JSON format with version and timestamp
- Import with preview and confirmation dialog
- Upsert-based import (existing items updated, new items created)

### 💬 Chat + Agent System
- Full chat interface with infinite scroll
- Hermes-style agentic loop: **Thought → Action → Observation → Final Answer**
- Agent mode with shell command execution
- Soft-delete with restore for messages and conversations
- 4 prebuilt agents: **ClawHub Agent**, **Coder**, **Full-Stack**, **SysAdmin**

### 📁 Workspace Manager
- Create, switch, and delete persistent workspaces
- Each workspace has its own directory, config, and conversations
- Default workspace auto-created on first run

### ⏰ Cron Engine
- Create scheduled tasks with cron expressions
- Task types: Shell commands, API calls, Agent tasks, Model prompts
- Manual execution with one click
- Run history with success/failure tracking

### 🧠 Memory & Learning
- Long-term memory with 6 types: facts, preferences, context, summaries, patterns, reflections
- Daily reflection loop for self-improvement
- Conversation auto-summarization
- Memory search and retrieval

### 👤 User Profiles & Context Files
- **SOUL.md persona** — Define your AI's personality and behavior
- **Context Files** — Auto-loaded project context for every conversation
- **User Preferences** — Theme, language, default model, home directory
- Categories: project, persona, instructions, custom

### 🛡️ Security System
- **Command Approval** — Risk-level-based approval flow (low/medium/high)
- **DM Pairing** — Allowlist specific users per messaging platform
- **Rate Limiting** — Sliding window rate limiter per identifier
- **Container Isolation** — Docker detection for restricted operations
- **Input Sanitization** — XSS and injection prevention

### 📱 WhatsApp Integration (No Meta API!)
- Chat with ClawHub from WhatsApp
- Uses WhatsApp Web protocol via `whatsapp-web.js`
- Scan QR code once, session persists
- Commands: `/help`, `/agent`, `/chat`, `/model`, `/clear`, `/status`, `/providers`

### 🔔 Desktop Notifications
- Browser notification API integration
- In-app notification center with typed alerts (success/error/warning/info)
- Unread badge counter
- Agent completion and cron job result notifications

### 🖥️ System Inspector
- Real-time hardware detection (CPU, RAM, GPU)
- Performance recommendations based on hardware
- Model config inspector with auxiliary model tracking

### 🔌 31+ AI Providers
All Hermes-compatible providers:

| Category | Providers |
|----------|-----------|
| **Cloud API** | Anthropic, OpenRouter, Novita, AI Gateway, z.ai/GLM, Kimi, Arcee, GMI, MiniMax, DeepSeek, HuggingFace |
| **Chinese AI** | Alibaba Cloud, Xiaomi MiMo, Tencent TokenHub, OpenCode Zen/Go |
| **Google** | Gemini API, Gemini CLI, Gemini OAuth |
| **OAuth** | Nous Portal, OpenAI Codex, GitHub Copilot |
| **Local** | LM Studio, Ollama, vLLM, Kilo Code |
| **Custom** | Custom OpenAI-compatible endpoints |

### 🛡️ Agent Governance
- **God Mode**: Auto-approve all commands
- **Safe Mode**: Confirm destructive actions
- 24/7 Background Daemon for autonomous agents
- Per-agent approval settings

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+N` | New Chat |
| `Ctrl+,` | Open Settings |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+J` | Toggle Right Panel |
| `Ctrl+Enter` | Toggle Agent Mode |
| `Ctrl+Shift+/` | Keyboard Shortcuts Help |
| `Escape` | Close Dialog/Panel |

---

## 🏗️ Architecture

```
clawhub/
├── src/
│   ├── app/
│   │   ├── api/                    # 68+ API Routes
│   │   │   ├── chat/
│   │   │   │   ├── stream/         # Real LLM streaming (SSE)
│   │   │   │   ├── search/         # Web search
│   │   │   │   ├── image/          # Image generation
│   │   │   │   ├── compare/        # Model comparison
│   │   │   │   └── fallback/       # Model fallback chains
│   │   │   ├── conversations/      # Chat CRUD + branch + soft-delete
│   │   │   ├── messages/           # Message CRUD + soft-delete
│   │   │   ├── models/             # ModelConfig CRUD
│   │   │   ├── workspaces/         # Workspace CRUD
│   │   │   ├── cron/               # Cron CRUD + execute
│   │   │   ├── documents/          # RAG upload + query
│   │   │   ├── tokens/             # Token usage tracking
│   │   │   ├── tools/              # 48 tool definitions + execute
│   │   │   ├── context/            # Context compression
│   │   │   ├── insights/           # Usage insights analytics
│   │   │   ├── skills/             # Skills CRUD + execute + export
│   │   │   ├── security/           # Approval + DM pairing
│   │   │   ├── profile/            # User profile + SOUL.md
│   │   │   ├── context-files/      # Project context files
│   │   │   ├── status/             # App status dashboard
│   │   │   ├── messaging/          # Messaging platform status
│   │   │   ├── export/             # Data export
│   │   │   ├── import/             # Data import
│   │   │   ├── hardware/           # Hardware detection
│   │   │   ├── history/            # Soft-delete restore
│   │   │   ├── providers/          # Provider CRUD + model fetch
│   │   │   ├── mcp/                # MCP server management
│   │   │   ├── swarm/              # Agent swarm management
│   │   │   ├── memory/             # Long-term memory
│   │   │   ├── reflections/        # Agent self-improvement
│   │   │   ├── plugins/            # Plugin management
│   │   │   ├── settings/           # App settings
│   │   │   ├── whatsapp/           # WhatsApp bridge proxy
│   │   │   └── agent/              # Shell exec + file ops
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AppLayout.tsx            # Three-panel layout
│   │   │   ├── Sidebar.tsx              # 6-tab sidebar
│   │   │   ├── ChatWindow.tsx           # Scrollable chat + branching
│   │   │   ├── MessageBubble.tsx        # Markdown + syntax highlighting
│   │   │   ├── InputBar.tsx             # Streaming input + slash commands
│   │   │   ├── ModelSelector.tsx        # Model dropdown
│   │   │   ├── RightPanel.tsx           # 10-tab inspector
│   │   │   ├── SettingsDialog.tsx       # 6-tab settings
│   │   │   ├── CommandPalette.tsx       # Ctrl+K command palette
│   │   │   ├── TokenUsagePanel.tsx      # Token/cost dashboard
│   │   │   ├── ImageGenerationPanel.tsx # AI image generation
│   │   │   ├── WebSearchPanel.tsx       # Web search results
│   │   │   ├── ModelComparisonPanel.tsx # Side-by-side comparison
│   │   │   ├── DocumentsPanel.tsx       # RAG upload + query
│   │   │   ├── PromptTemplatesPanel.tsx # Template library
│   │   │   ├── ExportImportPanel.tsx    # Data backup/restore
│   │   │   ├── NotificationCenter.tsx   # Desktop notifications
│   │   │   ├── AgentGallery.tsx         # Agent marketplace
│   │   │   ├── SecurityPanel.tsx        # Security & approval
│   │   │   ├── ProfilePanel.tsx         # User profile + SOUL.md
│   │   │   ├── ContextFilesPanel.tsx    # Project context files
│   │   │   ├── KeyboardShortcutsDialog.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── WhatsAppPanel.tsx
│   │   └── ui/                      # 45+ shadcn/ui components
│   └── lib/
│       ├── api.ts                    # API client + 31-provider registry
│       ├── db.ts                     # Prisma client
│       ├── security.ts              # Security middleware
│       ├── store.ts                  # Zustand state
│       ├── types.ts                  # TypeScript types
│       └── utils.ts
├── prisma/
│   ├── schema.prisma                 # 19 database models
│   └── seed.ts                       # 31 providers + 4 agents + 12 settings
├── mini-services/
│   ├── agent-ws/                     # WebSocket streaming (port 3003)
│   ├── whatsapp-bridge/              # WhatsApp Web bridge (port 3004)
│   └── messaging-gateway/            # Telegram, Discord, Slack, Signal, HA (port 3005)
├── Dockerfile                        # Multi-stage Docker build
├── docker-compose.yml                # Full stack deployment
├── docker-entrypoint.sh              # Auto DB setup + multi-service
├── install.sh                        # One-line installer (Linux/WSL/macOS)
├── install.ps1                       # One-line installer (Windows)
└── README.md
```

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root. See [`.env.example`](.env.example) for the full reference with 50+ variables.

Key variables:
```env
DATABASE_URL="file:./db/custom.db"

# AI Provider Keys
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GOOGLE_API_KEY=your-key
DEEPSEEK_API_KEY=your-key
OPENROUTER_API_KEY=your-key

# Messaging Gateway
MESSAGING_ENABLED=false
TELEGRAM_BOT_TOKEN=your-token
DISCORD_BOT_TOKEN=your-token

# WhatsApp Bridge
WHATTSAPP_ENABLED=false

# Auto-Update
AUTO_UPDATE_ENABLED=true
AUTO_UPDATE_INTERVAL_MINUTES=60
```

### Start the Application
```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm run build
npm start

# WhatsApp bridge (optional, separate terminal)
cd mini-services/whatsapp-bridge && npm start

# Agent WebSocket service (optional, separate terminal)
cd mini-services/agent-ws && npm start

# Messaging Gateway (optional, separate terminal)
cd mini-services/messaging-gateway && npm start
```

### Database Management
```bash
npx prisma db push      # Push schema changes
npx prisma generate     # Regenerate Prisma client
npx prisma studio       # Open database browser
npx tsx prisma/seed.ts  # Re-seed providers and agents
```

---

## 🚀 Deployment

### Docker
```bash
# Build and run with docker compose
docker compose up -d

# Or pull from GHCR
docker pull ghcr.io/rachidsabah/clawhub:latest
docker run -p 3000:3000 -p 3003:3003 -p 3004:3004 -p 3005:3005 ghcr.io/rachidsabah/clawhub:latest
```

### Production with Caddy
The included `Caddyfile` provides reverse proxy on port 81:
```bash
npm run build
caddy run
```

### WSL Specific Notes
- Ensure Node.js 20+ is installed: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`
- For WhatsApp bridge, Chromium is required: `sudo apt install -y chromium-browser`
- GPU passthrough for local models requires WSLg + proper drivers

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Credits

Built with:
- **Next.js 16** — React Framework
- **Prisma** — Database ORM
- **shadcn/ui** — UI Components
- **Zustand** — State Management
- **whatsapp-web.js** — WhatsApp Integration
- **z-ai-web-dev-sdk** — AI Streaming & Search
- **react-syntax-highlighter** — Code Highlighting
- **recharts** — Data Visualization
- **framer-motion** — Animations
- **Tailwind CSS 4** — Styling
- **Docker** — Container Deployment

---

<p align="center">
  <strong>INFOHAS ClawHub</strong> — AI Desktop Dashboard<br/>
  Multi-Model Orchestration • 48 Tools • Messaging Gateway • Auto-Update
</p>
