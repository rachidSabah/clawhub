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
// Provider
// ---------------------------------------------------------------------------
export type ProviderType = 'cli' | 'openai-compatible' | 'anthropic' | 'ollama'

export interface Provider {
  id: string
  name: string
  type: ProviderType
  baseUrl?: string | null
  apiKey?: string | null
  isActive: boolean
  isDefault: boolean
  models?: string | null // JSON string of model objects
  createdAt: string
  updatedAt: string
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
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
