'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Server,
  Plug,
  Unplug,
  Search,
  Wrench,
  FileText,
  ChevronDown,
  ChevronRight,
  Circle,
} from 'lucide-react'
import type { McpServer, McpTool, McpResource, McpTransportType } from '@/lib/types'

// ---------------------------------------------------------------------------
// MCP Config Panel
// ---------------------------------------------------------------------------

export function McpConfigPanel() {
  const [servers, setServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  // Add form state
  const [form, setForm] = useState({
    name: '',
    command: '',
    args: '[]',
    envVars: '{}',
    transportType: 'stdio' as McpTransportType,
    serverUrl: '',
  })

  const loadServers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mcp')
      if (res.ok) {
        const data = await res.json()
        setServers(data)
      }
    } catch (err) {
      console.error('Failed to load MCP servers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadServers()
  }, [loadServers])

  const handleAdd = async () => {
    try {
      let parsedArgs: unknown[]
      let parsedEnv: Record<string, string>
      try {
        parsedArgs = JSON.parse(form.args)
      } catch {
        parsedArgs = []
      }
      try {
        parsedEnv = JSON.parse(form.envVars)
      } catch {
        parsedEnv = {}
      }

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          command: form.command,
          args: JSON.stringify(parsedArgs),
          envVars: JSON.stringify(parsedEnv),
          transportType: form.transportType,
          serverUrl: form.transportType === 'sse' ? form.serverUrl : null,
        }),
      })
      if (res.ok) {
        setForm({ name: '', command: '', args: '[]', envVars: '{}', transportType: 'stdio', serverUrl: '' })
        setShowAddForm(false)
        await loadServers()
      }
    } catch (err) {
      console.error('Failed to add MCP server:', err)
    }
  }

  const handleConnect = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await fetch(`/api/mcp/${id}/connect`, { method: 'POST' })
      await loadServers()
    } catch (err) {
      console.error('Failed to connect:', err)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDisconnect = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await fetch(`/api/mcp/${id}/disconnect`, { method: 'POST' })
      await loadServers()
    } catch (err) {
      console.error('Failed to disconnect:', err)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDiscover = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [`discover-${id}`]: true }))
    try {
      await fetch(`/api/mcp/${id}/discover`, { method: 'POST' })
      await loadServers()
    } catch (err) {
      console.error('Failed to discover tools:', err)
    } finally {
      setActionLoading((prev) => ({ ...prev, [`discover-${id}`]: false }))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/mcp/${id}`, { method: 'DELETE' })
      await loadServers()
    } catch (err) {
      console.error('Failed to delete MCP server:', err)
    }
  }

  const parseTools = (raw: string | null | undefined): McpTool[] => {
    if (!raw) return []
    try {
      return JSON.parse(raw) as McpTool[]
    } catch {
      return []
    }
  }

  const parseResources = (raw: string | null | undefined): McpResource[] => {
    if (!raw) return []
    try {
      return JSON.parse(raw) as McpResource[]
    } catch {
      return []
    }
  }

  const getStatusColor = (server: McpServer) => {
    if (server.isConnected) return 'bg-emerald-500'
    if (server.isActive) return 'bg-red-500'
    return 'bg-gray-400'
  }

  const getStatusLabel = (server: McpServer) => {
    if (server.isConnected) return 'Connected'
    if (server.isActive) return 'Disconnected'
    return 'Inactive'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-medium">MCP Servers</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {servers.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={loadServers}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-3 h-3" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Add Server Form */}
      {showAddForm && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium">Add MCP Server</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="my-mcp-server"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Transport Type</Label>
              <Select
                value={form.transportType}
                onValueChange={(v) => setForm((p) => ({ ...p, transportType: v as McpTransportType }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stdio">stdio</SelectItem>
                  <SelectItem value="sse">sse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Command</Label>
              <Input
                value={form.command}
                onChange={(e) => setForm((p) => ({ ...p, command: e.target.value }))}
                placeholder={form.transportType === 'stdio' ? 'npx -y @my/mcp-server' : ''}
                className="h-8 text-xs"
                disabled={form.transportType === 'sse'}
              />
            </div>
            {form.transportType === 'sse' && (
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs">Server URL</Label>
                <Input
                  value={form.serverUrl}
                  onChange={(e) => setForm((p) => ({ ...p, serverUrl: e.target.value }))}
                  placeholder="http://localhost:3001/sse"
                  className="h-8 text-xs"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Args (JSON array)</Label>
              <Textarea
                value={form.args}
                onChange={(e) => setForm((p) => ({ ...p, args: e.target.value }))}
                placeholder='["--port", "3000"]'
                className="min-h-[60px] text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Env Vars (JSON object)</Label>
              <Textarea
                value={form.envVars}
                onChange={(e) => setForm((p) => ({ ...p, envVars: e.target.value }))}
                placeholder='{"API_KEY": "sk-..."}'
                className="min-h-[60px] text-xs font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleAdd}
              disabled={!form.name || (!form.command && form.transportType === 'stdio')}
            >
              <Plus className="w-3 h-3" />
              Add Server
            </Button>
          </div>
        </Card>
      )}

      {/* Server List */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2">
          {servers.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No MCP servers configured. Click &quot;Add Server&quot; to get started.
            </div>
          )}

          {servers.map((server) => {
            const tools = parseTools(server.discoveredTools)
            const resources = parseResources(server.discoveredResources)

            return (
              <Card key={server.id} className="p-3 space-y-2">
                {/* Server header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Circle
                      className={cn('w-2.5 h-2.5 fill-current', getStatusColor(server))}
                    />
                    <span className="text-sm font-medium">{server.name}</span>
                    <Badge
                      className={cn(
                        'text-[9px] h-4 px-1.5',
                        server.transportType === 'stdio'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      )}
                      variant="outline"
                    >
                      {server.transportType}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {getStatusLabel(server)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Connect / Disconnect */}
                    {server.isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] gap-1"
                        onClick={() => handleDisconnect(server.id)}
                        disabled={actionLoading[server.id]}
                      >
                        {actionLoading[server.id] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Unplug className="w-3 h-3" />
                        )}
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] gap-1"
                        onClick={() => handleConnect(server.id)}
                        disabled={actionLoading[server.id]}
                      >
                        {actionLoading[server.id] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plug className="w-3 h-3" />
                        )}
                        Connect
                      </Button>
                    )}

                    {/* Discover Tools */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] gap-1"
                      onClick={() => handleDiscover(server.id)}
                      disabled={!server.isConnected || actionLoading[`discover-${server.id}`]}
                    >
                      {actionLoading[`discover-${server.id}`] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Search className="w-3 h-3" />
                      )}
                      Discover
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(server.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Server details */}
                <div className="text-[10px] text-muted-foreground pl-4">
                  <span>Command: {server.command}</span>
                  {server.serverUrl && <span className="ml-3">URL: {server.serverUrl}</span>}
                </div>

                {/* Discovered Tools (collapsible) */}
                {tools.length > 0 && (
                  <Collapsible
                    open={expandedTools[server.id]}
                    onOpenChange={(open) =>
                      setExpandedTools((prev) => ({ ...prev, [server.id]: open }))
                    }
                  >
                    <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] font-medium text-violet-500 hover:text-violet-400 w-full pl-4">
                      {expandedTools[server.id] ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <Wrench className="w-3 h-3" />
                      {tools.length} Tool{tools.length !== 1 ? 's' : ''}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-8 mt-1 space-y-1.5">
                        {tools.map((tool) => (
                          <div
                            key={tool.name}
                            className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5"
                          >
                            <div className="text-xs font-medium">{tool.name}</div>
                            {tool.description && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {tool.description}
                              </div>
                            )}
                            {tool.inputSchema && (
                              <div className="mt-1">
                                <span className="text-[9px] text-muted-foreground font-medium">
                                  Input Schema:
                                </span>
                                <pre className="text-[9px] text-muted-foreground mt-0.5 bg-muted/50 rounded p-1.5 overflow-x-auto max-h-24">
                                  {JSON.stringify(tool.inputSchema, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Discovered Resources (collapsible) */}
                {resources.length > 0 && (
                  <Collapsible
                    open={expandedResources[server.id]}
                    onOpenChange={(open) =>
                      setExpandedResources((prev) => ({ ...prev, [server.id]: open }))
                    }
                  >
                    <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] font-medium text-cyan-500 hover:text-cyan-400 w-full pl-4">
                      {expandedResources[server.id] ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      <FileText className="w-3 h-3" />
                      {resources.length} Resource{resources.length !== 1 ? 's' : ''}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pl-8 mt-1 space-y-1">
                        {resources.map((resource) => (
                          <div
                            key={resource.uri}
                            className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5"
                          >
                            <div className="text-xs font-medium">{resource.name}</div>
                            <div className="text-[10px] text-muted-foreground">{resource.uri}</div>
                            {resource.description && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {resource.description}
                              </div>
                            )}
                            {resource.mimeType && (
                              <Badge
                                variant="outline"
                                className="text-[8px] h-3.5 px-1 mt-1"
                              >
                                {resource.mimeType}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Last connected */}
                {server.lastConnectedAt && (
                  <div className="text-[9px] text-muted-foreground pl-4">
                    Last connected:{' '}
                    {new Date(server.lastConnectedAt).toLocaleString()}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
