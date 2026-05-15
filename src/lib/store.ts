import { create } from 'zustand'
import type {
  Conversation, Message, Provider, ModelInfo, AppSettings, AgentStreamEvent,
  Skill, Plugin, Memory, McpServer, AgentSwarm, ReflectionLog, ModelConfig, Workspace, CronJob,
  PendingApproval, DmPairing, UserProfile, ContextFile, ToolDefinition,
} from '@/lib/types'
import {
  fetchConversations as apiFetchConversations,
  fetchMessages as apiFetchMessages,
  fetchProviders as apiFetchProviders,
  fetchProviderModels as apiFetchProviderModels,
  fetchSettings as apiFetchSettings,
  fetchSkills as apiFetchSkills,
  fetchPlugins as apiFetchPlugins,
  fetchMemories as apiFetchMemories,
  fetchMcpServers as apiFetchMcpServers,
  fetchSwarmAgents as apiFetchSwarmAgents,
  fetchReflections as apiFetchReflections,
  fetchModelConfigs as apiFetchModelConfigs,
  fetchWorkspaces as apiFetchWorkspaces,
  fetchCronJobs as apiFetchCronJobs,
  fetchPendingApprovals as apiFetchPendingApprovals,
  fetchDmPairings as apiFetchDmPairings,
  fetchUserProfile as apiFetchUserProfile,
  fetchContextFiles as apiFetchContextFiles,
  fetchTools as apiFetchTools,
} from '@/lib/api'

interface AppState {
  // Conversations
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void
  conversations: Conversation[]
  loadConversations: () => Promise<void>
  
  // Messages
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  loadMessages: (conversationId: string) => Promise<void>
  
  // Streaming
  streamingContent: string
  appendStreamingContent: (chunk: string) => void
  clearStreamingContent: () => void
  abortController: AbortController | null
  setAbortController: (controller: AbortController | null) => void
  
  // Agent
  isAgentMode: boolean
  toggleAgentMode: () => void
  agentLog: AgentStreamEvent[]
  addAgentLog: (event: AgentStreamEvent) => void
  clearAgentLog: () => void
  
  // Providers
  providers: Provider[]
  loadProviders: () => Promise<void>
  availableModels: ModelInfo[]
  activeProvider: Provider | null
  setActiveProvider: (provider: Provider | null) => void
  activeModel: string | null
  setActiveModel: (model: string | null) => void
  
  // Model Configs
  modelConfigs: ModelConfig[]
  loadModelConfigs: () => Promise<void>
  
  // Workspaces
  workspaces: Workspace[]
  loadWorkspaces: () => Promise<void>
  activeWorkspaceId: string | null
  setActiveWorkspaceId: (id: string | null) => void
  
  // Cron Jobs
  cronJobs: CronJob[]
  loadCronJobs: () => Promise<void>
  
  // Settings
  settings: AppSettings
  setSettings: (settings: AppSettings) => void
  loadSettings: () => Promise<void>
  
  // UI
  isSidebarOpen: boolean
  toggleSidebar: () => void
  isSettingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  isStreaming: boolean
  setIsStreaming: (streaming: boolean) => void
  sidebarTab: string
  setSidebarTab: (tab: string) => void
  isRightPanelOpen: boolean
  toggleRightPanel: () => void
  rightPanelTab: string
  setRightPanelTab: (tab: string) => void
  
  // Attachments
  attachments: File[]
  addAttachment: (file: File) => void
  removeAttachment: (index: number) => void
  clearAttachments: () => void
  
  // Skills, Plugins, Memory, MCP, Swarm, Reflections
  skills: Skill[]
  loadSkills: () => Promise<void>
  plugins: Plugin[]
  loadPlugins: () => Promise<void>
  memories: Memory[]
  loadMemories: (type?: string) => Promise<void>
  addMemory: (memory: Memory) => void
  mcpServers: McpServer[]
  loadMcpServers: () => Promise<void>
  swarmAgents: AgentSwarm[]
  loadSwarmAgents: () => Promise<void>
  reflections: ReflectionLog[]
  loadReflections: () => Promise<void>
  
  // Security
  pendingApprovals: PendingApproval[]
  loadPendingApprovals: () => Promise<void>
  dmPairings: DmPairing[]
  loadDmPairings: () => Promise<void>
  
  // User Profile
  userProfile: UserProfile | null
  loadUserProfile: () => Promise<void>
  
  // Context Files
  contextFiles: ContextFile[]
  loadContextFiles: () => Promise<void>
  
  // Tools (expanded)
  tools: ToolDefinition[]
  loadTools: () => Promise<void>
}

const defaultSettings: AppSettings = {
  theme: 'system',
  agentAutoApprove: false,
  agentRequireConfirm: true,
  memoryEnabled: true,
  memoryMaxEntries: 10000,
  memoryAutoSummarize: true,
  reflectionEnabled: true,
  reflectionInterval: 60,
  daemonEnabled: false,
  godMode: false,
}

