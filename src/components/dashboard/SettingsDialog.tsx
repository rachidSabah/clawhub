'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import {
  createProvider, updateProvider, deleteProvider, fetchProviderModels,
  updateSettings, HERMES_PROVIDERS, fetchEnvSettings, updateEnvSettings,
  fetchUpdateStatus, updateAutoUpdateSettings, checkForUpdates,
  fetchServices, serviceAction, fetchDbOperations, executeDbOperation,
} from '@/lib/api'
import type { EnvEntry } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  Server,
  Key,
  Globe,
  Bot,
  Shield,
  Palette,
  Database,
  Loader2,
  Cable,
  MessageCircle,
  Search,
  Zap,
  Cloud,
  Monitor,
  Code2,
  Settings2,
  Wrench,
  Send,
  Radio,
  RotateCcw,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle2,
  Play,
  Square,
  Terminal,
  X,
} from 'lucide-react'
import type { ProviderType, ModelInfo, HermesProviderDef } from '@/lib/types'
import { WhatsAppPanel } from './WhatsAppPanel'

// ---------------------------------------------------------------------------
// Tool category icons & colors
// ---------------------------------------------------------------------------
const TOOL_CATEGORY_META: Record<string, { icon: typeof Wrench; color: string; label: string }> = {
  search: { icon: Search, color: 'bg-blue-500/10 text-blue-500', label: 'Search' },
  code: { icon: Code2, color: 'bg-cyan-500/10 text-cyan-500', label: 'Code' },
  file: { icon: Database, color: 'bg-amber-500/10 text-amber-500', label: 'File' },
  media: { icon: Palette, color: 'bg-pink-500/10 text-pink-500', label: 'Media' },
  memory: { icon: Bot, color: 'bg-violet-500/10 text-violet-500', label: 'Memory' },
  system: { icon: Monitor, color: 'bg-red-500/10 text-red-500', label: 'System' },
}

interface ToolInfo {
  name: string
  description: string
  parameters: Record<string, { type: string; description: string; required?: boolean }>
  category: string
  enabled: boolean
  requiresApproval: boolean
}

