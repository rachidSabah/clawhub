// ============================================================================
// AI Agent Dashboard — Zustand Store
// ============================================================================

import { create } from 'zustand'

import type {
  Conversation,
  Message,
  Provider,
  ModelInfo,
  AppSettings,
  AgentStreamEvent,
} from '@/lib/types'

import {
  fetchConversations as apiFetchConversations,
  fetchMessages as apiFetchMessages,
  fetchProviders as apiFetchProviders,
  fetchSettings as apiFetchSettings,
} from '@/lib/api'

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

interface AppState {
  // Active conversation
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void

  // Conversations list
  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  loadConversations: () => Promise<void>

  // Messages for active conversation
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  loadMessages: (conversationId: string) => Promise<void>

  // Streaming message content (built up as chunks arrive)
  streamingContent: string
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  clearStreamingContent: () => void

  // Agent mode
  isAgentMode: boolean
  toggleAgentMode: () => void
  agentLog: AgentStreamEvent[]
  addAgentLog: (event: AgentStreamEvent) => void
  clearAgentLog: () => void

  // Providers
  providers: Provider[]
  setProviders: (providers: Provider[]) => void
  loadProviders: () => Promise<void>

  // Models (parsed from all providers)
  availableModels: ModelInfo[]
  setAvailableModels: (models: ModelInfo[]) => void

  // Active model / provider
  activeProvider: Provider | null
  setActiveProvider: (provider: Provider | null) => void
  activeModel: string | null
  setActiveModel: (model: string | null) => void

  // Settings
  settings: AppSettings
  setSettings: (settings: AppSettings) => void
  loadSettings: () => Promise<void>

  // UI state
  isSidebarOpen: boolean
  toggleSidebar: () => void
  isSettingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  isStreaming: boolean
  setIsStreaming: (streaming: boolean) => void

  // File attachments for current message
  attachments: File[]
  addAttachment: (file: File) => void
  removeAttachment: (index: number) => void
  clearAttachments: () => void
}

// ---------------------------------------------------------------------------
// Default Settings
// ---------------------------------------------------------------------------

const defaultSettings: AppSettings = {
  theme: 'system',
  agentAutoApprove: false,
  agentRequireConfirm: true,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>((set, get) => ({
  // ---- Active conversation ------------------------------------------------
  activeConversationId: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),

  // ---- Conversations list -------------------------------------------------
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  loadConversations: async () => {
    try {
      const conversations = await apiFetchConversations()
      set({ conversations })
    } catch (error) {
      console.error('[store] Failed to load conversations:', error)
    }
  },

  // ---- Messages -----------------------------------------------------------
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    })),
  loadMessages: async (conversationId) => {
    try {
      const messages = await apiFetchMessages(conversationId)
      set({ messages })
    } catch (error) {
      console.error('[store] Failed to load messages:', error)
    }
  },

  // ---- Streaming content --------------------------------------------------
  streamingContent: '',
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  clearStreamingContent: () => set({ streamingContent: '' }),

  // ---- Agent mode ---------------------------------------------------------
  isAgentMode: false,
  toggleAgentMode: () => set((state) => ({ isAgentMode: !state.isAgentMode })),
  agentLog: [],
  addAgentLog: (event) =>
    set((state) => ({ agentLog: [...state.agentLog, event] })),
  clearAgentLog: () => set({ agentLog: [] }),

  // ---- Providers ----------------------------------------------------------
  providers: [],
  setProviders: (providers) => set({ providers }),
  loadProviders: async () => {
    try {
      const providers = await apiFetchProviders()
      set({ providers })

      // Parse available models from all active providers
      const models: ModelInfo[] = []
      for (const provider of providers) {
        if (!provider.isActive) continue
        try {
          if (provider.models) {
            const parsed = JSON.parse(provider.models) as ModelInfo[]
            for (const model of parsed) {
              models.push({
                id: model.id,
                name: model.name,
                provider: provider.id,
              })
            }
          }
        } catch {
          // Skip providers with invalid model JSON
        }
      }
      set({ availableModels: models })

      // Auto‑select default provider if none is active
      const { activeProvider } = get()
      if (!activeProvider) {
        const defaultProvider =
          providers.find((p) => p.isDefault && p.isActive) ??
          providers.find((p) => p.isActive) ??
          null
        if (defaultProvider) {
          set({ activeProvider: defaultProvider })
        }
      }
    } catch (error) {
      console.error('[store] Failed to load providers:', error)
    }
  },

  // ---- Available models ---------------------------------------------------
  availableModels: [],
  setAvailableModels: (availableModels) => set({ availableModels }),

  // ---- Active provider / model --------------------------------------------
  activeProvider: null,
  setActiveProvider: (provider) => set({ activeProvider: provider }),
  activeModel: null,
  setActiveModel: (model) => set({ activeModel: model }),

  // ---- Settings -----------------------------------------------------------
  settings: defaultSettings,
  setSettings: (settings) => set({ settings }),
  loadSettings: async () => {
    try {
      const settings = await apiFetchSettings()
      set({ settings })
    } catch (error) {
      console.error('[store] Failed to load settings:', error)
    }
  },

  // ---- UI state -----------------------------------------------------------
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  isSettingsOpen: false,
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isStreaming: false,
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  // ---- File attachments ---------------------------------------------------
  attachments: [],
  addAttachment: (file) =>
    set((state) => ({ attachments: [...state.attachments, file] })),
  removeAttachment: (index) =>
    set((state) => ({
      attachments: state.attachments.filter((_, i) => i !== index),
    })),
  clearAttachments: () => set({ attachments: [] }),
}))
