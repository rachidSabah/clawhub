'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { createProvider, updateProvider, deleteProvider, fetchProviderModels, updateSettings } from '@/lib/api'
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
} from 'lucide-react'
import type { Provider, ProviderType, ModelInfo } from '@/lib/types'

const providerTypes: { value: ProviderType; label: string; description: string }[] = [
  { value: 'cli', label: 'Gemini CLI', description: 'Local Gemini CLI installation' },
  { value: 'openai-compatible', label: 'OpenAI Compatible', description: 'OpenAI, Azure, custom endpoints' },
  { value: 'anthropic', label: 'Anthropic', description: 'Claude API directly' },
  { value: 'ollama', label: 'Ollama', description: 'Local Ollama instance' },
]

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

  useEffect(() => {
    if (isSettingsOpen) {
      loadProviders()
      loadSettings()
    }
  }, [isSettingsOpen, loadProviders, loadSettings])

  const handleCreateProvider = async () => {
    try {
      await createProvider(newProviderForm)
      await loadProviders()
      setNewProviderForm({ name: '', type: 'openai-compatible', baseUrl: '', apiKey: '', isDefault: false })
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
      const models = await fetchProviderModels(providerId)
      await loadProviders()
      setTestResult({
        providerId,
        success: true,
        message: `Found ${models.length} models`,
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

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-2">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="providers" className="text-xs gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Providers
              </TabsTrigger>
              <TabsTrigger value="agent" className="text-xs gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Agent
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Data
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 max-h-[60vh]">
            {/* Providers Tab */}
            <TabsContent value="providers" className="p-6 pt-4 space-y-4 m-0">
              {/* Add Provider Form */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Add Provider</span>
                </div>
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
                      onValueChange={(v) => setNewProviderForm(prev => ({ ...prev, type: v as ProviderType }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {providerTypes.map(pt => (
                          <SelectItem key={pt.value} value={pt.value}>
                            {pt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newProviderForm.type !== 'cli' && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Base URL</Label>
                        <Input
                          value={newProviderForm.baseUrl}
                          onChange={(e) => setNewProviderForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                          placeholder={
                            newProviderForm.type === 'openai-compatible'
                              ? 'https://api.openai.com/v1'
                              : newProviderForm.type === 'anthropic'
                              ? 'https://api.anthropic.com/v1'
                              : 'http://localhost:11434'
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">API Key</Label>
                        <Input
                          type="password"
                          value={newProviderForm.apiKey}
                          onChange={(e) => setNewProviderForm(prev => ({ ...prev, apiKey: e.target.value }))}
                          placeholder="sk-..."
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
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={handleCreateProvider}
                    disabled={!newProviderForm.name}
                  >
                    <Plus className="w-3 h-3" />
                    Add Provider
                  </Button>
                </div>
              </div>

              {/* Existing Providers */}
              <div className="space-y-2">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="rounded-xl border border-border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          provider.type === 'cli' && 'bg-blue-500/10 text-blue-500',
                          provider.type === 'openai-compatible' && 'bg-emerald-500/10 text-emerald-500',
                          provider.type === 'anthropic' && 'bg-amber-500/10 text-amber-500',
                          provider.type === 'ollama' && 'bg-violet-500/10 text-violet-500',
                        )}>
                          {provider.type === 'cli' ? <Bot className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1.5">
                            {provider.name}
                            {provider.isDefault && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Default</Badge>
                            )}
                            {!provider.isActive && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground">Inactive</Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {provider.type} · {provider.baseUrl || 'Local CLI'}
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
                          Fetch Models
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
                            {models.slice(0, 8).map((model) => (
                              <Badge key={model.id} variant="outline" className="text-[10px] h-5">
                                {model.name || model.id}
                              </Badge>
                            ))}
                            {models.length > 8 && (
                              <Badge variant="outline" className="text-[10px] h-5">
                                +{models.length - 8} more
                              </Badge>
                            )}
                          </div>
                        )
                      } catch { return null }
                    })()}
                  </div>
                ))}

                {providers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No providers configured. Add one above to get started.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Agent Tab */}
            <TabsContent value="agent" className="p-6 pt-4 space-y-4 m-0">
              <div className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Agent Permissions</span>
                </div>

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
                              // TODO: implement import
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
