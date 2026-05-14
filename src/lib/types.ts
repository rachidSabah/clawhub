// ============================================================================
// AI Agent Dashboard — Shared TypeScript Types (Full MCP + Swarm + LTM)
// ============================================================================

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------
export interface Conversation {
  id: string
  title: string
  mode: 'chat' | 'agent' | 'swarm'
  provider?: string | null
  model?: string | null
  systemPrompt?: string | null
  isArchived: boolean
  createdAt: string
  updatedAt: string
  messages: Message[]
}

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------
export type MessageRole =
  | 'user'
  | 'assistant'
  | 'system'
  | 'agent-thought'
  | 'agent-action'
  | 'agent-observation'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  metadata?: string | null
  isStreaming: boolean
  createdAt: string
}

// ---------------------------------------------------------------------------
// Provider — All Hermes Agent compatible providers
// ---------------------------------------------------------------------------
export type ProviderType =
  | 'nous-portal'
  | 'openai-codex'
  | 'github-copilot'
  | 'github-copilot-acp'
  | 'anthropic'
  | 'openrouter'
  | 'novita'
  | 'ai-gateway'
  | 'zai'
  | 'kimi'
  | 'kimi-cn'
  | 'arcee'
  | 'gmi'
  | 'minimax'
  | 'minimax-cn'
  | 'alibaba'
  | 'alibaba-coding'
  | 'kilocode'
  | 'xiaomi'
  | 'tencent-tokenhub'
  | 'opencode-zen'
  | 'opencode-go'
  | 'deepseek'
  | 'huggingface'
  | 'gemini'
  | 'gemini-cli'
  | 'gemini-oauth'
  | 'lmstudio'
  | 'ollama'
  | 'vllm'
  | 'custom'
  | 'cli'

export type AuthType = 'api-key' | 'oauth' | 'cli' | 'device-code'

export interface Provider {
  id: string
  name: string
  type: ProviderType
  baseUrl?: string | null
  apiKey?: string | null
  envVar?: string | null
  isActive: boolean
  isDefault: boolean
  models?: string | null
  authType?: AuthType | null
  providerConfig?: string | null
  createdAt: string
  updatedAt: string
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
}

export interface HermesProviderDef {
  type: ProviderType
  label: string
  description: string
  authType: AuthType
  envVar?: string
  defaultBaseUrl?: string
  aliases?: string[]
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  defaultProvider?: string
  defaultModel?: string
  agentAutoApprove: boolean
  agentRequireConfirm: boolean
  agentWorkspaceDir?: string
  globalSystemPrompt?: string
  memoryEnabled: boolean
  memoryMaxEntries: number
  memoryAutoSummarize: boolean
  reflectionEnabled: boolean
  reflectionInterval: number // minutes between auto-reflections
  daemonEnabled: boolean // 24/7 background service
  godMode: boolean // auto-approve ALL shell commands
}

// ---------------------------------------------------------------------------
// Stream Events
// ---------------------------------------------------------------------------
export interface StreamEvent {
  type: 'start' | 'content' | 'error' | 'done'
  data: string
  exitCode?: number
  timestamp: string
}

export interface AgentStreamEvent {
  type: 'thought' | 'action' | 'observation' | 'stdout' | 'stderr' | 'stopped'
  data: string
  actionInput?: Record<string, unknown>
  timestamp: string
}

// ---------------------------------------------------------------------------
// File Attachment
// ---------------------------------------------------------------------------
export interface FileAttachment {
  id: string
  messageId?: string | null
  fileName: string
  filePath: string
  fileType?: string | null
  fileSize?: number | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Skill
// ---------------------------------------------------------------------------
export interface Skill {
  id: string
  name: string
  description?: string | null
  content: string
  category: string
  isBuiltin: boolean
  isActive: boolean
  fileName?: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------
export interface Plugin {
  id: string
  name: string
  description?: string | null
  version: string
  author?: string | null
  repoUrl?: string | null
  entryPoint?: string | null
  isActive: boolean
  isInstalled: boolean
  config?: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Memory (Long-Term Memory with vector embedding placeholder)
// ---------------------------------------------------------------------------
export type MemoryType = 'fact' | 'preference' | 'context' | 'conversation-summary' | 'learned-pattern' | 'reflection'

export interface Memory {
  id: string
  type: MemoryType
  key?: string | null
  content: string
  source?: string | null
  relevance: number
  accessCount: number
  tags?: string | null
  embedding?: string | null
  expiresAt?: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------
export type McpTransportType = 'stdio' | 'sse'

export interface McpTool {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

export interface McpResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface McpServer {
  id: string
  name: string
  command: string
  args?: string | null       // JSON array
  envVars?: string | null    // JSON object
  transportType: McpTransportType
  serverUrl?: string | null
  isActive: boolean
  isConnected: boolean
  discoveredTools?: string | null     // JSON array of McpTool
  discoveredResources?: string | null // JSON array of McpResource
  lastConnectedAt?: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Agent Swarm
// ---------------------------------------------------------------------------
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed'

export interface AgentSwarm {
  id: string
  name: string
  role: string
  systemPrompt?: string | null
  status: AgentStatus
  providerId?: string | null
  model?: string | null
  currentTask?: string | null
  taskHistory?: string | null  // JSON array
  workspaceDir?: string | null
  autoApprove: boolean
  maxIterations: number
  iterationCount: number
  isActive: boolean
  isDaemon: boolean
  lastActivityAt?: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Reflection Log
// ---------------------------------------------------------------------------
export type ReflectionType = 'daily' | 'task-complete' | 'error-recovery' | 'learning'

export interface ReflectionLog {
  id: string
  agentId?: string | null
  type: ReflectionType
  summary: string
  insights?: string | null    // JSON array
  actionItems?: string | null // JSON array
  successRate?: number | null
  createdAt: string
}
