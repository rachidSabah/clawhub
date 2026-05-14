// ============================================================================
// INFOHAS ClawHub — API Client
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
  ModelConfig,
  Workspace,
  CronJob,
  HardwareProfile,
  SecurityApproval,
  PendingApproval,
  DmPairing,
  DmPlatform,
  UserProfile,
  ContextFile,
  ContextFileCategory,
  ActiveContext,
  ToolDefinition,
  ToolExecutionResult,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API error ${res.status} ${res.statusText}${body ? `: ${body}` : ''}`)
  }
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
  workspaceId?: string
}): Promise<Conversation> {
  return request<Conversation>('/api/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchConversation(id: string): Promise<Conversation> {
  return request<Conversation>(`/api/conversations/${id}`)
}

export async function updateConversation(id: string, data: Partial<Conversation>): Promise<Conversation> {
  return request<Conversation>(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteConversation(id: string): Promise<void> {
  return request<void>(`/api/conversations/${id}`, { method: 'DELETE' })
}

export async function branchConversation(conversationId: string, messageId: string): Promise<Conversation> {
  return request<Conversation>(`/api/conversations/${conversationId}/branch`, {
    method: 'POST',
    body: JSON.stringify({ messageId }),
  })
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  return request<Message[]>(`/api/conversations/${conversationId}/messages`)
}

export async function createMessage(conversationId: string, data: { role: MessageRole; content: string; metadata?: string }): Promise<Message> {
  return request<Message>(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteMessage(id: string): Promise<void> {
  return request<void>(`/api/messages/${id}`, { method: 'DELETE' })
}

export async function updateMessage(id: string, data: Partial<Message>): Promise<Message> {
  return request<Message>(`/api/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export async function fetchProviders(): Promise<Provider[]> {
  return request<Provider[]>('/api/providers')
}

