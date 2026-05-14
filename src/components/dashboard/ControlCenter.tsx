'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bot,
  Server,
  Database,
  Cpu,
  HardDrive,
  Circle,
  RefreshCw,
  Brain,
  Lightbulb,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import type { AgentSwarm, AgentStatus, McpServer, Memory, ReflectionLog, ReflectionType } from '@/lib/types'

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const statusDotClass: Record<AgentStatus, string> = {
  idle: 'bg-gray-400',
  running: 'bg-emerald-500 animate-pulse',
  paused: 'bg-yellow-500',
  error: 'bg-red-500',
  completed: 'bg-blue-500',
}

const statusLabel: Record<AgentStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  paused: 'Paused',
  error: 'Error',
  completed: 'Completed',
}

const reflectionBadge: Record<ReflectionType, { color: string; icon: React.ElementType }> = {
  daily: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: BookOpen },
  'task-complete': { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: Lightbulb },
  'error-recovery': { color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertTriangle },
  learning: { color: 'bg-violet-500/10 text-violet-600 border-violet-500/30', icon: Brain },
}

// ---------------------------------------------------------------------------
// Control Center
// ---------------------------------------------------------------------------

export function ControlCenter() {
  const [agents, setAgents] = useState<AgentSwarm[]>([])
  const [mcpServers, setMcpServers] = useState<McpServer[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [reflections, setReflections] = useState<ReflectionLog[]>([])
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [agentsRes, mcpRes, memRes, refRes] = await Promise.allSettled([
        fetch('/api/swarm'),
        fetch('/api/mcp'),
        fetch('/api/memory'),
        fetch('/api/reflections'),
      ])

      if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
        setAgents(await agentsRes.value.json())
      }
      if (mcpRes.status === 'fulfilled' && mcpRes.value.ok) {
        setMcpServers(await mcpRes.value.json())
      }
      if (memRes.status === 'fulfilled' && memRes.value.ok) {
        setMemories(await memRes.value.json())
      }
      if (refRes.status === 'fulfilled' && refRes.value.ok) {
        setReflections(await refRes.value.json())
      }
    } catch (err) {
      console.error('Failed to load control center data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Computed stats
  const activeAgents = agents.filter((a) => a.status === 'running').length
  const connectedServers = mcpServers.filter((s) => s.isConnected).length
  const memoryCount = memories.length

  // Memory by type
  const memoryByType = memories.reduce<Record<string, number>>((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1
    return acc
  }, {})
  const maxMemCount = Math.max(...Object.values(memoryByType), 1)

  const memoryTypeColors: Record<string, string> = {
    fact: 'bg-emerald-500',
    preference: 'bg-blue-500',
    context: 'bg-violet-500',
    'conversation-summary': 'bg-amber-500',
    'learned-pattern': 'bg-cyan-500',
    reflection: 'bg-rose-500',
  }

  // Recent reflections (last 5)
  const recentReflections = [...reflections]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-500" />
          <span className="text-sm font-medium">Control Center</span>
        </div>
        <button
          onClick={loadAll}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          disabled={loading}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* System Stats Row */}
      <div className="grid grid-cols-5 gap-2">
        <Card className="p-3 flex flex-col items-center gap-1">
          <Bot className="w-4 h-4 text-amber-500" />
          <div className="text-lg font-bold">{activeAgents}</div>
          <div className="text-[9px] text-muted-foreground">Active Agents</div>
        </Card>
        <Card className="p-3 flex flex-col items-center gap-1">
          <Server className="w-4 h-4 text-violet-500" />
          <div className="text-lg font-bold">{connectedServers}</div>
          <div className="text-[9px] text-muted-foreground">MCP Connected</div>
        </Card>
        <Card className="p-3 flex flex-col items-center gap-1">
          <Database className="w-4 h-4 text-emerald-500" />
          <div className="text-lg font-bold">{memoryCount}</div>
          <div className="text-[9px] text-muted-foreground">Memories</div>
        </Card>
        <Card className="p-3 flex flex-col items-center gap-1">
          <Cpu className="w-4 h-4 text-cyan-500" />
          <div className="text-lg font-bold">--</div>
          <div className="text-[9px] text-muted-foreground">CPU %</div>
        </Card>
        <Card className="p-3 flex flex-col items-center gap-1">
          <HardDrive className="w-4 h-4 text-rose-500" />
          <div className="text-lg font-bold">--</div>
          <div className="text-[9px] text-muted-foreground">RAM %</div>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agent Status Grid (compact) */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium">Agent Status</span>
            <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
              {agents.length}
            </Badge>
          </div>
          <ScrollArea className="max-h-48">
            {agents.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4">
                No agents registered
              </div>
            ) : (
              <div className="space-y-1.5">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Circle
                        className={cn(
                          'w-2 h-2 fill-current',
                          statusDotClass[agent.status]
                        )}
                      />
                      <span className="text-xs font-medium truncate max-w-[120px]">
                        {agent.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground">
                        {agent.role}
                      </span>
                      <Badge
                        className={cn(
                          'text-[8px] h-3.5 px-1',
                          agent.status === 'running' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                          agent.status === 'idle' && 'bg-gray-100 text-gray-600 border-gray-200',
                          agent.status === 'paused' && 'bg-yellow-100 text-yellow-600 border-yellow-200',
                          agent.status === 'error' && 'bg-red-100 text-red-600 border-red-200',
                          agent.status === 'completed' && 'bg-blue-100 text-blue-600 border-blue-200'
                        )}
                        variant="outline"
                      >
                        {statusLabel[agent.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* MCP Connections Status */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-medium">MCP Connections</span>
            <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
              {mcpServers.length}
            </Badge>
          </div>
          <ScrollArea className="max-h-48">
            {mcpServers.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4">
                No MCP servers configured
              </div>
            ) : (
              <div className="space-y-1.5">
                {mcpServers.map((server) => (
                  <div
                    key={server.id}
                    className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Circle
                        className={cn(
                          'w-2 h-2 fill-current',
                          server.isConnected
                            ? 'bg-emerald-500'
                            : server.isActive
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        )}
                      />
                      <span className="text-xs font-medium">{server.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          'text-[8px] h-3.5 px-1',
                          server.transportType === 'stdio'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        )}
                        variant="outline"
                      >
                        {server.transportType}
                      </Badge>
                      <span
                        className={cn(
                          'text-[9px] font-medium',
                          server.isConnected
                            ? 'text-emerald-600'
                            : server.isActive
                            ? 'text-red-600'
                            : 'text-gray-400'
                        )}
                      >
                        {server.isConnected ? 'Connected' : server.isActive ? 'Disconnected' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Recent Reflections */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-xs font-medium">Recent Reflections</span>
          <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
            {recentReflections.length}
          </Badge>
        </div>
        <ScrollArea className="max-h-48">
          {recentReflections.length === 0 ? (
            <div className="text-[10px] text-muted-foreground text-center py-4">
              No reflections recorded
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentReflections.map((ref) => {
                const badge = reflectionBadge[ref.type]
                const Icon = badge?.icon || Brain
                return (
                  <div
                    key={ref.id}
                    className="flex items-start gap-2 rounded-md border border-border px-2.5 py-2"
                  >
                    <Badge
                      className={cn('text-[8px] h-4 px-1.5 shrink-0', badge?.color)}
                      variant="outline"
                    >
                      <Icon className="w-2.5 h-2.5 mr-0.5" />
                      {ref.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{ref.summary}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">
                        {new Date(ref.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {ref.successRate !== null && ref.successRate !== undefined && (
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {Math.round(ref.successRate * 100)}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Memory Stats */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-xs font-medium">Memory Stats</span>
          <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
            {memoryCount} entries
          </Badge>
        </div>
        {Object.keys(memoryByType).length === 0 ? (
          <div className="text-[10px] text-muted-foreground text-center py-4">
            No memories stored
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(memoryByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-32 truncate">
                    {type}
                  </span>
                  <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded transition-all',
                        memoryTypeColors[type] || 'bg-gray-500'
                      )}
                      style={{ width: `${(count / maxMemCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium w-8 text-right">{count}</span>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  )
}
