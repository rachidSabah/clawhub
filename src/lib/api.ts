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