export const useAppStore = create<AppState>((set, get) => ({
  activeConversationId: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  conversations: [],
  loadConversations: async () => {
    try { set({ conversations: await apiFetchConversations() }) }
    catch (e) { console.error('[store] loadConversations:', e) }
  },
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  updateMessage: (id, updates) => set((s) => ({ messages: s.messages.map(m => m.id === id ? { ...m, ...updates } : m) })),
  loadMessages: async (cid) => {
    try { set({ messages: await apiFetchMessages(cid) }) }
    catch (e) { console.error('[store] loadMessages:', e) }
  },
  streamingContent: '',
  appendStreamingContent: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  clearStreamingContent: () => set({ streamingContent: '' }),
  abortController: null,
  setAbortController: (c) => set({ abortController: c }),
  isAgentMode: false,
  toggleAgentMode: () => set((s) => ({ isAgentMode: !s.isAgentMode })),
  agentLog: [],
  addAgentLog: (event) => set((s) => ({ agentLog: [...s.agentLog, event] })),
  clearAgentLog: () => set({ agentLog: [] }),
  providers: [],
  loadProviders: async () => {
    try {
      const providers = await apiFetchProviders()
      set({ providers })
      const models: ModelInfo[] = []
      for (const p of providers) {
        if (!p.isActive) continue
        try {
          if (p.models) { (JSON.parse(p.models) as ModelInfo[]).forEach((m, i) => { const id = m.id || `${p.id}-model-${i}`; models.push({ id, name: m.name || id, provider: p.id }) }) }
        } catch {}
      }
      set({ availableModels: models })
      const { activeProvider } = get()
      if (!activeProvider) {
        const def = providers.find(p => p.isDefault && p.isActive) ?? providers.find(p => p.isActive) ?? null
        if (def) set({ activeProvider: def })
      }

      // Auto-fetch models for active providers that don't have models yet.
      // This runs in the background (non-blocking) so the UI is not delayed.
      // Fetched models are persisted in the DB, so subsequent loads are fast.
      const providersNeedingModels = providers.filter(p => p.isActive && !p.models)
      if (providersNeedingModels.length > 0) {
        Promise.allSettled(
          providersNeedingModels.map(p => apiFetchProviderModels(p.id))
        ).then(() => {
          // Reload providers to pick up newly fetched models
          apiFetchProviders().then(updatedProviders => {
            const updatedModels: ModelInfo[] = []
            for (const p of updatedProviders) {
              if (!p.isActive) continue
              try {
                if (p.models) { (JSON.parse(p.models) as ModelInfo[]).forEach((m, i) => { const id = m.id || `${p.id}-model-${i}`; updatedModels.push({ id, name: m.name || id, provider: p.id }) }) }
              } catch {}
            }
            set({ providers: updatedProviders, availableModels: updatedModels })
          })
        })
      }
    } catch (e) { console.error('[store] loadProviders:', e) }
  },
  availableModels: [],
  activeProvider: null,
  setActiveProvider: (p) => set({ activeProvider: p }),
  activeModel: null,
  setActiveModel: (m) => set({ activeModel: m }),
  modelConfigs: [],
  loadModelConfigs: async () => {
    try { set({ modelConfigs: await apiFetchModelConfigs() }) }
    catch (e) { console.error('[store] loadModelConfigs:', e) }
  },
  workspaces: [],
  loadWorkspaces: async () => {
    try { set({ workspaces: await apiFetchWorkspaces() }) }
    catch (e) { console.error('[store] loadWorkspaces:', e) }
  },
  activeWorkspaceId: null,
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  cronJobs: [],
  loadCronJobs: async () => {
    try { set({ cronJobs: await apiFetchCronJobs() }) }
    catch (e) { console.error('[store] loadCronJobs:', e) }
  },
  settings: defaultSettings,
  setSettings: (settings) => set({ settings }),
  loadSettings: async () => {
    try { set({ settings: await apiFetchSettings() }) }
    catch (e) { console.error('[store] loadSettings:', e) }
  },
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  isSettingsOpen: false,
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isStreaming: false,
  setIsStreaming: (s) => set({ isStreaming: s }),
  sidebarTab: 'chats',
  setSidebarTab: (t) => set({ sidebarTab: t }),
  isRightPanelOpen: false,
  toggleRightPanel: () => set((s) => ({ isRightPanelOpen: !s.isRightPanelOpen })),
  rightPanelTab: 'model',
  setRightPanelTab: (t) => set({ rightPanelTab: t }),
  attachments: [],
  addAttachment: (f) => set((s) => ({ attachments: [...s.attachments, f] })),
  removeAttachment: (i) => set((s) => ({ attachments: s.attachments.filter((_, j) => j !== i) })),
  clearAttachments: () => set({ attachments: [] }),
  skills: [],
  loadSkills: async () => { try { set({ skills: await apiFetchSkills() }) } catch {} },
  plugins: [],
  loadPlugins: async () => { try { set({ plugins: await apiFetchPlugins() }) } catch {} },
  memories: [],
  loadMemories: async (type?: string) => { try { set({ memories: await apiFetchMemories(type) }) } catch {} },
  addMemory: (m) => set((s) => ({ memories: [...s.memories, m] })),
  mcpServers: [],
  loadMcpServers: async () => { try { set({ mcpServers: await apiFetchMcpServers() }) } catch {} },
  swarmAgents: [],
  loadSwarmAgents: async () => { try { set({ swarmAgents: await apiFetchSwarmAgents() }) } catch {} },
  reflections: [],
  loadReflections: async () => { try { set({ reflections: await apiFetchReflections() }) } catch {} },
  pendingApprovals: [],
  loadPendingApprovals: async () => { try { const res = await apiFetchPendingApprovals(); set({ pendingApprovals: res.pending }) } catch {} },
  dmPairings: [],
  loadDmPairings: async () => { try { const res = await apiFetchDmPairings(); set({ dmPairings: res.pairings }) } catch {} },
  userProfile: null,
  loadUserProfile: async () => { try { const res = await apiFetchUserProfile(); set({ userProfile: res.profile }) } catch {} },
  contextFiles: [],
  loadContextFiles: async () => { try { const res = await apiFetchContextFiles(); set({ contextFiles: res.files }) } catch {} },
  tools: [],
  loadTools: async () => { try { const res = await apiFetchTools(); set({ tools: res.tools }) } catch {} },
}))
