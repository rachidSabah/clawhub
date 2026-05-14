// ============================================================================
// AI Agent Dashboard — Shared TypeScript Types
// ============================================================================

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------
export interface Conversation {
  id: string
  title: string
  mode: 'chat' | 'agent'
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

/** Full Hermes provider registry — used to populate the Add Provider UI */
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
// Memory
// ---------------------------------------------------------------------------
export type MemoryType = 'fact' | 'preference' | 'context' | 'conversation-summary' | 'learned-pattern'

export interface Memory {
  id: string
  type: MemoryType
  key?: string | null
  content: string
  source?: string | null
  relevance: number
  accessCount: number
  expiresAt?: string | null
  createdAt: string
  updatedAt: string
}
