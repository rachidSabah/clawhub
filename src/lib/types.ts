// ============================================================================
// INFOHAS ClawHub — Shared TypeScript Types
// ============================================================================

export interface Conversation {
  id: string
  title: string
  mode: 'chat' | 'agent' | 'swarm'
  provider?: string | null
  model?: string | null
  systemPrompt?: string | null
  workspaceId?: string | null
  isArchived: boolean
  isDeleted: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  messages: Message[]
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'agent-thought' | 'agent-action' | 'agent-observation'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  metadata?: string | null
  isStreaming: boolean
  isDeleted: boolean
  deletedAt?: string | null
  createdAt: string
}

export type ProviderType = string

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

export interface ModelConfig {
  id: string
  name: string
  provider: string
  contextWindow: number
  auxiliaryModels?: string | null
  auxiliaryContext?: string | null
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  priority: number
  autoOptimize: boolean
  isActive: boolean
  isDefault: boolean
  modelId?: string | null
  baseUrl?: string | null
  apiKey?: string | null
  envVar?: string | null
  authType?: AuthType | null
  providerConfig?: string | null
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  description?: string | null
  directory?: string | null
  icon?: string | null
  color?: string | null
  isActive: boolean
  isDefault: boolean
  config?: string | null
  createdAt: string
  updatedAt: string
}

export interface CronJob {
  id: string
  name: string
  description?: string | null
  schedule: string
  taskType: string
  taskData: string
  workspaceId?: string | null
  modelConfigId?: string | null
  isActive: boolean
  isRunning: boolean
  lastRunAt?: string | null
  nextRunAt?: string | null
  runCount: number
  failCount: number
  lastResult?: string | null
  createdAt: string
  updatedAt: string
}

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
  reflectionInterval: number
  daemonEnabled: boolean
  godMode: boolean
  whatsappEnabled?: boolean
  whatsappAutoReply?: boolean
}

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

export interface FileAttachment {
  id: string
  messageId?: string | null
  fileName: string
  filePath: string
  fileType?: string | null
  fileSize?: number | null
  createdAt: string
}

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
  args?: string | null
  envVars?: string | null
  transportType: McpTransportType
  serverUrl?: string | null
  isActive: boolean
  isConnected: boolean
  discoveredTools?: string | null
  discoveredResources?: string | null
  lastConnectedAt?: string | null
  createdAt: string
  updatedAt: string
}

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
  taskHistory?: string | null
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

export type ReflectionType = 'daily' | 'task-complete' | 'error-recovery' | 'learning'

export interface ReflectionLog {
  id: string
  agentId?: string | null
  type: ReflectionType
  summary: string
  insights?: string | null
  actionItems?: string | null
  successRate?: number | null
  createdAt: string
}

export interface HardwareProfile {
  id: string
  platform: string
  arch: string
  cpuCores: number
  cpuModel?: string | null
  totalRamGB: number
  gpuInfo?: string | null
  detectedAt: string
  updatedAt: string
}
