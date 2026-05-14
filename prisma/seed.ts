import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// All Hermes Agent compatible providers
const HERMES_PROVIDERS = [
  { name: 'Nous Portal', type: 'nous-portal', authType: 'oauth', description: 'OAuth, subscription-based' },
  { name: 'OpenAI Codex', type: 'openai-codex', authType: 'oauth', description: 'ChatGPT OAuth, uses Codex models' },
  { name: 'GitHub Copilot', type: 'github-copilot', authType: 'device-code', envVar: 'COPILOT_GITHUB_TOKEN', description: 'OAuth device code flow' },
  { name: 'GitHub Copilot ACP', type: 'github-copilot-acp', authType: 'cli', description: 'Spawns local copilot --acp --stdio' },
  { name: 'Anthropic', type: 'anthropic', authType: 'api-key', envVar: 'ANTHROPIC_API_KEY', baseUrl: 'https://api.anthropic.com/v1', description: 'Claude Max + extra usage credits via OAuth; also supports API key' },
  { name: 'OpenRouter', type: 'openrouter', authType: 'api-key', envVar: 'OPENROUTER_API_KEY', baseUrl: 'https://openrouter.ai/api/v1', description: 'Multi-model router' },
  { name: 'NovitaAI', type: 'novita', authType: 'api-key', envVar: 'NOVITA_API_KEY', description: '200+ models, Model API, Agent Sandbox, GPU Cloud' },
  { name: 'AI Gateway', type: 'ai-gateway', authType: 'api-key', envVar: 'AI_GATEWAY_API_KEY', description: 'AI Gateway API' },
  { name: 'z.ai / GLM', type: 'zai', authType: 'api-key', envVar: 'GLM_API_KEY', description: 'GLM API' },
  { name: 'Kimi / Moonshot', type: 'kimi', authType: 'api-key', envVar: 'KIMI_API_KEY', description: 'Kimi API' },
  { name: 'Kimi / Moonshot (China)', type: 'kimi-cn', authType: 'api-key', envVar: 'KIMI_CN_API_KEY', description: 'Kimi China endpoint' },
  { name: 'Arcee AI', type: 'arcee', authType: 'api-key', envVar: 'ARCEEAI_API_KEY', description: 'Arcee AI API' },
  { name: 'GMI Cloud', type: 'gmi', authType: 'api-key', envVar: 'GMI_API_KEY', description: 'GMI API' },
  { name: 'MiniMax', type: 'minimax', authType: 'api-key', envVar: 'MINIMAX_API_KEY', description: 'MiniMax API' },
  { name: 'MiniMax China', type: 'minimax-cn', authType: 'api-key', envVar: 'MINIMAX_CN_API_KEY', description: 'MiniMax China endpoint' },
  { name: 'Alibaba Cloud', type: 'alibaba', authType: 'api-key', envVar: 'DASHSCOPE_API_KEY', description: 'Dashscope API' },
  { name: 'Alibaba Coding Plan', type: 'alibaba-coding', authType: 'api-key', envVar: 'DASHSCOPE_API_KEY', description: 'Separate billing SKU, different endpoint' },
  { name: 'Kilo Code', type: 'kilocode', authType: 'api-key', envVar: 'KILOCODE_API_KEY', description: 'Kilo Code API' },
  { name: 'Xiaomi MiMo', type: 'xiaomi', authType: 'api-key', envVar: 'XIAOMI_API_KEY', description: 'Xiaomi MiMo API' },
  { name: 'Tencent TokenHub', type: 'tencent-tokenhub', authType: 'api-key', envVar: 'TOKENHUB_API_KEY', description: 'Tencent MaaS API' },
  { name: 'OpenCode Zen', type: 'opencode-zen', authType: 'api-key', envVar: 'OPENCODE_ZEN_API_KEY', description: 'OpenCode Zen API' },
  { name: 'OpenCode Go', type: 'opencode-go', authType: 'api-key', envVar: 'OPENCODE_GO_API_KEY', description: 'OpenCode Go API' },
  { name: 'DeepSeek', type: 'deepseek', authType: 'api-key', envVar: 'DEEPSEEK_API_KEY', baseUrl: 'https://api.deepseek.com/v1', description: 'DeepSeek API' },
  { name: 'Hugging Face', type: 'huggingface', authType: 'api-key', envVar: 'HF_TOKEN', description: 'HF Inference API' },
  { name: 'Google Gemini', type: 'gemini', authType: 'api-key', envVar: 'GOOGLE_API_KEY', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', description: 'Google Gemini API' },
  { name: 'Gemini CLI', type: 'gemini-cli', authType: 'cli', description: 'Local Gemini CLI installation', isDefault: true },
  { name: 'Google Gemini (OAuth)', type: 'gemini-oauth', authType: 'oauth', description: 'Free tier, browser PKCE login' },
  { name: 'LM Studio', type: 'lmstudio', authType: 'api-key', baseUrl: 'http://localhost:1234/v1', envVar: 'LM_API_KEY', description: 'Local LM Studio instance' },
  { name: 'Ollama', type: 'ollama', authType: 'api-key', baseUrl: 'http://localhost:11434', envVar: 'LM_API_KEY', description: 'Local Ollama instance' },
  { name: 'vLLM', type: 'vllm', authType: 'api-key', description: 'Self-hosted vLLM endpoint' },
  { name: 'Custom Endpoint', type: 'custom', authType: 'api-key', description: 'Custom OpenAI-compatible endpoint' },
]

// Prebuilt agent templates
const PREBUILT_AGENTS = [
  {
    name: 'Hermes Coder',
    role: 'coding',
    systemPrompt: `You are Hermes Coder, an elite autonomous coding agent. You have full access to the user's file system and terminal. Your capabilities include:

- Writing, reading, modifying, and deleting code files in any language
- Running shell commands to build, test, lint, and deploy code
- Debugging complex issues by reading logs and stack traces
- Refactoring code for better performance and maintainability
- Setting up new projects from scratch with proper tooling
- Installing and configuring dependencies and packages
- Writing and running tests (unit, integration, e2e)
- Git operations (commit, push, pull, branch, merge)

Always follow best practices: write clean, documented code; prefer existing well-tested libraries; validate inputs; handle errors gracefully. When making changes, explain your reasoning. Use the Thought → Action → Observation loop for complex tasks.`,
    isActive: true,
    isDaemon: false,
    maxIterations: 100,
    autoApprove: false,
  },
  {
    name: 'Hermes Full-Stack',
    role: 'fullstack',
    systemPrompt: `You are Hermes Full-Stack, an autonomous full-stack development agent. You specialize in building complete web applications from front to back. Your capabilities include:

- Frontend: React, Next.js, Vue, Svelte, Tailwind CSS, responsive design, accessibility
- Backend: Node.js, Python, Go, REST APIs, GraphQL, WebSockets, authentication
- Database: PostgreSQL, MySQL, MongoDB, SQLite, Prisma, Drizzle, migrations
- DevOps: Docker, CI/CD, Nginx, deployment to Vercel/Netlify/AWS/GCP
- Full project scaffolding with proper architecture and file structure
- API design, integration testing, performance optimization
- Real-time features, file uploads, email integration, payment processing

You build production-ready applications. Always consider security, scalability, and user experience. Use the Thought → Action → Observation loop for complex tasks.`,
    isActive: true,
    isDaemon: false,
    maxIterations: 100,
    autoApprove: false,
  },
  {
    name: 'Hermes SysAdmin',
    role: 'sysadmin',
    systemPrompt: `You are Hermes SysAdmin, an autonomous system administration agent. You have full access to the system shell and can perform any administrative task. Your capabilities include:

- System monitoring and diagnostics (CPU, RAM, disk, network)
- Package management (apt, yum, brew, npm, pip)
- User and permission management
- Service management (systemctl, pm2, docker)
- Network configuration and troubleshooting
- Firewall and security hardening
- Backup and disaster recovery
- Log analysis and anomaly detection
- Cron job and scheduled task management
- SSL/TLS certificate management
- Database administration (backup, restore, optimization)

Always verify commands before execution. Prefer least-privilege operations. Document all changes. Use the Thought → Action → Observation loop for complex tasks.`,
    isActive: true,
    isDaemon: false,
    maxIterations: 100,
    autoApprove: false,
  },
  {
    name: 'Hermes Agent',
    role: 'general',
    systemPrompt: `You are Hermes Agent, a fully autonomous AI with complete system access and the full capacity of your underlying model. You are the most capable agent in the Hermes ecosystem. Your capabilities are unlimited:

- All coding, full-stack development, and system administration tasks
- Research and analysis: web search, document analysis, data processing
- Creative tasks: writing, brainstorming, content creation
- File system operations: read, write, move, organize any files
- Terminal access: execute any command on the host system
- Multi-step reasoning and long-term planning
- Self-reflection and continuous improvement
- Memory: you can store and recall information across sessions
- MCP tool integration: use any connected MCP server tools
- Multi-agent coordination: delegate tasks to specialized agents

You operate in Thought → Action → Observation loops. Think carefully before acting. Always explain your reasoning. When uncertain, ask for clarification. You have God Mode capabilities but use them responsibly.`,
    isActive: true,
    isDaemon: false,
    maxIterations: 200,
    autoApprove: false,
  },
]

async function main() {
  console.log('Seeding Hermes providers...')

  // Create all providers
  for (const p of HERMES_PROVIDERS) {
    const existing = await prisma.provider.findFirst({
      where: { type: p.type },
    })

    if (existing) {
      console.log(`  Provider "${p.name}" (${p.type}) already exists, updating...`)
      await prisma.provider.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          authType: p.authType,
          envVar: p.envVar ?? null,
          baseUrl: p.baseUrl ?? null,
          isActive: true,
          isDefault: p.isDefault ?? false,
          providerConfig: JSON.stringify({ description: p.description }),
        },
      })
    } else {
      console.log(`  Creating provider "${p.name}" (${p.type})...`)
      await prisma.provider.create({
        data: {
          name: p.name,
          type: p.type,
          authType: p.authType,
          envVar: p.envVar ?? null,
          baseUrl: p.baseUrl ?? null,
          isActive: true,
          isDefault: p.isDefault ?? false,
          providerConfig: JSON.stringify({ description: p.description }),
        },
      })
    }
  }

  // Unset default for all non-Gemini-CLI providers if Gemini CLI is default
  const defaultProvider = await prisma.provider.findFirst({
    where: { type: 'gemini-cli', isDefault: true },
  })
  if (defaultProvider) {
    await prisma.provider.updateMany({
      where: { isDefault: true, id: { not: defaultProvider.id } },
      data: { isDefault: false },
    })
  }

  console.log('\nSeeding prebuilt agents...')

  // Create prebuilt agents
  for (const agent of PREBUILT_AGENTS) {
    const existing = await prisma.agentSwarm.findFirst({
      where: { name: agent.name },
    })

    if (existing) {
      console.log(`  Agent "${agent.name}" already exists, updating...`)
      await prisma.agentSwarm.update({
        where: { id: existing.id },
        data: {
          role: agent.role,
          systemPrompt: agent.systemPrompt,
          isActive: agent.isActive,
          isDaemon: agent.isDaemon,
          maxIterations: agent.maxIterations,
          autoApprove: agent.autoApprove,
        },
      })
    } else {
      console.log(`  Creating agent "${agent.name}"...`)
      await prisma.agentSwarm.create({
        data: agent,
      })
    }
  }

  // Create default settings
  const settingsDefaults = [
    { key: 'theme', value: 'system' },
    { key: 'agentAutoApprove', value: 'false' },
    { key: 'agentRequireConfirm', value: 'true' },
    { key: 'memoryEnabled', value: 'true' },
    { key: 'memoryMaxEntries', value: '10000' },
    { key: 'memoryAutoSummarize', value: 'true' },
    { key: 'reflectionEnabled', value: 'true' },
    { key: 'reflectionInterval', value: '60' },
    { key: 'daemonEnabled', value: 'false' },
    { key: 'godMode', value: 'false' },
    { key: 'whatsappEnabled', value: 'false' },
    { key: 'whatsappAutoReply', value: 'false' },
  ]

  for (const s of settingsDefaults) {
    const existing = await prisma.setting.findFirst({
      where: { key: s.key },
    })
    if (!existing) {
      await prisma.setting.create({ data: { key: s.key, value: s.value } })
    }
  }

  console.log('\nSeeding complete!')
  console.log(`  Providers: ${HERMES_PROVIDERS.length}`)
  console.log(`  Prebuilt Agents: ${PREBUILT_AGENTS.length}`)
  console.log(`  Settings: ${settingsDefaults.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
