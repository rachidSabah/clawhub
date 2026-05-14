'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { createProvider, updateProvider, deleteProvider, fetchProviderModels, updateSettings, HERMES_PROVIDERS } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
} from 'lucide-react'
import type { Provider, ProviderType, ModelInfo, HermesProviderDef } from '@/lib/types'
import { McpConfigPanel } from './McpConfigPanel'
import { WhatsAppPanel } from './WhatsAppPanel'

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

// Get icon color for provider type
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

// Get auth type badge color
function getAuthBadge(authType?: string | null) {
  switch (authType) {
    case 'api-key': return 'bg-emerald-500/10 text-emerald-600'
    case 'oauth': return 'bg-blue-500/10 text-blue-600'
    case 'cli': return 'bg-violet-500/10 text-violet-600'
    case 'device-code': return 'bg-amber-500/10 text-amber-600'
    default: return 'bg-gray-500/10 text-gray-600'
  }
}

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
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [fetchingModels, setFetchingModels] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ providerId: string; success: boolean; message: string } | null>(null)
  const [showAddProvider, setShowAddProvider] = useState(false)

  useEffect(() => {
    if (isSettingsOpen) {
      loadProviders()
      loadSettings()
    }
  }, [isSettingsOpen, loadProviders, loadSettings])

  // Get the HermesProviderDef for a given type
  const getHermesDef = (type: string): HermesProviderDef | undefined => {
    return HERMES_PROVIDERS.find(p => p.type === type)
  }

  const handleCreateProvider = async () => {
    try {
      // Look up default base URL from registry
      const def = getHermesDef(newProviderForm.type)
      await createProvider({
        name: newProviderForm.name || def?.label || newProviderForm.type,
        type: newProviderForm.type,
        baseUrl: newProviderForm.baseUrl || undefined,
        apiKey: newProviderForm.apiKey || undefined,
        isDefault: newProviderForm.isDefault,
      })
      await loadProviders()
      setNewProviderForm({ name: '', type: 'openai-compatible', baseUrl: '', apiKey: '', isDefault: false })
      setShowAddProvider(false)
    } catch (err) {
      console.error('Failed to create provider:', err)
    }
  }

  const handleQuickAddProvider = async (def: HermesProviderDef) => {
    try {
      await createProvider({
        name: def.label,
        type: def.type,
        baseUrl: def.defaultBaseUrl || undefined,
        isDefault: false,
      })
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
      setTestResult({
        providerId,
        success: true,
        message: `Found ${modelCount} models`,
      })
    } catch (err: any) {
      setTestResult({
        providerId,
        success: false,
        message: err.message || 'Failed to fetch models',
      })
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

  // Filter providers by search
  const filteredProviders = providerFilter
    ? providers.filter(p =>
        p.name.toLowerCase().includes(providerFilter.toLowerCase()) ||
        p.type.toLowerCase().includes(providerFilter.toLowerCase())
      )
    : providers

  // Provider types already configured
  const configuredTypes = new Set(providers.map(p => p.type))

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-2">
            <TabsList className="w-full grid grid-cols-6">
              <TabsTrigger value="providers" className="text-xs gap-1">
                <Globe className="w-3.5 h-3.5" />
                Providers
              </TabsTrigger>
              <TabsTrigger value="mcp" className="text-xs gap-1">
                <Cable className="w-3.5 h-3.5" />
                MCP
              </TabsTrigger>
              <TabsTrigger value="agent" className="text-xs gap-1">
                <Shield className="w-3.5 h-3.5" />
                Agent
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="text-xs gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs gap-1">
                <Palette className="w-3.5 h-3.5" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs gap-1">
                <Database className="w-3.5 h-3.5" />
                Data
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 max-h-[65vh]">
            {/* ========================================
                Providers Tab — Full Hermes Registry
                ======================================== */}
            <TabsContent value="providers" className="p-6 pt-4 space-y-4 m-0">
              {/* Provider Registry — Quick Add from Hermes catalog */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Hermes Provider Registry</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {HERMES_PROVIDERS.length} providers
                  </Badge>
                </div>

                {/* Search filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-muted-foreground" />
                  <Input
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    placeholder="Search providers..."
                    className="h-8 text-xs pl-8"
                  />
                </div>

                {/* Grouped provider categories */}
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

              {/* Custom Provider Add */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Configured Providers</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setShowAddProvider(!showAddProvider)}
                >
                  <Plus className="w-3 h-3" />
                  Custom Provider
                </Button>
              </div>

              {showAddProvider && (
                <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Provider Name</Label>
                      <Input
                        value={newProviderForm.name}
                        onChange={(e) => setNewProviderForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. My OpenAI"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={newProviderForm.type}
                        onValueChange={(v) => {
                          const def = getHermesDef(v)
                          setNewProviderForm(prev => ({
                            ...prev,
                            type: v as ProviderType,
                            name: prev.name || def?.label || '',
                            baseUrl: prev.baseUrl || def?.defaultBaseUrl || '',
                          }))
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HERMES_PROVIDERS.map(pt => (
                            <SelectItem key={pt.type} value={pt.type}>
                              {pt.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="openai-compatible">OpenAI Compatible</SelectItem>
                          <SelectItem value="cli">CLI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newProviderForm.type !== 'cli' && newProviderForm.type !== 'gemini-cli' && newProviderForm.type !== 'github-copilot-acp' && (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Base URL</Label>
                          <Input
                            value={newProviderForm.baseUrl}
                            onChange={(e) => setNewProviderForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                            placeholder={getHermesDef(newProviderForm.type)?.defaultBaseUrl || 'https://api.openai.com/v1'}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">API Key</Label>
                          <Input
                            type="password"
                            value={newProviderForm.apiKey}
                            onChange={(e) => setNewProviderForm(prev => ({ ...prev, apiKey: e.target.value }))}
                            placeholder={getHermesDef(newProviderForm.type)?.envVar ? `Enter ${getHermesDef(newProviderForm.type)?.envVar}` : 'sk-...'}
                            className="h-8 text-xs"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newProviderForm.isDefault}
                        onCheckedChange={(v) => setNewProviderForm(prev => ({ ...prev, isDefault: v }))}
                      />
                      <Label className="text-xs">Set as default</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowAddProvider(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={handleCreateProvider}
                        disabled={!newProviderForm.name && !newProviderForm.type}
                      >
                        <Plus className="w-3 h-3" />
                        Add Provider
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Providers */}
              <div className="space-y-2">
                {filteredProviders.map((provider) => {
                  const def = getHermesDef(provider.type)
                  return (
                    <div
                      key={provider.id}
                      className="rounded-xl border border-border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            getProviderColor(provider.type),
                          )}>
                            {provider.type.includes('cli') ? <Bot className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-sm font-medium flex items-center gap-1.5">
                              {provider.name}
                              {provider.isDefault && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600">Default</Badge>
                              )}
                              {!provider.isActive && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground">Inactive</Badge>
                              )}
                              <Badge className={cn('text-[8px] h-4 px-1.5 border-0', getAuthBadge(provider.authType))}>
                                {provider.authType || 'unknown'}
                              </Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <span>{provider.type}</span>
                              {provider.baseUrl && (
                                <>
                                  <span>·</span>
                                  <span className="truncate max-w-[200px]">{provider.baseUrl}</span>
                                </>
                              )}
                              {def?.description && !provider.baseUrl && (
                                <>
                                  <span>·</span>
                                  <span>{def.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleFetchModels(provider.id)}
                            disabled={fetchingModels === provider.id}
                          >
                            {fetchingModels === provider.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            Models
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteProvider(provider.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Test result */}
                      {testResult?.providerId === provider.id && (
                        <div className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs',
                          testResult.success ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                        )}>
                          {testResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {testResult.message}
                        </div>
                      )}

                      {/* Models list */}
                      {provider.models && (() => {
                        try {
                          const models = JSON.parse(provider.models) as ModelInfo[]
                          if (models.length === 0) return null
                          return (
                            <div className="flex flex-wrap gap-1">
                              {models.slice(0, 10).map((model) => (
                                <Badge key={model.id} variant="outline" className="text-[10px] h-5">
                                  {model.name || model.id}
                                </Badge>
                              ))}
                              {models.length > 10 && (
                                <Badge variant="outline" className="text-[10px] h-5">
                                  +{models.length - 10} more
                                </Badge>
                              )}
                            </div>
                          )
                        } catch { return null }
                      })()}
                    </div>
                  )
                })}

                {providers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No providers configured. Click a provider from the registry above to add it.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* MCP Tab */}
            <TabsContent value="mcp" className="p-6 pt-4 m-0">
              <McpConfigPanel />
            </TabsContent>

            {/* Agent Tab */}
            <TabsContent value="agent" className="p-6 pt-4 space-y-4 m-0">
              <div className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Agent Governance</span>
                </div>

                {/* God Mode / Safe Mode */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      settings.godMode ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                    )}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        {settings.godMode ? 'God Mode' : 'Safe Mode'}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {settings.godMode
                          ? 'Agent can execute ANY command without confirmation. Use with caution.'
                          : 'Agent asks for confirmation before destructive actions.'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.godMode || false}
                    onCheckedChange={(v) => handleUpdateSetting('godMode', v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Auto-approve all commands</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow the agent to execute terminal commands without confirmation
                    </p>
                  </div>
                  <Switch
                    checked={settings.agentAutoApprove}
                    onCheckedChange={(v) => handleUpdateSetting('agentAutoApprove', v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Require confirmation for destructive actions</Label>
                    <p className="text-xs text-muted-foreground">
                      Ask before running commands like rm, del, format, etc.
                    </p>
                  </div>
                  <Switch
                    checked={settings.agentRequireConfirm}
                    onCheckedChange={(v) => handleUpdateSetting('agentRequireConfirm', v)}
                  />
                </div>

                <Separator />

                {/* 24/7 Daemon Mode */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10 text-violet-500">
                      <Settings2 className="w-4 h-4" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">24/7 Background Daemon</Label>
                      <p className="text-xs text-muted-foreground">
                        Run agents continuously in the background, even when the UI is closed
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.daemonEnabled || false}
                    onCheckedChange={(v) => handleUpdateSetting('daemonEnabled', v)}
                  />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-sm">Root workspace directory</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    The default directory where the agent will operate
                  </p>
                  <Input
                    value={settings.agentWorkspaceDir || ''}
                    onChange={(e) => handleUpdateSetting('agentWorkspaceDir', e.target.value)}
                    placeholder="/home/user/workspace"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Memory & Reflection Settings */}
              <div className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-medium">Memory & Reflection</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Long-Term Memory</Label>
                    <p className="text-xs text-muted-foreground">Store and recall information across sessions</p>
                  </div>
                  <Switch
                    checked={settings.memoryEnabled ?? true}
                    onCheckedChange={(v) => handleUpdateSetting('memoryEnabled', v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Auto-summarize conversations</Label>
                    <p className="text-xs text-muted-foreground">Automatically create memory entries from conversations</p>
                  </div>
                  <Switch
                    checked={settings.memoryAutoSummarize ?? true}
                    onCheckedChange={(v) => handleUpdateSetting('memoryAutoSummarize', v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Daily Reflection</Label>
                    <p className="text-xs text-muted-foreground">Agent reviews its performance and learns from past tasks</p>
                  </div>
                  <Switch
                    checked={settings.reflectionEnabled ?? true}
                    onCheckedChange={(v) => handleUpdateSetting('reflectionEnabled', v)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium">Global System Prompt</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This system prompt will be prepended to every conversation and agent task.
                </p>
                <Textarea
                  value={settings.globalSystemPrompt || ''}
                  onChange={(e) => handleUpdateSetting('globalSystemPrompt', e.target.value)}
                  placeholder="You are a helpful AI assistant with access to the user's local machine..."
                  className="min-h-[120px] text-xs"
                />
              </div>
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="p-6 pt-4 m-0">
              <WhatsAppPanel />
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="p-6 pt-4 space-y-4 m-0">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Theme</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      className={cn(
                        'rounded-lg border-2 p-3 text-center transition-colors',
                        settings.theme === theme
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                      onClick={() => handleUpdateSetting('theme', theme)}
                    >
                      <div className="text-xs font-medium capitalize">{theme}</div>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="p-6 pt-4 space-y-4 m-0">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-medium">Data Management</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Export Chat History</Label>
                      <p className="text-xs text-muted-foreground">
                        Download all conversations as JSON
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={async () => {
                        try {
                          const { fetchConversations } = await import('@/lib/api')
                          const convs = await fetchConversations()
                          const blob = new Blob([JSON.stringify(convs, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'hermes-chat-export.json'
                          a.click()
                          URL.revokeObjectURL(url)
                        } catch (err) {
                          console.error('Export failed:', err)
                        }
                      }}
                    >
                      Export
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Import Chat History</Label>
                      <p className="text-xs text-muted-foreground">
                        Import conversations from a JSON file
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = '.json'
                        input.onchange = async (e: any) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const text = await file.text()
                              const data = JSON.parse(text)
                              console.log('Import data:', data)
                            } catch (err) {
                              console.error('Import failed:', err)
                            }
                          }
                        }
                        input.click()
                      }}
                    >
                      Import
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm text-destructive">Clear All History</Label>
                      <p className="text-xs text-muted-foreground">
                        Permanently delete all conversations and messages
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={async () => {
                        if (confirm('Are you sure? This will delete ALL conversations permanently.')) {
                          try {
                            const { fetchConversations, deleteConversation } = await import('@/lib/api')
                            const convs = await fetchConversations()
                            for (const conv of convs) {
                              await deleteConversation(conv.id)
                            }
                            await loadProviders()
                          } catch (err) {
                            console.error('Clear failed:', err)
                          }
                        }
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
