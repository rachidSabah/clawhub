// ============================================================================
// AI Agent Dashboard — API Client
// ============================================================================

import type {
  Conversation,
  Message,
  MessageRole,
  Provider,
  ProviderType,
  ModelInfo,
  AppSettings,
  Skill,
  Plugin,
  Memory,
  MemoryType,
  HermesProviderDef,
  McpServer,
  McpTool,
  McpResource,
  AgentSwarm,
  ReflectionLog,
  ReflectionType,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrapper around fetch that throws on non‑2xx responses and returns parsed JSON. */
async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `API error ${res.status} ${res.statusText}${body ? `: ${body}` : ''}`,
    )
  }

  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as unknown as T

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function fetchConversations(): Promise<Conversation[]> {
  return request<Conversation[]>('/api/conversations')
}

export async function createConversation(data: {
  title?: string
  mode?: 'chat' | 'agent'
  provider?: string
  model?: string
  systemPrompt?: string
}): Promise<Conversation> {
  return request<Conversation>('/api/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchConversation(id: string): Promise<Conversation> {
  return request<Conversation>(`/api/conversations/${id}`)
}

export async function updateConversation(
  id: string,
  data: Partial<Conversation>,
): Promise<Conversation> {
  return request<Conversation>(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteConversation(id: string): Promise<void> {
  return request<void>(`/api/conversations/${id}`, {
    method: 'DELETE',
  })
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function fetchMessages(
  conversationId: string,
): Promise<Message[]> {
  return request<Message[]>(`/api/conversations/${conversationId}/messages`)
}

export async function createMessage(
  conversationId: string,
  data: { role: MessageRole; content: string; metadata?: string },
): Promise<Message> {
  return request<Message>(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export async function fetchProviders(): Promise<Provider[]> {
  return request<Provider[]>('/api/providers')
}

export async function createProvider(data: {
  name: string
  type: ProviderType
  baseUrl?: string
  apiKey?: string
  isDefault?: boolean
}): Promise<Provider> {
  return request<Provider>('/api/providers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProvider(
  id: string,
  data: Partial<Provider>,
): Promise<Provider> {
  return request<Provider>(`/api/providers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteProvider(id: string): Promise<void> {
  return request<void>(`/api/providers/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchProviderModels(id: string): Promise<ModelInfo[]> {
  return request<ModelInfo[]>(`/api/providers/${id}/models`)
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function fetchSettings(): Promise<AppSettings> {
  return request<AppSettings>('/api/settings')
}

export async function updateSettings(
  data: Partial<AppSettings>,
): Promise<AppSettings> {
  return request<AppSettings>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export async function executeCommand(
  command: string,
  workingDir?: string,
  timeout?: number,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return request<{ exitCode: number; stdout: string; stderr: string }>(
    '/api/agent/execute',
    {
      method: 'POST',
      body: JSON.stringify({ command, workingDir, timeout }),
    },
  )
}

export async function readFile(path: string): Promise<string> {
  return request<string>('/api/agent/read-file', {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
}

export async function writeFile(
  path: string,
  content: string,
): Promise<string> {
  return request<string>('/api/agent/write-file', {
    method: 'POST',
    body: JSON.stringify({ path, content }),
  })
}

export async function deleteFile(path: string): Promise<string> {
  return request<string>('/api/agent/delete-file', {
    method: 'POST',
    body: JSON.stringify({ path }),
  })
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export async function fetchSkills(): Promise<Skill[]> {
  return request<Skill[]>('/api/skills')
}

export async function createSkill(data: {
  name: string
  description?: string
  content: string
  category?: string
  fileName?: string
}): Promise<Skill> {
  return request<Skill>('/api/skills', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSkill(
  id: string,
  data: Partial<Skill>,
): Promise<Skill> {
  return request<Skill>(`/api/skills/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteSkill(id: string): Promise<void> {
  return request<void>(`/api/skills/${id}`, {
    method: 'DELETE',
  })
}

export async function exportSkill(id: string): Promise<Blob> {
  const res = await fetch('/api/skills/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  return res.blob()
}

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

export async function fetchPlugins(): Promise<Plugin[]> {
  return request<Plugin[]>('/api/plugins')
}

export async function createPlugin(data: {
  name: string
  description?: string
  version?: string
  author?: string
  repoUrl?: string
  entryPoint?: string
  config?: string
}): Promise<Plugin> {
  return request<Plugin>('/api/plugins', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePlugin(
  id: string,
  data: Partial<Plugin>,
): Promise<Plugin> {
  return request<Plugin>(`/api/plugins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deletePlugin(id: string): Promise<void> {
  return request<void>(`/api/plugins/${id}`, {
    method: 'DELETE',
  })
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

export async function fetchMemories(type?: string): Promise<Memory[]> {
  const url = type ? `/api/memory?type=${encodeURIComponent(type)}` : '/api/memory'
  return request<Memory[]>(url)
}

export async function createMemory(data: {
  type: MemoryType
  key?: string
  content: string
  source?: string
  relevance?: number
}): Promise<Memory> {
  return request<Memory>('/api/memory', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteMemory(id: string): Promise<void> {
  return request<void>(`/api/memory/${id}`, {
    method: 'DELETE',
  })
}

export async function searchMemories(
  query: string,
  type?: string,
  limit?: number,
): Promise<Memory[]> {
  const params = new URLSearchParams({ query })
  if (type) params.set('type', type)
  if (limit !== undefined) params.set('limit', String(limit))
  return request<Memory[]>(`/api/memory/search?${params.toString()}`)
}

export async function summarizeConversation(
  conversationId: string,
): Promise<Memory[]> {
  return request<Memory[]>('/api/memory/summarize', {
    method: 'POST',
    body: JSON.stringify({ conversationId }),
  })
}

// ---------------------------------------------------------------------------
// Hermes Provider Registry
// ---------------------------------------------------------------------------

export const HERMES_PROVIDERS: HermesProviderDef[] = [
  { type: 'nous-portal', label: 'Nous Portal', description: 'OAuth, subscription-based', authType: 'oauth' },
  { type: 'openai-codex', label: 'OpenAI Codex', description: 'ChatGPT OAuth, uses Codex models', authType: 'oauth' },
  { type: 'github-copilot', label: 'GitHub Copilot', description: 'OAuth device code flow', authType: 'device-code', envVar: 'COPILOT_GITHUB_TOKEN' },
  { type: 'github-copilot-acp', label: 'GitHub Copilot ACP', description: 'Spawns local copilot --acp --stdio', authType: 'cli' },
  { type: 'anthropic', label: 'Anthropic', description: 'Claude Max + extra usage credits via OAuth; also supports API key', authType: 'api-key', envVar: 'ANTHROPIC_API_KEY', defaultBaseUrl: 'https://api.anthropic.com/v1' },
  { type: 'openrouter', label: 'OpenRouter', description: 'Multi-model router', authType: 'api-key', envVar: 'OPENROUTER_API_KEY', defaultBaseUrl: 'https://openrouter.ai/api/v1' },
  { type: 'novita', label: 'NovitaAI', description: '200+ models, Model API, Agent Sandbox, GPU Cloud', authType: 'api-key', envVar: 'NOVITA_API_KEY' },
  { type: 'ai-gateway', label: 'AI Gateway', description: 'AI Gateway API', authType: 'api-key', envVar: 'AI_GATEWAY_API_KEY' },
  { type: 'zai', label: 'z.ai / GLM', description: 'GLM API', authType: 'api-key', envVar: 'GLM_API_KEY' },
  { type: 'kimi', label: 'Kimi / Moonshot', description: 'Kimi API', authType: 'api-key', envVar: 'KIMI_API_KEY' },
  { type: 'kimi-cn', label: 'Kimi / Moonshot (China)', description: 'Kimi China endpoint', authType: 'api-key', envVar: 'KIMI_CN_API_KEY', aliases: ['kimi-cn', 'moonshot-cn'] },
  { type: 'arcee', label: 'Arcee AI', description: 'Arcee AI API', authType: 'api-key', envVar: 'ARCEEAI_API_KEY', aliases: ['arcee-ai', 'arceeai'] },
  { type: 'gmi', label: 'GMI Cloud', description: 'GMI API', authType: 'api-key', envVar: 'GMI_API_KEY', aliases: ['gmi-cloud', 'gmicloud'] },
  { type: 'minimax', label: 'MiniMax', description: 'MiniMax API', authType: 'api-key', envVar: 'MINIMAX_API_KEY' },
  { type: 'minimax-cn', label: 'MiniMax China', description: 'MiniMax China endpoint', authType: 'api-key', envVar: 'MINIMAX_CN_API_KEY' },
  { type: 'alibaba', label: 'Alibaba Cloud', description: 'Dashscope API', authType: 'api-key', envVar: 'DASHSCOPE_API_KEY' },
  { type: 'alibaba-coding', label: 'Alibaba Coding Plan', description: 'Separate billing SKU, different endpoint', authType: 'api-key', envVar: 'DASHSCOPE_API_KEY', aliases: ['alibaba_coding'] },
  { type: 'kilocode', label: 'Kilo Code', description: 'Kilo Code API', authType: 'api-key', envVar: 'KILOCODE_API_KEY' },
  { type: 'xiaomi', label: 'Xiaomi MiMo', description: 'Xiaomi MiMo API', authType: 'api-key', envVar: 'XIAOMI_API_KEY', aliases: ['mimo', 'xiaomi-mimo'] },
  { type: 'tencent-tokenhub', label: 'Tencent TokenHub', description: 'Tencent MaaS API', authType: 'api-key', envVar: 'TOKENHUB_API_KEY', aliases: ['tencent', 'tokenhub', 'tencentmaas'] },
  { type: 'opencode-zen', label: 'OpenCode Zen', description: 'OpenCode Zen API', authType: 'api-key', envVar: 'OPENCODE_ZEN_API_KEY' },
  { type: 'opencode-go', label: 'OpenCode Go', description: 'OpenCode Go API', authType: 'api-key', envVar: 'OPENCODE_GO_API_KEY' },
  { type: 'deepseek', label: 'DeepSeek', description: 'DeepSeek API', authType: 'api-key', envVar: 'DEEPSEEK_API_KEY', defaultBaseUrl: 'https://api.deepseek.com/v1' },
  { type: 'huggingface', label: 'Hugging Face', description: 'HF Inference API', authType: 'api-key', envVar: 'HF_TOKEN', aliases: ['hf'] },
  { type: 'gemini', label: 'Google / Gemini', description: 'Google Gemini API', authType: 'api-key', envVar: 'GOOGLE_API_KEY', aliases: ['gemini-api'], defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  { type: 'gemini-cli', label: 'Gemini CLI', description: 'Local Gemini CLI installation', authType: 'cli' },
  { type: 'gemini-oauth', label: 'Google Gemini (OAuth)', description: 'Free tier, browser PKCE login', authType: 'oauth' },
  { type: 'lmstudio', label: 'LM Studio', description: 'Local LM Studio instance', authType: 'api-key', defaultBaseUrl: 'http://localhost:1234/v1', envVar: 'LM_API_KEY' },
  { type: 'ollama', label: 'Ollama', description: 'Local Ollama instance', authType: 'api-key', defaultBaseUrl: 'http://localhost:11434', envVar: 'LM_API_KEY' },
  { type: 'vllm', label: 'vLLM', description: 'Self-hosted vLLM endpoint', authType: 'api-key' },
  { type: 'custom', label: 'Custom Endpoint', description: 'Custom OpenAI-compatible endpoint', authType: 'api-key' },
]

// ---------------------------------------------------------------------------
// MCP Servers
// ---------------------------------------------------------------------------

export async function fetchMcpServers(): Promise<McpServer[]> {
  return request<McpServer[]>('/api/mcp')
}

export async function createMcpServer(data: {
  name: string
  command: string
  args?: string
  envVars?: string
  transportType?: string
  serverUrl?: string
  isActive?: boolean
}): Promise<McpServer> {
  return request<McpServer>('/api/mcp', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateMcpServer(
  id: string,
  data: Partial<McpServer>,
): Promise<McpServer> {
  return request<McpServer>(`/api/mcp-servers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteMcpServer(id: string): Promise<void> {
  return request<void>(`/api/mcp-servers/${id}`, {
    method: 'DELETE',
  })
}

export async function connectMcpServer(
  id: string,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/api/mcp-servers/${id}/connect`,
    { method: 'POST' },
  )
}

export async function disconnectMcpServer(
  id: string,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(
    `/api/mcp-servers/${id}/disconnect`,
    { method: 'POST' },
  )
}

export async function discoverMcpTools(
  id: string,
): Promise<{ tools: McpTool[]; resources: McpResource[] }> {
  return request<{ tools: McpTool[]; resources: McpResource[]}>(
    `/api/mcp-servers/${id}/discover`,
    { method: 'POST' },
  )
}

// ---------------------------------------------------------------------------
// Agent Swarm
// ---------------------------------------------------------------------------

export async function fetchSwarmAgents(): Promise<AgentSwarm[]> {
  return request<AgentSwarm[]>('/api/swarm')
}

export async function createSwarmAgent(data: {
  name: string
  role: string
  systemPrompt?: string
  providerId?: string
  model?: string
  workspaceDir?: string
  autoApprove?: boolean
  maxIterations?: number
  isDaemon?: boolean
}): Promise<AgentSwarm> {
  return request<AgentSwarm>('/api/swarm', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateSwarmAgent(
  id: string,
  data: Partial<AgentSwarm>,
): Promise<AgentSwarm> {
  return request<AgentSwarm>(`/api/swarm-agents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteSwarmAgent(id: string): Promise<void> {
  return request<void>(`/api/swarm-agents/${id}`, {
    method: 'DELETE',
  })
}

export async function startSwarmAgent(
  id: string,
  task: string,
): Promise<AgentSwarm> {
  return request<AgentSwarm>(`/api/swarm-agents/${id}/start`, {
    method: 'POST',
    body: JSON.stringify({ task }),
  })
}

export async function stopSwarmAgent(id: string): Promise<AgentSwarm> {
  return request<AgentSwarm>(`/api/swarm-agents/${id}/stop`, {
    method: 'POST',
  })
}

export async function stepSwarmAgent(
  id: string,
  data: {
    thought: string
    action: string
    actionInput: Record<string, any>
    observation: string
  },
): Promise<AgentSwarm> {
  return request<AgentSwarm>(`/api/swarm-agents/${id}/step`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------------------------------
// Reflections
// ---------------------------------------------------------------------------

export async function fetchReflections(
  agentId?: string,
  type?: string,
): Promise<ReflectionLog[]> {
  const params = new URLSearchParams()
  if (agentId) params.set('agentId', agentId)
  if (type) params.set('type', type)
  const qs = params.toString()
  return request<ReflectionLog[]>(`/api/reflections${qs ? `?${qs}` : ''}`)
}

export async function createReflection(data: {
  agentId?: string
  type: ReflectionType
  summary: string
  insights?: string
  actionItems?: string
  successRate?: number
}): Promise<ReflectionLog> {
  return request<ReflectionLog>('/api/reflections', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function triggerDailyReflection(): Promise<ReflectionLog[]> {
  return request<ReflectionLog[]>('/api/reflections/daily', {
    method: 'POST',
  })
}