function ToolsConfigurationPanel() {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tools')
        const data = await res.json()
        const loaded: ToolInfo[] = (data.tools || []).map((t: any) => ({
          ...t,
          enabled: true,
          requiresApproval: t.category === 'system',
        }))
        setTools(loaded)
      } catch (err) {
        console.error('Failed to load tools:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleTool = (name: string) => {
    setTools(prev => prev.map(t => t.name === name ? { ...t, enabled: !t.enabled } : t))
  }

  const toggleApproval = (name: string) => {
    setTools(prev => prev.map(t => t.name === name ? { ...t, requiresApproval: !t.requiresApproval } : t))
  }

  const filtered = categoryFilter === 'all' ? tools : tools.filter(t => t.category === categoryFilter)
  const categories = ['all', ...Array.from(new Set(tools.map(t => t.category || 'uncategorized')))]
  const enabledCount = tools.filter(t => t.enabled).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium">Tool Configuration</span>
          </div>
          <Badge variant="outline" className="text-[10px] h-5">
            {enabledCount}/{tools.length} enabled
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure which tools are available for agents during conversations. System tools can require manual approval before execution.
        </p>

        <div className="flex flex-wrap gap-1">
          {categories.map((cat, idx) => (
            <button
              key={cat || `cat-${idx}`}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
                categoryFilter === cat ? 'bg-cyan-500 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {cat === 'all' ? 'All' : TOOL_CATEGORY_META[cat]?.label || cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((tool, idx) => {
          const meta = TOOL_CATEGORY_META[tool.category] || { icon: Wrench, color: 'bg-gray-500/10 text-gray-500', label: tool.category || 'uncategorized' }
          const CatIcon = meta.icon
          return (
            <div key={tool.name || `tool-${idx}`} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', meta.color)}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tool.name}</span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1">{meta.label}</Badge>
                      {!tool.enabled && <Badge variant="secondary" className="text-[8px] h-4 px-1 text-muted-foreground">Disabled</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                  </div>
                </div>
                <Switch checked={tool.enabled} onCheckedChange={() => toggleTool(tool.name)} />
              </div>

              {tool.enabled && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Parameters:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(tool.parameters).map(([key, param]) => (
                        <div key={key} className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-2 py-1">
                          <code className="text-[10px] font-mono text-foreground">{key}</code>
                          <Badge variant="outline" className="text-[8px] h-3 px-0.5">{param.type}</Badge>
                          {param.required && <Badge className="text-[7px] h-3 px-0.5 bg-red-500/10 text-red-600 border-0">req</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {tool.category === 'system' && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <div>
                          <span className="text-xs font-medium">Require Approval (Safe Mode)</span>
                          <p className="text-[10px] text-muted-foreground">This tool will ask for confirmation before executing</p>
                        </div>
                      </div>
                      <Switch checked={tool.requiresApproval} onCheckedChange={() => toggleApproval(tool.name)} />
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Provider category groupings for the registry UI
const PROVIDER_CATEGORIES = [
  {
    label: 'Cloud API Providers',
    icon: Cloud,
    types: ['anthropic', 'openrouter', 'novita', 'ai-gateway', 'zai', 'kimi', 'kimi-cn', 'arcee', 'gmi', 'minimax', 'minimax-cn', 'deepseek', 'huggingface'],
  },
  {
    label: 'Chinese AI Platforms',
    icon: Zap,
    types: ['alibaba', 'alibaba-coding', 'xiaomi', 'tencent-tokenhub', 'opencode-zen', 'opencode-go'],
  },
  {
    label: 'Google / Gemini',
    icon: Globe,
    types: ['gemini', 'gemini-cli', 'gemini-oauth'],
  },
  {
    label: 'OAuth / Device Code',
    icon: Key,
    types: ['nous-portal', 'openai-codex', 'github-copilot', 'github-copilot-acp'],
  },
  {
    label: 'Local / Self-Hosted',
    icon: Monitor,
    types: ['lmstudio', 'ollama', 'vllm', 'kilocode'],
  },
  {
    label: 'Custom',
    icon: Code2,
    types: ['custom', 'openai-compatible'],
  },
]

function getProviderColor(type: string) {
  const colorMap: Record<string, string> = {
    'anthropic': 'bg-amber-500/10 text-amber-500',
    'openrouter': 'bg-blue-500/10 text-blue-500',
    'deepseek': 'bg-cyan-500/10 text-cyan-500',
    'gemini': 'bg-emerald-500/10 text-emerald-500',
    'gemini-cli': 'bg-blue-500/10 text-blue-500',
    'gemini-oauth': 'bg-emerald-500/10 text-emerald-500',
    'ollama': 'bg-violet-500/10 text-violet-500',
    'lmstudio': 'bg-rose-500/10 text-rose-500',
    'vllm': 'bg-orange-500/10 text-orange-500',
    'huggingface': 'bg-yellow-500/10 text-yellow-500',
    'openai-codex': 'bg-green-500/10 text-green-500',
    'github-copilot': 'bg-slate-500/10 text-slate-500',
    'nous-portal': 'bg-purple-500/10 text-purple-500',
    'kimi': 'bg-indigo-500/10 text-indigo-500',
    'alibaba': 'bg-orange-500/10 text-orange-500',
    'xiaomi': 'bg-red-500/10 text-red-500',
    'zai': 'bg-teal-500/10 text-teal-500',
    'novita': 'bg-pink-500/10 text-pink-500',
    'custom': 'bg-gray-500/10 text-gray-500',
    'openai-compatible': 'bg-emerald-500/10 text-emerald-500',
    'cli': 'bg-blue-500/10 text-blue-500',
  }
  return colorMap[type] || 'bg-gray-500/10 text-gray-500'
}

function getAuthBadge(authType?: string | null) {
  switch (authType) {
    case 'api-key': return 'bg-emerald-500/10 text-emerald-600'
    case 'oauth': return 'bg-blue-500/10 text-blue-600'
    case 'cli': return 'bg-violet-500/10 text-violet-600'
    case 'device-code': return 'bg-amber-500/10 text-amber-600'
    default: return 'bg-gray-500/10 text-gray-600'
  }
}

// ---------------------------------------------------------------------------
// API Keys Configuration Panel (reads/writes .env)
// ---------------------------------------------------------------------------

// Friendly label map for env keys
const API_KEY_LABELS: Record<string, string> = {
  'ANTHROPIC_API_KEY': 'Anthropic (Claude)',
  'OPENAI_API_KEY': 'OpenAI (GPT-4)',
  'GOOGLE_API_KEY': 'Google Gemini',
  'DEEPSEEK_API_KEY': 'DeepSeek',
  'OPENROUTER_API_KEY': 'OpenRouter',
  'HF_TOKEN': 'Hugging Face',
  'GLM_API_KEY': 'z.ai / GLM',
  'KIMI_API_KEY': 'Kimi / Moonshot',
  'DASHSCOPE_API_KEY': 'Alibaba Cloud',
  'MINIMAX_API_KEY': 'MiniMax',
  'NOVITA_API_KEY': 'NovitaAI',
  'GROQ_API_KEY': 'Groq',
  'MISTRAL_API_KEY': 'Mistral AI',
  'COHERE_API_KEY': 'Cohere',
  'TOGETHER_API_KEY': 'Together AI',
  'FIREWORKS_API_KEY': 'Fireworks AI',
  'PERPLEXITY_API_KEY': 'Perplexity',
  'XAI_API_KEY': 'xAI (Grok)',
  'SAMBANOVA_API_KEY': 'SambaNova',
  'CEREBRAS_API_KEY': 'Cerebras',
  'AI21_API_KEY': 'AI21 Labs',
  'VOYAGE_API_KEY': 'Voyage AI',
  'LM_API_KEY': 'LM Studio / Ollama Key',
  'LM_BASE_URL': 'LM Studio Base URL',
  'OLLAMA_BASE_URL': 'Ollama Base URL',
}

function ApiKeysPanel() {
  const { loadProviders } = useAppStore()
  const [envData, setEnvData] = useState<Record<string, EnvEntry>>({})
  const [categories, setCategories] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'warning'; text: string } | null>(null)

  const loadEnv = useCallback(async () => {
    try {
      const data = await fetchEnvSettings()
      setEnvData(data.env)
      setCategories(data.categories)
      // Initialize edit values from env data
      const initValues: Record<string, string> = {}
      for (const [key, entry] of Object.entries(data.env)) {
        // For masked values, we don't prefill the edit field (user must re-enter)
        initValues[key] = entry.masked ? '' : entry.value
      }
      setEditValues(initValues)
    } catch (err) {
      console.error('Failed to load env settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEnv() }, [loadEnv])

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      // Only send keys that have been changed (non-empty edit values)
      const updates: Record<string, string> = {}
      for (const [key, value] of Object.entries(editValues)) {
        if (value && value.trim()) {
          updates[key] = value.trim()
        }
      }

      if (Object.keys(updates).length === 0) {
        setSaveMessage({ type: 'warning', text: 'No changes to save.' })
        setSaving(false)
        return
      }

      const result = await updateEnvSettings(updates)
      // Reload providers — this will auto-fetch models for providers that now have API keys
      await loadProviders()
      if (result.restartRequired) {
        setSaveMessage({ type: 'warning', text: 'Settings saved! Reloading providers and fetching models...' })
      } else {
        setSaveMessage({ type: 'success', text: 'Settings saved! Models are being fetched in the background.' })
      }
      // Reload to get updated masked values
      await loadEnv()
    } catch (err: any) {
      setSaveMessage({ type: 'warning', text: `Failed to save: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const toggleShowValue = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const aiKeys = categories.aiProviders || []
  const configuredCount = aiKeys.filter(k => envData[k]?.value && envData[k]?.source !== 'default').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">API Key Configuration</span>
          </div>
          <Badge variant="outline" className="text-[10px] h-5">
            {configuredCount}/{aiKeys.length} configured
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure your AI provider API keys here. Keys are stored in your local .env file and masked for security. Enter a new value to update an existing key.
        </p>
      </div>

      {/* Cloud API Keys */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Cloud className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Cloud API Providers</span>
        </div>
        {aiKeys.filter(k => !['LM_API_KEY', 'LM_BASE_URL', 'OLLAMA_BASE_URL'].includes(k)).map(key => {
          const entry = envData[key]
          if (!entry) return null
          const isConfigured = entry.value && entry.source !== 'default'
          const isEditing = editValues[key] !== undefined
          const showVal = showValues[key]

          return (
            <div key={key} className={cn(
              'rounded-xl border p-3 space-y-2 transition-colors',
              isConfigured ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-border'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs',
                    isConfigured ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                  )}>
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{API_KEY_LABELS[key] || key}</span>
                      {isConfigured ? (
                        <Badge variant="outline" className="text-[8px] h-4 px-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Set</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[8px] h-4 px-1 text-muted-foreground">Not Set</Badge>
                      )}
                    </div>
                    <code className="text-[10px] text-muted-foreground">{key}</code>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {entry.value && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleShowValue(key)}>
                      {showVal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                </div>
              </div>

              {entry.value && !showVal && entry.masked && (
                <div className="text-xs text-muted-foreground font-mono bg-muted/30 rounded-lg px-3 py-1.5">
                  Current: {entry.value}
                </div>
              )}
              {entry.value && showVal && (
                <div className="text-xs text-muted-foreground font-mono bg-muted/30 rounded-lg px-3 py-1.5 break-all">
                  {entry.value}
                </div>
              )}
              {!entry.masked && entry.value && (
                <div className="text-xs text-muted-foreground font-mono bg-muted/30 rounded-lg px-3 py-1.5 break-all">
                  {entry.value}
                </div>
              )}

              <Input
                type="password"
                value={editValues[key] || ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={isConfigured ? 'Enter new value to update...' : 'Enter your API key...'}
                className="h-8 text-xs"
              />
            </div>
          )
        })}
      </div>

      {/* Local / Self-Hosted */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Local / Self-Hosted</span>
        </div>
        {['LM_API_KEY', 'LM_BASE_URL', 'OLLAMA_BASE_URL'].map(key => {
          const entry = envData[key]
          if (!entry) return null
          const isConfigured = entry.value && entry.source !== 'default'

          return (
            <div key={key} className={cn(
              'rounded-xl border p-3 space-y-2 transition-colors',
              isConfigured ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-border'
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs',
                  isConfigured ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                )}>
                  <Monitor className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-sm font-medium">{API_KEY_LABELS[key] || key}</span>
                  <code className="text-[10px] text-muted-foreground ml-2">{key}</code>
                </div>
              </div>
              <Input
                type={key.includes('KEY') ? 'password' : 'text'}
                value={editValues[key] || ''}
                onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={isConfigured ? 'Enter new value to update...' : key.includes('KEY') ? 'Usually not needed for local...' : 'http://localhost:11434'}
                className="h-8 text-xs"
              />
            </div>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {saveMessage && (
          <div className={cn(
            'flex items-center gap-2 text-xs rounded-lg px-3 py-2',
            saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
          )}>
            {saveMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {saveMessage.text}
          </div>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={loadEnv}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Keys
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Messaging Gateway Configuration Panel (reads/writes .env)
// ---------------------------------------------------------------------------

const MESSAGING_KEY_LABELS: Record<string, string> = {
  'MESSAGING_ENABLED': 'Enable Messaging Gateway',
  'TELEGRAM_BOT_TOKEN': 'Telegram Bot Token',
  'DISCORD_BOT_TOKEN': 'Discord Bot Token',
  'SLACK_BOT_TOKEN': 'Slack Bot Token (xoxb-...)',
  'SLACK_SIGNING_SECRET': 'Slack Signing Secret',
  'SLACK_APP_TOKEN': 'Slack App Token (xapp-...)',
  'SIGNAL_NUMBER': 'Signal Phone Number',
  'SIGNAL_CLI_API': 'Signal CLI API URL',
  'HA_WEBHOOK_URL': 'Home Assistant Webhook URL',
  'HA_TOKEN': 'Home Assistant Token',
  'WHATTSAPP_ENABLED': 'Enable WhatsApp Bridge',
}

function MessagingConfigPanel() {
  const [envData, setEnvData] = useState<Record<string, EnvEntry>>({})
  const [categories, setCategories] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'warning'; text: string } | null>(null)

  const loadEnv = useCallback(async () => {
    try {
      const data = await fetchEnvSettings()
      setEnvData(data.env)
      setCategories(data.categories)
      const initValues: Record<string, string> = {}
      for (const [key, entry] of Object.entries(data.env)) {
        initValues[key] = entry.masked ? '' : entry.value
      }
      setEditValues(initValues)
    } catch (err) {
      console.error('Failed to load env settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadEnv() }, [loadEnv])

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const updates: Record<string, string> = {}
      for (const [key, value] of Object.entries(editValues)) {
        if (value && value.trim()) {
          updates[key] = value.trim()
        }
      }
      if (Object.keys(updates).length === 0) {
        setSaveMessage({ type: 'warning', text: 'No changes to save.' })
        setSaving(false)
        return
      }
      const result = await updateEnvSettings(updates)
      setSaveMessage({
        type: result.restartRequired ? 'warning' : 'success',
        text: result.restartRequired
          ? 'Settings saved! Restart the messaging gateway service for changes to take effect.'
          : 'Settings saved successfully!',
      })
      await loadEnv()
    } catch (err: any) {
      setSaveMessage({ type: 'warning', text: `Failed to save: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleMessaging = async (enabled: boolean) => {
    setEditValues(prev => ({ ...prev, MESSAGING_ENABLED: enabled ? 'true' : 'false' }))
  }

  const handleToggleWhatsApp = async (enabled: boolean) => {
    setEditValues(prev => ({ ...prev, WHATTSAPP_ENABLED: enabled ? 'true' : 'false' }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const messagingKeys = categories.messaging || []
  const whatsappKeys = categories.whatsapp || []
  const messagingEnabled = envData.MESSAGING_ENABLED?.value === 'true'
  const whatsappEnabled = envData.WHATTSAPP_ENABLED?.value === 'true'

  return (
    <div className="space-y-4">
      {/* Messaging Gateway Toggle */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', messagingEnabled ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground')}>
              <Send className="w-4 h-4" />
            </div>
            <div>
              <Label className="text-sm font-medium">Messaging Gateway</Label>
              <p className="text-xs text-muted-foreground">Connect ClawHub to Telegram, Discord, Slack, Signal, and Home Assistant (port 3005)</p>
            </div>
          </div>
          <Switch
            checked={editValues.MESSAGING_ENABLED === 'true' || messagingEnabled}
            onCheckedChange={handleToggleMessaging}
          />
        </div>
      </div>

      {/* Messaging Platform Tokens */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">Platform Tokens</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Enter bot tokens for the messaging platforms you want to use. Leave empty to disable a specific platform.
        </p>

        {/* Telegram */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Telegram Bot Token</Label>
          <Input
            type="password"
            value={editValues.TELEGRAM_BOT_TOKEN || ''}
            onChange={(e) => setEditValues(prev => ({ ...prev, TELEGRAM_BOT_TOKEN: e.target.value }))}
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            className="h-8 text-xs"
          />
        </div>

        <Separator />

        {/* Discord */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Discord Bot Token</Label>
          <Input
            type="password"
            value={editValues.DISCORD_BOT_TOKEN || ''}
            onChange={(e) => setEditValues(prev => ({ ...prev, DISCORD_BOT_TOKEN: e.target.value }))}
            placeholder="MTk4NjIy..."
            className="h-8 text-xs"
          />
        </div>

        <Separator />

        {/* Slack */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Slack Bot Token</Label>
          <Input
            type="password"
            value={editValues.SLACK_BOT_TOKEN || ''}
            onChange={(e) => setEditValues(prev => ({ ...prev, SLACK_BOT_TOKEN: e.target.value }))}
            placeholder="xoxb-your-slack-bot-token"
            className="h-8 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Signing Secret</Label>
            <Input
              type="password"
              value={editValues.SLACK_SIGNING_SECRET || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, SLACK_SIGNING_SECRET: e.target.value }))}
              placeholder="your-signing-secret"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">App Token</Label>
            <Input
              type="password"
              value={editValues.SLACK_APP_TOKEN || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, SLACK_APP_TOKEN: e.target.value }))}
              placeholder="xapp-your-app-token"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <Separator />

        {/* Signal */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Signal</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={editValues.SIGNAL_NUMBER || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, SIGNAL_NUMBER: e.target.value }))}
              placeholder="+1234567890"
              className="h-8 text-xs"
            />
            <Input
              value={editValues.SIGNAL_CLI_API || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, SIGNAL_CLI_API: e.target.value }))}
              placeholder="http://localhost:8080"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <Separator />

        {/* Home Assistant */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Home Assistant</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={editValues.HA_WEBHOOK_URL || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, HA_WEBHOOK_URL: e.target.value }))}
              placeholder="http://homeassistant.local:8123/api/webhook/clawhub"
              className="h-8 text-xs"
            />
            <Input
              type="password"
              value={editValues.HA_TOKEN || ''}
              onChange={(e) => setEditValues(prev => ({ ...prev, HA_TOKEN: e.target.value }))}
              placeholder="Long-lived access token"
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp Bridge */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', whatsappEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground')}>
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <Label className="text-sm font-medium">WhatsApp Bridge</Label>
              <p className="text-xs text-muted-foreground">Chat with ClawHub from WhatsApp — no Meta API needed (port 3004)</p>
            </div>
          </div>
          <Switch
            checked={editValues.WHATTSAPP_ENABLED === 'true' || whatsappEnabled}
            onCheckedChange={handleToggleWhatsApp}
          />
        </div>
        <WhatsAppPanel />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {saveMessage && (
          <div className={cn(
            'flex items-center gap-2 text-xs rounded-lg px-3 py-2',
            saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
          )}>
            {saveMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {saveMessage.text}
          </div>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={loadEnv}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Auto-Update Configuration Panel
// ---------------------------------------------------------------------------

function AutoUpdatePanel() {
  const [updateStatus, setUpdateStatus] = useState<{
    autoUpdateEnabled: boolean
    checkIntervalMinutes: number
    lastAutoCheckAt: string | null
    nextAutoCheckAt: string | null
    updateAvailable: boolean
    backgroundCheckerRunning: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'warning'; text: string } | null>(null)
  const [autoEnabled, setAutoEnabled] = useState(true)
  const [intervalMinutes, setIntervalMinutes] = useState(60)

  const loadStatus = useCallback(async () => {
    try {
      const status = await fetchUpdateStatus()
      setUpdateStatus(status)
      setAutoEnabled(status.autoUpdateEnabled)
      setIntervalMinutes(status.checkIntervalMinutes)
    } catch (err) {
      console.error('Failed to load update status:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      const result = await updateAutoUpdateSettings({
        autoUpdateEnabled: autoEnabled,
        checkIntervalMinutes: intervalMinutes,
      })
      setSaveMessage({ type: 'success', text: result.message || 'Auto-update settings saved!' })
      await loadStatus()
    } catch (err: any) {
      setSaveMessage({ type: 'warning', text: `Failed: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleCheckNow = async () => {
    setChecking(true)
    try {
      const result = await checkForUpdates()
      if (result.updateAvailable) {
        setSaveMessage({ type: 'warning', text: `Update available! ${result.remoteMessage || 'New version detected.'}` })
      } else {
        setSaveMessage({ type: 'success', text: 'You are running the latest version.' })
      }
      await loadStatus()
    } catch (err: any) {
      setSaveMessage({ type: 'warning', text: `Check failed: ${err.message}` })
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Auto-Update Toggle */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', autoEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground')}>
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <Label className="text-sm font-medium">Automatic Updates</Label>
              <p className="text-xs text-muted-foreground">ClawHub checks GitHub for new releases and updates automatically</p>
            </div>
          </div>
          <Switch
            checked={autoEnabled}
            onCheckedChange={setAutoEnabled}
          />
        </div>

        <Separator />

        {/* Check Interval */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Check Interval</Label>
            <Badge variant="outline" className="text-[10px] h-5">Every {intervalMinutes} min</Badge>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={360}
              step={5}
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-emerald-500"
            />
            <span className="text-xs text-muted-foreground w-16 text-right">{intervalMinutes} min</span>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>5 min</span>
            <span>1 hour</span>
            <span>6 hours</span>
          </div>
        </div>

        <Separator />

        {/* Status Info */}
        {updateStatus && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-muted/30 p-2.5">
                <div className="text-muted-foreground mb-0.5">Background Checker</div>
                <div className={cn('font-medium', updateStatus.backgroundCheckerRunning ? 'text-emerald-500' : 'text-muted-foreground')}>
                  {updateStatus.backgroundCheckerRunning ? 'Running' : 'Stopped'}
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-2.5">
                <div className="text-muted-foreground mb-0.5">Update Available</div>
                <div className={cn('font-medium', updateStatus.updateAvailable ? 'text-amber-500' : 'text-emerald-500')}>
                  {updateStatus.updateAvailable ? 'Yes!' : 'Up to Date'}
                </div>
              </div>
              {updateStatus.lastAutoCheckAt && (
                <div className="rounded-lg bg-muted/30 p-2.5">
                  <div className="text-muted-foreground mb-0.5">Last Checked</div>
                  <div className="font-medium">{new Date(updateStatus.lastAutoCheckAt).toLocaleString()}</div>
                </div>
              )}
              {updateStatus.nextAutoCheckAt && (
                <div className="rounded-lg bg-muted/30 p-2.5">
                  <div className="text-muted-foreground mb-0.5">Next Check</div>
                  <div className="font-medium">{new Date(updateStatus.nextAutoCheckAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Manual Check */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">Manual Check</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Check for updates right now, or use the <code className="bg-muted px-1 rounded">/status</code> slash command in chat.
        </p>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1 w-full" onClick={handleCheckNow} disabled={checking}>
          {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Check for Updates Now
        </Button>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-2">
        {saveMessage && (
          <div className={cn(
            'flex items-center gap-2 text-xs rounded-lg px-3 py-2',
            saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
          )}>
            {saveMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {saveMessage.text}
          </div>
        )}
        <Button size="sm" className="h-8 text-xs gap-1 ml-auto" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save Settings
        </Button>
      </div>
    </div>
  )
}

// ===========================================================================
// Services Manager Panel
// ===========================================================================

function ServicesManagerPanel() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'warning'; text: string } | null>(null)

  const loadServices = useCallback(async () => {
    try {
      const data = await fetchServices()
      setServices(data.services)
    } catch (err) {
      console.error('Failed to load services:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadServices() }, [loadServices])

  const handleAction = async (serviceId: string, action: 'start' | 'stop' | 'restart') => {
    setActing(serviceId)
    setMessage(null)
    try {
      const result = await serviceAction(serviceId, action)
      setMessage({ type: 'success', text: result.result || result.results?.[serviceId] || `${action} initiated` })
      setTimeout(() => loadServices(), 1500)
    } catch (err: any) {
      setMessage({ type: 'warning', text: `Failed: ${err.message}` })
    } finally {
      setActing(null)
    }
  }

  const handleStartAll = async () => {
    setActing('all')
    setMessage(null)
    try {
      const result = await serviceAction('', 'start-all')
      setMessage({ type: 'success', text: 'All services starting...' })
      setTimeout(() => loadServices(), 2000)
    } catch (err: any) {
      setMessage({ type: 'warning', text: `Failed: ${err.message}` })
    } finally {
      setActing(null)
    }
  }

  const handleStopAll = async () => {
    setActing('all-stop')
    setMessage(null)
    try {
      const result = await serviceAction('', 'stop-all')
      setMessage({ type: 'success', text: 'All services stopping...' })
      setTimeout(() => loadServices(), 1500)
    } catch (err: any) {
      setMessage({ type: 'warning', text: `Failed: ${err.message}` })
    } finally {
      setActing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const runningCount = services.filter(s => s.status === 'running').length

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Service Manager</span>
          </div>
          <Badge variant="outline" className="text-[10px] h-5">
            {runningCount}/{services.length} running
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Start and stop ClawHub services with one click. No need to open separate terminals.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={handleStartAll} disabled={acting === 'all'}>
            {acting === 'all' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Start All
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={handleStopAll} disabled={acting === 'all-stop'}>
            {acting === 'all-stop' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />} Stop All
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={loadServices}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {services.map(svc => (
        <div key={svc.id} className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                svc.status === 'running' ? 'bg-emerald-500/10 text-emerald-500' :
                svc.status === 'starting' ? 'bg-amber-500/10 text-amber-500' :
                'bg-muted text-muted-foreground'
              )}>
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{svc.name}</span>
                  <Badge className={cn(
                    'text-[8px] h-4 px-1.5 border-0',
                    svc.status === 'running' ? 'bg-emerald-500/10 text-emerald-600' :
                    svc.status === 'starting' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {svc.status}
                  </Badge>
                  {svc.optional && <Badge variant="outline" className="text-[8px] h-4 px-1">Optional</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{svc.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5 font-mono">:{svc.port}</Badge>
              {svc.pid && <span className="text-[10px] text-muted-foreground">PID {svc.pid}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <code className="bg-muted/50 px-2 py-1 rounded font-mono text-[10px] flex-1 truncate">{svc.startCommand}</code>
          </div>

          <div className="flex items-center gap-2">
            {svc.status === 'running' ? (
              <>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleAction(svc.id, 'restart')} disabled={acting === svc.id}>
                  {acting === svc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Restart
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => handleAction(svc.id, 'stop')} disabled={acting === svc.id}>
                  <Square className="w-3 h-3" /> Stop
                </Button>
              </>
            ) : (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleAction(svc.id, 'start')} disabled={acting === svc.id}>
                {acting === svc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Start
              </Button>
            )}
          </div>
        </div>
      ))}

      {message && (
        <div className={cn(
          'flex items-center gap-2 text-xs rounded-lg px-3 py-2',
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
        )}>
          {message.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {message.text}
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Database Manager Panel
// ===========================================================================

function DatabaseManagerPanel() {
  const [operations, setOperations] = useState<any[]>([])
  const [dbInfo, setDbInfo] = useState({ url: '', provider: '' })
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)
  const [output, setOutput] = useState<{ operation: string; success: boolean; stdout: string; stderr: string } | null>(null)

  const loadOps = useCallback(async () => {
    try {
      const data = await fetchDbOperations()
      setOperations(data.operations)
      setDbInfo(data.database)
    } catch (err) {
      console.error('Failed to load db operations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadOps() }, [loadOps])

  const handleExecute = async (op: any) => {
    if (op.confirmRequired && !confirm(`Are you sure? "${op.name}" will permanently reset your database. ALL DATA WILL BE LOST!`)) {
      return
    }
    setExecuting(op.id)
    setOutput(null)
    try {
      const result = await executeDbOperation(op.id, op.confirmRequired)
      setOutput(result)
    } catch (err: any) {
      setOutput({ operation: op.id, success: false, stdout: '', stderr: err.message })
    } finally {
      setExecuting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const categories = [
    { key: 'schema', label: 'Schema Operations', icon: Database, color: 'text-blue-500' },
    { key: 'data', label: 'Data Operations', icon: Bot, color: 'text-emerald-500' },
    { key: 'tools', label: 'Database Tools', icon: Terminal, color: 'text-violet-500' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium">Database Manager</span>
          </div>
          <Badge variant="outline" className="text-[10px] h-5">{dbInfo.provider}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Run Prisma database operations with one click. No terminal needed.
        </p>
        <div className="text-xs font-mono text-muted-foreground bg-muted/30 rounded-lg px-3 py-1.5 truncate">
          {dbInfo.url}
        </div>
      </div>

      {categories.map(cat => {
        const catOps = operations.filter(op => op.category === cat.key)
        if (catOps.length === 0) return null
        const CatIcon = cat.icon
        return (
          <div key={cat.key} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <CatIcon className={cn('w-3.5 h-3.5', cat.color)} />
              <span className="text-xs font-medium text-muted-foreground">{cat.label}</span>
            </div>
            {catOps.map(op => (
              <div key={op.id} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{op.name}</span>
                      {op.confirmRequired && <Badge className="text-[8px] h-4 px-1 bg-red-500/10 text-red-600 border-0">Destructive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{op.description}</p>
                  </div>
                  <Button
                    variant={op.confirmRequired ? 'destructive' : 'outline'}
                    size="sm"
                    className="h-7 text-xs gap-1 shrink-0"
                    onClick={() => handleExecute(op)}
                    disabled={executing === op.id}
                  >
                    {executing === op.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Run
                  </Button>
                </div>
                <code className="text-[10px] font-mono text-muted-foreground bg-muted/30 rounded px-2 py-1 block">{op.command}</code>
              </div>
            ))}
          </div>
        )
      })}

      {output && (
        <div className={cn(
          'rounded-xl border p-3 space-y-2',
          output.success ? 'border-emerald-500/20' : 'border-red-500/20'
        )}>
          <div className="flex items-center gap-2 text-xs">
            {output.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
            <span className="font-medium">{output.success ? 'Success' : 'Failed'}</span>
          </div>
          {output.stdout && (
            <pre className="text-[10px] font-mono text-muted-foreground bg-muted/30 rounded-lg p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">{output.stdout}</pre>
          )}
          {output.stderr && (
            <pre className="text-[10px] font-mono text-red-500 bg-red-500/5 rounded-lg p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">{output.stderr}</pre>
          )}
        </div>
      )}
    </div>
  )
}

// ===========================================================================
// Main SettingsDialog — 10 tabs
// ===========================================================================

export function SettingsDialog() {
  const {
    isSettingsOpen,
    setSettingsOpen,
    providers,
    loadProviders,
    settings,
    setSettings,
    loadSettings,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState('providers')
  const [providerFilter, setProviderFilter] = useState('')
  const [newProviderForm, setNewProviderForm] = useState({
    name: '',
    type: 'openai-compatible' as ProviderType,
    baseUrl: '',
    apiKey: '',
    isDefault: false,
  })
  const [fetchingModels, setFetchingModels] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ providerId: string; success: boolean; message: string } | null>(null)
  const [showAddProvider, setShowAddProvider] = useState(false)

  useEffect(() => {
    if (isSettingsOpen) {
      loadProviders()
      loadSettings()
    }
  }, [isSettingsOpen, loadProviders, loadSettings])

  // Close on Escape
  useEffect(() => {
    if (!isSettingsOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isSettingsOpen, setSettingsOpen])

  const getHermesDef = (type: string): HermesProviderDef | undefined => {
    return HERMES_PROVIDERS.find(p => p.type === type)
  }

  const handleCreateProvider = async () => {
    try {
      const def = getHermesDef(newProviderForm.type)
      const provider = await createProvider({
        name: newProviderForm.name || def?.label || newProviderForm.type,
        type: newProviderForm.type,
        baseUrl: newProviderForm.baseUrl || undefined,
        apiKey: newProviderForm.apiKey || undefined,
        isDefault: newProviderForm.isDefault,
      })
      // Auto-fetch models for the newly created provider
      try { await fetchProviderModels(provider.id) } catch {}
      await loadProviders()
      setNewProviderForm({ name: '', type: 'openai-compatible', baseUrl: '', apiKey: '', isDefault: false })
      setShowAddProvider(false)
    } catch (err) {
      console.error('Failed to create provider:', err)
    }
  }

  const handleQuickAddProvider = async (def: HermesProviderDef) => {
    try {
      const provider = await createProvider({
        name: def.label,
        type: def.type,
        baseUrl: def.defaultBaseUrl || undefined,
        isDefault: false,
      })
      // Auto-fetch models for the newly added provider
      try { await fetchProviderModels(provider.id) } catch {}
      await loadProviders()
    } catch (err) {
      console.error('Failed to create provider:', err)
    }
  }

  const handleDeleteProvider = async (id: string) => {
    try {
      await deleteProvider(id)
      await loadProviders()
    } catch (err) {
      console.error('Failed to delete provider:', err)
    }
  }

  const handleFetchModels = async (providerId: string) => {
    setFetchingModels(providerId)
    setTestResult(null)
    try {
      const result = await fetchProviderModels(providerId)
      await loadProviders()
      const modelCount = Array.isArray(result) ? result.length : (result as any)?.count || 0
      setTestResult({ providerId, success: true, message: `Found ${modelCount} models` })
    } catch (err: any) {
      setTestResult({ providerId, success: false, message: err.message || 'Failed to fetch models' })
    } finally {
      setFetchingModels(null)
    }
  }

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)
      await updateSettings({ [key]: value })
    } catch (err) {
      console.error('Failed to update setting:', err)
    }
  }

  const filteredProviders = providerFilter
    ? providers.filter(p =>
        p.name.toLowerCase().includes(providerFilter.toLowerCase()) ||
        p.type.toLowerCase().includes(providerFilter.toLowerCase())
      )
    : providers

  const configuredTypes = new Set(providers.map(p => p.type))

  const settingsTabs = [
    { value: 'providers', icon: Globe, label: 'Providers', group: 'Configuration' },
    { value: 'apikeys', icon: Key, label: 'API Keys', group: 'Configuration' },
    { value: 'agent', icon: Shield, label: 'Agent', group: 'Configuration' },
    { value: 'tools', icon: Wrench, label: 'Tools', group: 'Configuration' },
    { value: 'messaging', icon: Send, label: 'Messaging', group: 'Integrations' },
    { value: 'updates', icon: RotateCcw, label: 'Updates', group: 'System' },
    { value: 'services', icon: Server, label: 'Services', group: 'System' },
    { value: 'database', icon: Database, label: 'Database', group: 'System' },
    { value: 'appearance', icon: Palette, label: 'Theme', group: 'Preferences' },
    { value: 'data', icon: Database, label: 'Data', group: 'Preferences' },
  ]

  const tabGroups = settingsTabs.reduce<Record<string, typeof settingsTabs>>((acc, tab) => {
    if (!acc[tab.group]) acc[tab.group] = []
    acc[tab.group].push(tab)
    return acc
  }, {})

  if (!isSettingsOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background flex" autoFocus>
      {/* ── Left Sidebar Navigation ── */}
      <nav className="w-56 shrink-0 border-r border-border flex flex-col bg-muted/30">
        {/* Brand */}
        <div className="h-12 flex items-center gap-2 px-4 border-b border-border">
          <Server className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold">ClawHub</span>
          <span className="text-xs text-muted-foreground">Settings</span>
        </div>

        {/* Grouped Navigation */}
        <ScrollArea className="flex-1">
          <div className="py-3 px-2 space-y-4">
            {Object.entries(tabGroups).map(([group, tabs]) => (
              <div key={group}>
                <div className="px-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</span>
                </div>
                <div className="space-y-0.5">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors rounded-lg text-left',
                          activeTab === tab.value
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Close Button */}
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full h-8 text-xs gap-2 justify-center" onClick={() => setSettingsOpen(false)}>
            <X className="w-3.5 h-3.5" />
            Close Settings
          </Button>
        </div>
      </nav>

      {/* ── Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Content Header */}
        <header className="h-12 shrink-0 border-b border-border flex items-center px-6">
          <div className="flex items-center gap-2">
            {(() => {
              const activeTabDef = settingsTabs.find(t => t.value === activeTab)
              if (!activeTabDef) return null
              const ActiveIcon = activeTabDef.icon
              return (
                <>
                  <ActiveIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{activeTabDef.label}</span>
                </>
              )
            })()}
          </div>
        </header>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex min-h-0">
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto">
            {/* ── Providers Tab ── */}
            <TabsContent value="providers" className="p-6 pt-4 space-y-4 m-0">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">ClawHub Provider Registry</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {HERMES_PROVIDERS.length} providers
                  </Badge>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                  <Input
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    placeholder="Search providers..."
                    className="h-8 text-xs pl-8"
                  />
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {PROVIDER_CATEGORIES.map((category) => {
                    const categoryProviders = HERMES_PROVIDERS.filter(p => category.types.includes(p.type))
                    const filteredCategoryProviders = providerFilter
                      ? categoryProviders.filter(p =>
                          p.label.toLowerCase().includes(providerFilter.toLowerCase()) ||
                          p.type.toLowerCase().includes(providerFilter.toLowerCase())
                        )
                      : categoryProviders

                    if (filteredCategoryProviders.length === 0) return null

                    const CatIcon = category.icon

                    return (
                      <div key={category.label}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CatIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">{category.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredCategoryProviders.map((def) => {
                            const isConfigured = configuredTypes.has(def.type)
                            return (
                              <button
                                key={def.type}
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
                                  isConfigured
                                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600'
                                    : 'border-border hover:border-muted-foreground/30 hover:bg-accent/50'
                                )}
                                onClick={() => !isConfigured && handleQuickAddProvider(def)}
                                disabled={isConfigured}
                                title={def.description}
                              >
                                <Badge className={cn('text-[8px] h-3.5 px-1 border-0', getAuthBadge(def.authType))}>
                                  {def.authType}
                                </Badge>
                                <span>{def.label}</span>
                                {isConfigured && <Check className="w-3 h-3" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Configured Providers</span>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowAddProvider(!showAddProvider)}>
                  <Plus className="w-3 h-3" /> Custom Provider
                </Button>
              </div>

              {showAddProvider && (
                <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Provider Name</Label>
                      <Input value={newProviderForm.name} onChange={(e) => setNewProviderForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. My OpenAI" className="h-8 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select value={newProviderForm.type} onValueChange={(v) => { const def = getHermesDef(v); setNewProviderForm(prev => ({ ...prev, type: v as ProviderType, name: prev.name || def?.label || '', baseUrl: prev.baseUrl || def?.defaultBaseUrl || '' })) }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {HERMES_PROVIDERS.map(pt => <SelectItem key={pt.type} value={pt.type}>{pt.label}</SelectItem>)}
                          <SelectItem value="openai-compatible">OpenAI Compatible</SelectItem>
                          <SelectItem value="cli">CLI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newProviderForm.type !== 'cli' && newProviderForm.type !== 'gemini-cli' && newProviderForm.type !== 'github-copilot-acp' && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Base URL</Label>
                          <Input value={newProviderForm.baseUrl} onChange={(e) => setNewProviderForm(prev => ({ ...prev, baseUrl: e.target.value }))} placeholder={getHermesDef(newProviderForm.type)?.defaultBaseUrl || 'https://api.openai.com/v1'} className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">API Key</Label>
                          <Input type="password" value={newProviderForm.apiKey} onChange={(e) => setNewProviderForm(prev => ({ ...prev, apiKey: e.target.value }))} placeholder={getHermesDef(newProviderForm.type)?.envVar ? `Enter ${getHermesDef(newProviderForm.type)?.envVar}` : 'sk-...'} className="h-8 text-xs" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={newProviderForm.isDefault} onCheckedChange={(v) => setNewProviderForm(prev => ({ ...prev, isDefault: v }))} />
                      <Label className="text-xs">Set as default</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowAddProvider(false)}>Cancel</Button>
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={handleCreateProvider} disabled={!newProviderForm.name && !newProviderForm.type}>
                        <Plus className="w-3 h-3" /> Add Provider
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', getProviderColor(provider.type))}>
                          {provider.type.includes('cli') ? <Bot className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1.5">
                            {provider.name}
                            {provider.isDefault && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600">Default</Badge>}
                            {!provider.isActive && <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground">Inactive</Badge>}
                            <Badge className={cn('text-[8px] h-4 px-1.5 border-0', getAuthBadge(provider.authType))}>{provider.authType || 'unknown'}</Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span>{provider.type}</span>
                            {provider.baseUrl && <><span>·</span><span className="truncate max-w-[200px]">{provider.baseUrl}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleFetchModels(provider.id)} disabled={fetchingModels === provider.id}>
                          {fetchingModels === provider.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Models
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteProvider(provider.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {testResult?.providerId === provider.id && (
                      <div className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs', testResult.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive')}>
                        {testResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {testResult.message}
                      </div>
                    )}

                    {provider.models && (() => {
                      try {
                        const models = JSON.parse(provider.models) as ModelInfo[]
                        if (models.length === 0) return null
                        return (
                          <div className="flex flex-wrap gap-1">
                            {models.slice(0, 10).map((model, idx) => (
                              <Badge key={`${provider.id}-model-${idx}`} variant="outline" className="text-[10px] h-5">{model.name || model.id || `Model ${idx+1}`}</Badge>
                            ))}
                            {models.length > 10 && <Badge variant="outline" className="text-[10px] h-5">+{models.length - 10} more</Badge>}
                          </div>
                        )
                      } catch { return null }
                    })()}
                  </div>
                ))}
                {providers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No providers configured. Click a provider from the registry above to add it.</div>
                )}
              </div>
            </TabsContent>

            {/* ── API Keys Tab ── */}
            <TabsContent value="apikeys" className="p-6 pt-4 m-0">
              <ApiKeysPanel />
            </TabsContent>

            {/* ── Agent Tab ── */}
            <TabsContent value="agent" className="p-6 pt-4 space-y-4 m-0">
              <div className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Agent Governance</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', settings.godMode ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500')}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">{settings.godMode ? 'God Mode' : 'Safe Mode'}</Label>
                      <p className="text-xs text-muted-foreground">{settings.godMode ? 'Agent can execute ANY command without confirmation. Use with caution.' : 'Agent asks for confirmation before destructive actions.'}</p>
                    </div>
                  </div>
                  <Switch checked={settings.godMode || false} onCheckedChange={(v) => handleUpdateSetting('godMode', v)} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Auto-approve all commands</Label>
                    <p className="text-xs text-muted-foreground">Allow the agent to execute terminal commands without confirmation</p>
                  </div>
                  <Switch checked={settings.agentAutoApprove} onCheckedChange={(v) => handleUpdateSetting('agentAutoApprove', v)} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Require confirmation for destructive actions</Label>
                    <p className="text-xs text-muted-foreground">Ask before running commands like rm, del, format, etc.</p>
                  </div>
                  <Switch checked={settings.agentRequireConfirm} onCheckedChange={(v) => handleUpdateSetting('agentRequireConfirm', v)} />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10 text-violet-500">
                      <Settings2 className="w-4 h-4" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">24/7 Background Daemon</Label>
                      <p className="text-xs text-muted-foreground">Run agents continuously in the background, even when the UI is closed</p>
                    </div>
                  </div>
                  <Switch checked={settings.daemonEnabled || false} onCheckedChange={(v) => handleUpdateSetting('daemonEnabled', v)} />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-sm">Root workspace directory</Label>
                  <p className="text-xs text-muted-foreground mb-2">The default directory where the agent will operate</p>
                  <Input value={settings.agentWorkspaceDir || ''} onChange={(e) => handleUpdateSetting('agentWorkspaceDir', e.target.value)} placeholder="/home/user/workspace" className="h-8 text-xs" />
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-medium">Memory & Reflection</span>
                </div>
                <div className="flex items-center justify-between">
                  <div><Label className="text-sm">Long-Term Memory</Label><p className="text-xs text-muted-foreground">Store and recall information across sessions</p></div>
                  <Switch checked={settings.memoryEnabled ?? true} onCheckedChange={(v) => handleUpdateSetting('memoryEnabled', v)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><Label className="text-sm">Auto-summarize conversations</Label><p className="text-xs text-muted-foreground">Automatically create memory entries from conversations</p></div>
                  <Switch checked={settings.memoryAutoSummarize ?? true} onCheckedChange={(v) => handleUpdateSetting('memoryAutoSummarize', v)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><Label className="text-sm">Daily Reflection</Label><p className="text-xs text-muted-foreground">Agent reviews its performance and learns from past tasks</p></div>
                  <Switch checked={settings.reflectionEnabled ?? true} onCheckedChange={(v) => handleUpdateSetting('reflectionEnabled', v)} />
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium">Global System Prompt</span>
                </div>
                <p className="text-xs text-muted-foreground">This system prompt will be prepended to every conversation and agent task.</p>
                <Textarea value={settings.globalSystemPrompt || ''} onChange={(e) => handleUpdateSetting('globalSystemPrompt', e.target.value)} placeholder="You are a helpful AI assistant with access to the user's local machine..." className="min-h-[120px] text-xs" />
              </div>
            </TabsContent>

            {/* ── Tools Tab ── */}
            <TabsContent value="tools" className="p-6 pt-4 space-y-4 m-0">
              <ToolsConfigurationPanel />
            </TabsContent>

            {/* ── Messaging Tab ── */}
            <TabsContent value="messaging" className="p-6 pt-4 m-0">
              <MessagingConfigPanel />
            </TabsContent>

            {/* ── Updates Tab ── */}
            <TabsContent value="updates" className="p-6 pt-4 m-0">
              <AutoUpdatePanel />
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="p-6 pt-4 m-0">
              <ServicesManagerPanel />
            </TabsContent>

            {/* Database Tab */}
            <TabsContent value="database" className="p-6 pt-4 m-0">
              <DatabaseManagerPanel />
            </TabsContent>

            {/* ── Appearance Tab ── */}
            <TabsContent value="appearance" className="p-6 pt-4 space-y-4 m-0">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Theme</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button key={theme} className={cn('rounded-lg border-2 p-3 text-center transition-colors', settings.theme === theme ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-muted-foreground/30')} onClick={() => handleUpdateSetting('theme', theme)}>
                      <div className="text-xs font-medium capitalize">{theme}</div>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── Data Tab ── */}
            <TabsContent value="data" className="p-6 pt-4 space-y-4 m-0">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-medium">Data Management</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div><Label className="text-sm">Export Chat History</Label><p className="text-xs text-muted-foreground">Download all conversations as JSON</p></div>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={async () => { try { const { fetchConversations } = await import('@/lib/api'); const convs = await fetchConversations(); const blob = new Blob([JSON.stringify(convs, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'clawhub-chat-export.json'; a.click(); URL.revokeObjectURL(url) } catch {} }}>Export</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div><Label className="text-sm text-destructive">Clear All History</Label><p className="text-xs text-muted-foreground">Permanently delete all conversations and messages</p></div>
                    <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={async () => { if (confirm('Are you sure? This will delete ALL conversations permanently.')) { try { const { fetchConversations, deleteConversation } = await import('@/lib/api'); const convs = await fetchConversations(); for (const conv of convs) { await deleteConversation(conv.id) } } catch {} } }}>Clear All</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
      </div>
    </div>
  )
}
