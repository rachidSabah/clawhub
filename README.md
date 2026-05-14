# INFOHAS ClawHub

> **AI Desktop Dashboard — Multi-Model Orchestration, Workspace Management & Cron Automation**

![ClawHub](https://img.shields.io/badge/INFOHAS-ClawHub-emerald?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20WSL%20%7C%20Linux-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 🚀 One-Line Install

### Linux / WSL / macOS
```bash
curl -fsSL https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.sh | bash
```

### Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/rachidSabah/clawhub/main/install.ps1 | iex
```

### Manual Install
```bash
git clone https://github.com/rachidSabah/clawhub.git
cd clawhub
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

---

## ✨ Features

### 🤖 Multi-Model Orchestration
- Configure primary + auxiliary models per task
- Context window management with auto-optimization
- Hardware-aware auto-configuration (CPU/RAM detection)
- Priority-based model routing
- Temperature, top-p, frequency/presence penalties per model

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
- Long-term memory with vector embedding placeholder
- Memory types: facts, preferences, context, summaries, patterns, reflections
- Daily reflection loop for self-improvement
- Conversation auto-summarization

### 📱 WhatsApp Integration (No Meta API!)
- Chat with ClawHub from WhatsApp
- Uses WhatsApp Web protocol via `whatsapp-web.js`
- Scan QR code once, session persists
- Commands: `/help`, `/agent`, `/chat`, `/model`, `/clear`, `/status`

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

---

## 📸 Screenshots

*Three-panel layout: Sidebar (Chats/Models/Workspaces/Cron/Agents) | Chat | Inspector*

---

## 🏗️ Architecture

```
clawhub/
├── src/
│   ├── app/
│   │   ├── api/           # 40+ API routes
│   │   │   ├── conversations/   # Chat CRUD + soft-delete
│   │   │   ├── messages/        # Message CRUD + soft-delete
│   │   │   ├── models/          # ModelConfig CRUD
│   │   │   ├── workspaces/      # Workspace CRUD
│   │   │   ├── cron/            # Cron CRUD + execute
│   │   │   ├── hardware/        # Hardware detection
│   │   │   ├── history/         # Soft-delete restore
│   │   │   ├── providers/       # Provider CRUD + model fetch
│   │   │   ├── mcp/             # MCP server management
│   │   │   ├── swarm/           # Agent swarm management
│   │   │   ├── memory/          # Long-term memory
│   │   │   ├── whatsapp/        # WhatsApp bridge proxy
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AppLayout.tsx     # Three-panel layout
│   │   │   ├── Sidebar.tsx       # 5-tab sidebar
│   │   │   ├── ChatWindow.tsx    # Scrollable chat
│   │   │   ├── MessageBubble.tsx # Role-based bubbles
│   │   │   ├── InputBar.tsx      # Chat input
│   │   │   ├── ModelSelector.tsx # Model dropdown
│   │   │   ├── RightPanel.tsx    # Inspector (Model + System)
│   │   │   ├── SettingsDialog.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── WhatsAppPanel.tsx
│   │   └── ui/                   # shadcn/ui components
│   └── lib/
│       ├── api.ts                # API client + provider registry
│       ├── db.ts                 # Prisma client
│       ├── store.ts              # Zustand state
│       ├── types.ts              # TypeScript types
│       └── utils.ts
├── prisma/
│   ├── schema.prisma             # 15 database models
│   └── seed.ts                   # Provider + agent seeding
├── mini-services/
│   ├── agent-ws/                 # WebSocket streaming (port 3003)
│   └── whatsapp-bridge/          # WhatsApp Web bridge (port 3004)
├── install.sh                    # One-line installer (Linux/WSL/macOS)
├── install.ps1                   # One-line installer (Windows)
└── README.md
```

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="file:./db/custom.db"
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key
GOOGLE_API_KEY=your-key
DEEPSEEK_API_KEY=your-key
OPENROUTER_API_KEY=your-key
```

### Start the Application
```bash
# Main application
npm run dev

# WhatsApp bridge (optional)
cd mini-services/whatsapp-bridge && npm start

# Agent WebSocket service
cd mini-services/agent-ws && npm start
```

---

## 🚀 Deployment

### Docker (Coming Soon)
```bash
docker pull ghcr.io/rachidsabah/clawhub:latest
docker run -p 3000:3000 -p 3003:3003 -p 3004:3004 clawhub
```

### Production Build
```bash
npm run build
npm start
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
- **Tailwind CSS** — Styling

---

<p align="center">
  <strong>INFOHAS ClawHub</strong> — AI Desktop Dashboard<br/>
  Multi-Model Orchestration • Workspace Management • Cron Automation
</p>
