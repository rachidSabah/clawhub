# INFOHAS ClawHub

> **AI Desktop Dashboard — Multi-Model Orchestration, RAG, Agent Gallery & Cron Automation**

![ClawHub](https://img.shields.io/badge/INFOHAS-ClawHub-emerald?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20WSL%20%7C%20Linux%20%7C%20macOS-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![API Routes](https://img.shields.io/badge/API_Routes-58-orange?style=flat-square)
![Providers](https://img.shields.io/badge/AI_Providers-31+-purple?style=flat-square)

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
- Installs all npm dependencies
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

## ✨ Features

### 🤖 Real AI Streaming
- Live streaming chat responses via z-ai-web-dev-sdk
- SSE (Server-Sent Events) for real-time token delivery
- Fallback to simulated responses when no provider is configured
- Message history context sent with each request for multi-turn conversations

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
- Conversation-level usage filtering

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

### 🔧 Tool Use / Function Calling
- 10 built-in tools: web_search, code_execute, file_read, file_write, image_generate, memory_store, memory_search, document_query, shell_execute, schedule_task
- Sandboxed code execution (Python, JavaScript, TypeScript)
- Tool configuration in Settings with Safe Mode approval
- Tools available to all agent conversations

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
│   │   ├── api/                    # 58 API Routes
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
│   │   │   ├── tools/              # Tool definitions + execute
│   │   │   ├── export/             # Data export
│   │   │   ├── import/             # Data import
│   │   │   ├── hardware/           # Hardware detection
│   │   │   ├── history/            # Soft-delete restore
│   │   │   ├── providers/          # Provider CRUD + model fetch
│   │   │   ├── mcp/                # MCP server management
│   │   │   ├── swarm/              # Agent swarm management
│   │   │   ├── memory/             # Long-term memory
│   │   │   ├── reflections/        # Agent self-improvement
│   │   │   ├── skills/             # Skills CRUD + export
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
│   │   │   ├── InputBar.tsx             # Real LLM streaming input
│   │   │   ├── ModelSelector.tsx        # Model dropdown
│   │   │   ├── RightPanel.tsx           # 7-tab inspector
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
│   │   │   ├── KeyboardShortcutsDialog.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── WhatsAppPanel.tsx
│   │   └── ui/                      # 45+ shadcn/ui components
│   └── lib/
│       ├── api.ts                    # API client + 31-provider registry
│       ├── db.ts                     # Prisma client
│       ├── store.ts                  # Zustand state
│       ├── types.ts                  # TypeScript types
│       └── utils.ts
├── prisma/
│   ├── schema.prisma                 # 15 database models
│   └── seed.ts                       # 31 providers + 4 agents + 12 settings
├── mini-services/
│   ├── agent-ws/                     # WebSocket streaming (port 3003)
│   └── whatsapp-bridge/              # WhatsApp Web bridge (port 3004)
├── install.sh                        # One-line installer (Linux/WSL/macOS)
├── install.ps1                       # One-line installer (Windows)
└── README.md
```

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="file:./db/custom.db"

# Add your AI provider keys here
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GOOGLE_API_KEY=your-key
DEEPSEEK_API_KEY=your-key
OPENROUTER_API_KEY=your-key
HF_TOKEN=your-key
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

### Docker (Coming Soon)
```bash
docker pull ghcr.io/rachidsabah/clawhub:latest
docker run -p 3000:3000 -p 3003:3003 -p 3004:3004 clawhub
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

## 🔄 Updating

Re-run the one-line installer to update to the latest version:

```bash
# Linux/WSL/macOS
curl -fsSL https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.sh | bash

# Windows PowerShell
irm https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.ps1 | iex
```

The installer will detect your existing installation and pull the latest changes.

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

---

<p align="center">
  <strong>INFOHAS ClawHub</strong> — AI Desktop Dashboard<br/>
  Multi-Model Orchestration • RAG • Agent Gallery • Cron Automation
</p>