export async function createProvider(data: { name: string; type: ProviderType; baseUrl?: string; apiKey?: string; isDefault?: boolean }): Promise<Provider> {
  return request<Provider>('/api/providers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProvider(id: string, data: Partial<Provider>): Promise<Provider> {
  return request<Provider>(`/api/providers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteProvider(id: string): Promise<void> {
  return request<void>(`/api/providers/${id}`, { method: 'DELETE' })
}

export async function fetchProviderModels(id: string): Promise<any> {
  return request<any>(`/api/providers/${id}/models`)
}

// ---------------------------------------------------------------------------
// Model Configs
// ---------------------------------------------------------------------------

export async function fetchModelConfigs(): Promise<ModelConfig[]> {
  return request<ModelConfig[]>('/api/models')
}

export async function createModelConfig(data: Partial<ModelConfig>): Promise<ModelConfig> {
  return request<ModelConfig>('/api/models', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateModelConfig(id: string, data: Partial<ModelConfig>): Promise<ModelConfig> {
  return request<ModelConfig>(`/api/models/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteModelConfig(id: string): Promise<void> {
  return request<void>(`/api/models/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

export async function fetchWorkspaces(): Promise<Workspace[]> {
  return request<Workspace[]>('/api/workspaces')
}

export async function createWorkspace(data: Partial<Workspace>): Promise<Workspace> {
  return request<Workspace>('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
  return request<Workspace>(`/api/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteWorkspace(id: string): Promise<void> {
  return request<void>(`/api/workspaces/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Cron Jobs
// ---------------------------------------------------------------------------

export async function fetchCronJobs(): Promise<CronJob[]> {
  return request<CronJob[]>('/api/cron')
}

export async function createCronJob(data: Partial<CronJob>): Promise<CronJob> {
  return request<CronJob>('/api/cron', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCronJob(id: string, data: Partial<CronJob>): Promise<CronJob> {
  return request<CronJob>(`/api/cron/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteCronJob(id: string): Promise<void> {
  return request<void>(`/api/cron/${id}`, { method: 'DELETE' })
}

export async function executeCronJob(id: string): Promise<any> {
  return request<any>(`/api/cron/${id}/execute`, { method: 'POST' })
}

// ---------------------------------------------------------------------------
// Hardware
// ---------------------------------------------------------------------------

export async function fetchHardwareProfile(): Promise<any> {
  return request<any>('/api/hardware')
}

// ---------------------------------------------------------------------------
// History (soft-deleted items)
// ---------------------------------------------------------------------------

export async function fetchDeletedHistory(): Promise<any> {
  return request<any>('/api/history')
}

export async function restoreDeletedItem(type: 'conversation' | 'message', id: string): Promise<any> {
  return request<any>('/api/history/restore', {
    method: 'POST',
    body: JSON.stringify({ type, id }),
  })
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function fetchSettings(): Promise<AppSettings> {
  return request<AppSettings>('/api/settings')
}

export async function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  return request<AppSettings>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export async function fetchSkills(): Promise<Skill[]> {
  return request<Skill[]>('/api/skills')
}

export async function createSkill(data: { name: string; description?: string; content: string; category?: string; fileName?: string }): Promise<Skill> {
  return request<Skill>('/api/skills', { method: 'POST', body: JSON.stringify(data) })
}

export async function updateSkill(id: string, data: Partial<Skill>): Promise<Skill> {
  return request<Skill>(`/api/skills/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function deleteSkill(id: string): Promise<void> {
  return request<void>(`/api/skills/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

export async function fetchPlugins(): Promise<Plugin[]> {
  return request<Plugin[]>('/api/plugins')
}

export async function createPlugin(data: Partial<Plugin>): Promise<Plugin> {
  return request<Plugin>('/api/plugins', { method: 'POST', body: JSON.stringify(data) })
}

export async function deletePlugin(id: string): Promise<void> {
  return request<void>(`/api/plugins/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------

export async function fetchMemories(type?: string): Promise<Memory[]> {
  const url = type ? `/api/memory?type=${encodeURIComponent(type)}` : '/api/memory'
  return request<Memory[]>(url)
}

export async function createMemory(data: { type: MemoryType; key?: string; content: string; source?: string; relevance?: number }): Promise<Memory> {
  return request<Memory>('/api/memory', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteMemory(id: string): Promise<void> {
  return request<void>(`/api/memory/${id}`, { method: 'DELETE' })
}

export async function searchMemories(query: string, type?: string, limit?: number): Promise<Memory[]> {
  const params = new URLSearchParams({ query })
  if (type) params.set('type', type)
  if (limit !== undefined) params.set('limit', String(limit))
  return request<Memory[]>(`/api/memory/search?${params.toString()}`)
}

// ---------------------------------------------------------------------------
// Hermes Provider Registry
// ---------------------------------------------------------------------------

export const HERMES_PROVIDERS: HermesProviderDef[] = [
  { type: 'nous-portal', label: 'Nous Portal', description: 'OAuth, subscription-based', authType: 'oauth' },
  { type: 'openai-codex', label: 'OpenAI Codex', description: 'ChatGPT OAuth, uses Codex models', authType: 'oauth' },
  { type: 'github-copilot', label: 'GitHub Copilot', description: 'OAuth device code flow', authType: 'device-code', envVar: 'COPILOT_GITHUB_TOKEN' },
  { type: 'github-copilot-acp', label: 'GitHub Copilot ACP', description: 'Spawns local copilot --acp --stdio', authType: 'cli' },
  { type: 'anthropic', label: 'Anthropic', description: 'Claude API', authType: 'api-key', envVar: 'ANTHROPIC_API_KEY', defaultBaseUrl: 'https://api.anthropic.com/v1' },
  { type: 'openrouter', label: 'OpenRouter', description: 'Multi-model router', authType: 'api-key', envVar: 'OPENROUTER_API_KEY', defaultBaseUrl: 'https://openrouter.ai/api/v1' },
  { type: 'novita', label: 'NovitaAI', description: '200+ models', authType: 'api-key', envVar: 'NOVITA_API_KEY' },
  { type: 'ai-gateway', label: 'AI Gateway', description: 'AI Gateway API', authType: 'api-key', envVar: 'AI_GATEWAY_API_KEY' },
  { type: 'zai', label: 'z.ai / GLM', description: 'GLM API', authType: 'api-key', envVar: 'GLM_API_KEY' },
  { type: 'kimi', label: 'Kimi / Moonshot', description: 'Kimi API', authType: 'api-key', envVar: 'KIMI_API_KEY' },
  { type: 'kimi-cn', label: 'Kimi China', description: 'Kimi China endpoint', authType: 'api-key', envVar: 'KIMI_CN_API_KEY' },
  { type: 'arcee', label: 'Arcee AI', description: 'Arcee AI API', authType: 'api-key', envVar: 'ARCEEAI_API_KEY' },
  { type: 'gmi', label: 'GMI Cloud', description: 'GMI API', authType: 'api-key', envVar: 'GMI_API_KEY' },
  { type: 'minimax', label: 'MiniMax', description: 'MiniMax API', authType: 'api-key', envVar: 'MINIMAX_API_KEY' },
  { type: 'minimax-cn', label: 'MiniMax China', description: 'MiniMax China endpoint', authType: 'api-key', envVar: 'MINIMAX_CN_API_KEY' },
  { type: 'alibaba', label: 'Alibaba Cloud', description: 'Dashscope API', authType: 'api-key', envVar: 'DASHSCOPE_API_KEY' },
  { type: 'alibaba-coding', label: 'Alibaba Coding Plan', description: 'Separate billing', authType: 'api-key', envVar: 'DASHSCOPE_API_KEY' },
  { type: 'kilocode', label: 'Kilo Code', description: 'Kilo Code API', authType: 'api-key', envVar: 'KILOCODE_API_KEY' },
  { type: 'xiaomi', label: 'Xiaomi MiMo', description: 'Xiaomi MiMo API', authType: 'api-key', envVar: 'XIAOMI_API_KEY' },
  { type: 'tencent-tokenhub', label: 'Tencent TokenHub', description: 'Tencent MaaS API', authType: 'api-key', envVar: 'TOKENHUB_API_KEY' },
  { type: 'opencode-zen', label: 'OpenCode Zen', description: 'OpenCode Zen API', authType: 'api-key', envVar: 'OPENCODE_ZEN_API_KEY' },
  { type: 'opencode-go', label: 'OpenCode Go', description: 'OpenCode Go API', authType: 'api-key', envVar: 'OPENCODE_GO_API_KEY' },
  { type: 'deepseek', label: 'DeepSeek', description: 'DeepSeek API', authType: 'api-key', envVar: 'DEEPSEEK_API_KEY', defaultBaseUrl: 'https://api.deepseek.com/v1' },
  { type: 'huggingface', label: 'Hugging Face', description: 'HF Inference API', authType: 'api-key', envVar: 'HF_TOKEN' },
  { type: 'gemini', label: 'Google Gemini', description: 'Gemini API', authType: 'api-key', envVar: 'GOOGLE_API_KEY', defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  { type: 'gemini-cli', label: 'Gemini CLI', description: 'Local Gemini CLI', authType: 'cli' },
  { type: 'gemini-oauth', label: 'Google Gemini (OAuth)', description: 'Free tier, browser PKCE', authType: 'oauth' },
  { type: 'lmstudio', label: 'LM Studio', description: 'Local LM Studio', authType: 'api-key', defaultBaseUrl: 'http://localhost:1234/v1', envVar: 'LM_API_KEY' },
  { type: 'ollama', label: 'Ollama', description: 'Local Ollama', authType: 'api-key', defaultBaseUrl: 'http://localhost:11434', envVar: 'LM_API_KEY' },
  { type: 'vllm', label: 'vLLM', description: 'Self-hosted vLLM', authType: 'api-key' },
  { type: 'custom', label: 'Custom Endpoint', description: 'Custom OpenAI-compatible', authType: 'api-key' },
]

// ---------------------------------------------------------------------------
// MCP
// ---------------------------------------------------------------------------

export async function fetchMcpServers(): Promise<McpServer[]> {
  return request<McpServer[]>('/api/mcp')
}

export async function createMcpServer(data: Partial<McpServer>): Promise<McpServer> {
  return request<McpServer>('/api/mcp', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteMcpServer(id: string): Promise<void> {
  return request<void>(`/api/mcp/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Swarm
// ---------------------------------------------------------------------------

export async function fetchSwarmAgents(): Promise<AgentSwarm[]> {
  return request<AgentSwarm[]>('/api/swarm')
}

export async function createSwarmAgent(data: Partial<AgentSwarm>): Promise<AgentSwarm> {
  return request<AgentSwarm>('/api/swarm', { method: 'POST', body: JSON.stringify(data) })
}

export async function startSwarmAgent(id: string, task: string): Promise<AgentSwarm> {
  return request<AgentSwarm>(`/api/swarm/${id}/start`, { method: 'POST', body: JSON.stringify({ task }) })
}

export async function stopSwarmAgent(id: string): Promise<AgentSwarm> {
  return request<AgentSwarm>(`/api/swarm/${id}/stop`, { method: 'POST' })
}

export async function deleteSwarmAgent(id: string): Promise<void> {
  return request<void>(`/api/swarm/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// Reflections
// ---------------------------------------------------------------------------

export async function fetchReflections(): Promise<ReflectionLog[]> {
  return request<ReflectionLog[]>('/api/reflections')
}

export async function triggerDailyReflection(): Promise<ReflectionLog[]> {
  return request<ReflectionLog[]>('/api/reflections/daily', { method: 'POST' })
}

// ---------------------------------------------------------------------------
// Security — Approval
// ---------------------------------------------------------------------------

export async function approveSecurityAction(actionId: string, approved: boolean): Promise<{ status: string }> {
  return request<{ status: string }>('/api/security/approve', {
    method: 'POST',
    body: JSON.stringify({ actionId, approved }),
  })
}

export async function fetchPendingApprovals(): Promise<{ pending: PendingApproval[] }> {
  return request<{ pending: PendingApproval[] }>('/api/security/pending')
}

// ---------------------------------------------------------------------------
// Security — DM Pairing
// ---------------------------------------------------------------------------

export async function fetchDmPairings(): Promise<{ pairings: DmPairing[] }> {
  return request<{ pairings: DmPairing[] }>('/api/security/dm-pairing')
}

export async function pairDmUser(platform: DmPlatform, userId: string, displayName?: string): Promise<{ paired: boolean; userId: string }> {
  return request<{ paired: boolean; userId: string }>('/api/security/dm-pairing', {
    method: 'POST',
    body: JSON.stringify({ platform, userId, displayName }),
  })
}

export async function unpairDmUser(platform: DmPlatform, userId: string): Promise<{ removed: boolean }> {
  return request<{ removed: boolean }>('/api/security/dm-pairing', {
    method: 'DELETE',
    body: JSON.stringify({ platform, userId }),
  })
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export async function fetchUserProfile(): Promise<{ profile: UserProfile }> {
  return request<{ profile: UserProfile }>('/api/profile')
}

export async function updateUserProfile(data: {
  name?: string
  preferences?: Record<string, unknown>
  soulMd?: string
  homeDir?: string
  contextFiles?: string[]
}): Promise<{ profile: UserProfile }> {
  return request<{ profile: UserProfile }>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------------------------------
// Context Files
// ---------------------------------------------------------------------------

export async function fetchContextFiles(): Promise<{ files: ContextFile[] }> {
  return request<{ files: ContextFile[] }>('/api/context-files')
}

export async function createContextFile(data: {
  name: string
  path: string
  content: string
  category?: ContextFileCategory
  autoLoad?: boolean
}): Promise<{ file: ContextFile }> {
  return request<{ file: ContextFile }>('/api/context-files', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateContextFile(id: string, data: Partial<ContextFile>): Promise<{ file: ContextFile }> {
  return request<{ file: ContextFile }>(`/api/context-files/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteContextFile(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/context-files/${id}`, { method: 'DELETE' })
}

export async function fetchActiveContext(): Promise<ActiveContext> {
  return request<ActiveContext>('/api/context-files/active')
}

// ---------------------------------------------------------------------------
// Tools (expanded)
// ---------------------------------------------------------------------------

export async function fetchTools(): Promise<{ tools: ToolDefinition[]; count: number }> {
  return request<{ tools: ToolDefinition[]; count: number }>('/api/tools')
}

export async function executeTool(
  tool: string,
  parameters: Record<string, unknown>,
  options?: { workspaceId?: string; autoApprove?: boolean }
): Promise<ToolExecutionResult> {
  return request<ToolExecutionResult>('/api/tools/execute', {
    method: 'POST',
    body: JSON.stringify({ tool, parameters, ...options }),
  })
}

// ---------------------------------------------------------------------------
// Slash Command APIs
// ---------------------------------------------------------------------------

export async function compressContext(conversationId: string, maxMessages = 20): Promise<any> {
  return request<any>('/api/context/compress', {
    method: 'POST',
    body: JSON.stringify({ conversationId, maxMessages }),
  })
}

export async function fetchInsights(days = 7): Promise<any> {
  return request<any>(`/api/insights?days=${days}`)
}

export async function executeSkill(name: string, input = ''): Promise<any> {
  return request<any>('/api/skills/execute', {
    method: 'POST',
    body: JSON.stringify({ name, input }),
  })
}

export async function fetchAppStatus(): Promise<any> {
  return request<any>('/api/status')
}

export async function fetchMessagingStatus(): Promise<any> {
  return request<any>('/api/messaging/status')
}

export async function setHomeDir(path: string): Promise<AppSettings> {
  return request<AppSettings>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify({ agentWorkspaceDir: path }),
  })
}

// ---------------------------------------------------------------------------
// Auto-Update
// ---------------------------------------------------------------------------

export async function checkForUpdates(): Promise<{
  currentVersion: string
  currentCommit?: string
  remoteCommit?: string
  remoteVersion?: string
  remoteMessage?: string
  remoteDate?: string
  updateAvailable: boolean
  latestRelease?: { tag: string; name: string; url: string; publishedAt: string } | null
  lastCheckedAt: string
}> {
  return request('/api/updates/check')
}

export async function applyUpdate(autoRestart = true): Promise<{
  status: string
  message: string
  updateLog: string[]
}> {
  return request('/api/updates/apply', {
    method: 'POST',
    body: JSON.stringify({ autoRestart }),
  })
}

export async function fetchUpdateStatus(): Promise<{
  autoUpdateEnabled: boolean
  checkIntervalMinutes: number
  lastAutoCheckAt: string | null
  nextAutoCheckAt: string | null
  updateAvailable: boolean
  remoteCommit: string
  remoteMessage: string
  remoteDate: string
  backgroundCheckerRunning: boolean
}> {
  return request('/api/updates/status')
}

export async function updateAutoUpdateSettings(data: {
  autoUpdateEnabled?: boolean
  checkIntervalMinutes?: number
}): Promise<{
  autoUpdateEnabled: boolean
  checkIntervalMinutes: number
  message: string
}> {
  return request('/api/updates/status', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------------------------------
// Environment Settings (.env file read/write from Dashboard)
// ---------------------------------------------------------------------------

export interface EnvEntry {
  value: string
  masked: boolean
  source: 'file' | 'runtime' | 'default'
}

export interface EnvSettingsResponse {
  env: Record<string, EnvEntry>
  categories: Record<string, string[]>
  restartRequired: boolean
}

export async function fetchEnvSettings(): Promise<EnvSettingsResponse> {
  return request<EnvSettingsResponse>('/api/settings/env')
}

export async function updateEnvSettings(updates: Record<string, string>): Promise<{
  success: boolean
  message: string
  updatedKeys: string[]
  restartRequired: boolean
}> {
  return request('/api/settings/env', {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  })
}

// ---------------------------------------------------------------------------
// Service Management (start/stop mini-services from Dashboard)
// ---------------------------------------------------------------------------

export interface ServiceInfo {
  id: string
  name: string
  description: string
  port: number
  optional: boolean
  status: 'running' | 'starting' | 'stopped'
  pid: number | null
  directory: string
  startCommand: string
  dirExists: boolean
}

export async function fetchServices(): Promise<{
  services: ServiceInfo[]
  total: number
  running: number
  stopped: number
}> {
  return request('/api/services')
}

export async function serviceAction(
  serviceId: string,
  action: 'start' | 'stop' | 'restart' | 'start-all' | 'stop-all'
): Promise<{
  action: string
  serviceId?: string
  result?: string
  results?: Record<string, string>
}> {
  return request('/api/services', {
    method: 'POST',
    body: JSON.stringify({ serviceId, action }),
  })
}

// ---------------------------------------------------------------------------
// Database Management (Prisma operations from Dashboard)
// ---------------------------------------------------------------------------

export interface DbOperation {
  id: string
  name: string
  description: string
  command: string
  confirmRequired: boolean
  category: 'schema' | 'data' | 'tools'
}

export async function fetchDbOperations(): Promise<{
  operations: DbOperation[]
  database: { url: string; provider: string }
}> {
  return request('/api/database')
}

export async function executeDbOperation(
  operation: string,
  confirm = false
): Promise<{
  success: boolean
  operation: string
  name: string
  command: string
  stdout: string
  stderr: string
  exitCode?: number
}> {
  return request('/api/database', {
    method: 'POST',
    body: JSON.stringify({ operation, confirm }),
  })
}
