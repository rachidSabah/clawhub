'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Play,
  Square,
  PlayCircle,
  StopCircle,
  Bot,
  Zap,
  Circle,
  Activity,
} from 'lucide-react'
import type { AgentSwarm, AgentStatus } from '@/lib/types'

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

const statusConfig: Record<AgentStatus, { color: string; label: string; dotClass: string }> = {
  idle: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Idle', dotClass: 'bg-gray-400' },
  running: { color: 'bg-emerald-100 text-emerald-600 border-emerald-200', label: 'Running', dotClass: 'bg-emerald-500 animate-pulse' },
  paused: { color: 'bg-yellow-100 text-yellow-600 border-yellow-200', label: 'Paused', dotClass: 'bg-yellow-500' },
  error: { color: 'bg-red-100 text-red-600 border-red-200', label: 'Error', dotClass: 'bg-red-500' },
  completed: { color: 'bg-blue-100 text-blue-600 border-blue-200', label: 'Completed', dotClass: 'bg-blue-500' },
}

// ---------------------------------------------------------------------------
// Agent Swarm Panel
// ---------------------------------------------------------------------------

export function AgentSwarmPanel() {
  const [agents, setAgents] = useState<AgentSwarm[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [startTaskInput, setStartTaskInput] = useState<Record<string, string>>({})

  // Add form state
  const [form, setForm] = useState({
    name: '',
    role: '',
    systemPrompt: '',
    provider: '',
    model: '',
    workspaceDir: '',
    autoApprove: false,
    maxIterations: 10,
    isDaemon: false,
  })

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/swarm')
      if (res.ok) {
        const data = await res.json()
        setAgents(data)
      }
    } catch (err) {
      console.error('Failed to load agents:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          systemPrompt: form.systemPrompt || null,
          providerId: form.provider || null,
          model: form.model || null,
          workspaceDir: form.workspaceDir || null,
          autoApprove: form.autoApprove,
          maxIterations: form.maxIterations,
          isDaemon: form.isDaemon,
        }),
      })
      if (res.ok) {
        setForm({
          name: '',
          role: '',
          systemPrompt: '',
          provider: '',
          model: '',
          workspaceDir: '',
          autoApprove: false,
          maxIterations: 10,
          isDaemon: false,
        })
        setShowAddForm(false)
        await loadAgents()
      }
    } catch (err) {
      console.error('Failed to add agent:', err)
    }
  }

  const handleStart = async (id: string) => {
    const task = startTaskInput[id] || ''
    setActionLoading((prev) => ({ ...prev, [`start-${id}`]: true }))
    try {
      await fetch(`/api/swarm/${id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      })
      setStartTaskInput((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await loadAgents()
    } catch (err) {
      console.error('Failed to start agent:', err)
    } finally {
      setActionLoading((prev) => ({ ...prev, [`start-${id}`]: false }))
    }
  }

  const handleStop = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [`stop-${id}`]: true }))
    try {
      await fetch(`/api/swarm/${id}/stop`, { method: 'POST' })
      await loadAgents()
    } catch (err) {
      console.error('Failed to stop agent:', err)
    } finally {
      setActionLoading((prev) => ({ ...prev, [`stop-${id}`]: false }))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/swarm/${id}`, { method: 'DELETE' })
      await loadAgents()
    } catch (err) {
      console.error('Failed to delete agent:', err)
    }
  }

  const handleStartAll = async () => {
    const idleAgents = agents.filter((a) => a.status === 'idle')
    for (const agent of idleAgents) {
      try {
        await fetch(`/api/swarm/${agent.id}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: '' }),
        })
      } catch (err) {
        console.error(`Failed to start agent ${agent.id}:`, err)
      }
    }
    await loadAgents()
  }

  const handleStopAll = async () => {
    const runningAgents = agents.filter((a) => a.status === 'running')
    for (const agent of runningAgents) {
      try {
        await fetch(`/api/swarm/${agent.id}/stop`, { method: 'POST' })
      } catch (err) {
        console.error(`Failed to stop agent ${agent.id}:`, err)
      }
    }
    await loadAgents()
  }

  const activeAgents = agents.filter((a) => a.status === 'running').length
  const runningAgents = agents.filter((a) => a.status === 'running')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">Agent Swarm</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {agents.length} total
          </Badge>
          {activeAgents > 0 && (
            <Badge className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30" variant="outline">
              <Activity className="w-2.5 h-2.5 mr-0.5" />
              {activeAgents} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={loadAgents}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
          {runningAgents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1"
              onClick={handleStopAll}
            >
              <StopCircle className="w-3 h-3" />
              Stop All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1"
            onClick={handleStartAll}
            disabled={agents.filter((a) => a.status === 'idle').length === 0}
          >
            <PlayCircle className="w-3 h-3" />
            Start All
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-3 h-3" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Add Agent Form */}
      {showAddForm && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium">Add Agent</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="research-agent"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                placeholder="researcher"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">System Prompt</Label>
              <Textarea
                value={form.systemPrompt}
                onChange={(e) => setForm((p) => ({ ...p, systemPrompt: e.target.value }))}
                placeholder="You are a research agent that..."
                className="min-h-[60px] text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Provider ID</Label>
              <Input
                value={form.provider}
                onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
                placeholder="provider-uuid"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                placeholder="gpt-4o"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Workspace Directory</Label>
              <Input
                value={form.workspaceDir}
                onChange={(e) => setForm((p) => ({ ...p, workspaceDir: e.target.value }))}
                placeholder="/home/user/workspace"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max Iterations</Label>
              <Input
                type="number"
                value={form.maxIterations}
                onChange={(e) => setForm((p) => ({ ...p, maxIterations: parseInt(e.target.value) || 10 }))}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.autoApprove}
                onCheckedChange={(v) => setForm((p) => ({ ...p, autoApprove: v }))}
              />
              <Label className="text-xs">Auto Approve</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isDaemon}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isDaemon: v }))}
              />
              <Label className="text-xs">Daemon</Label>
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
              disabled={!form.name || !form.role}
            >
              <Plus className="w-3 h-3" />
              Add Agent
            </Button>
          </div>
        </Card>
      )}

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {agents.length === 0 && !loading && (
          <div className="col-span-2 text-center py-8 text-muted-foreground text-xs">
            No agents created. Click &quot;Add Agent&quot; to get started.
          </div>
        )}

        {agents.map((agent) => {
          const st = statusConfig[agent.status]
          return (
            <Card key={agent.id} className="p-4 space-y-2.5">
              {/* Agent header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Bot className="w-4 h-4" />
                    {agent.status === 'running' && (
                      <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500 absolute -top-0.5 -right-0.5 animate-pulse" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{agent.name}</span>
                  {agent.isDaemon && (
                    <Badge className="text-[8px] h-3.5 px-1 bg-amber-500/10 text-amber-600 border-amber-500/30" variant="outline">
                      <Zap className="w-2 h-2 mr-0.5" />
                      Daemon
                    </Badge>
                  )}
                </div>
                <Badge
                  className={cn('text-[9px] h-4 px-1.5', st.color)}
                  variant="outline"
                >
                  <Circle className={cn('w-1.5 h-1.5 fill-current mr-1', st.dotClass)} />
                  {st.label}
                </Badge>
              </div>

              {/* Agent info */}
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <div>Role: <span className="text-foreground">{agent.role}</span></div>
                {agent.currentTask && (
                  <div className="truncate">
                    Task: <span className="text-foreground">{agent.currentTask}</span>
                  </div>
                )}
                {agent.model && (
                  <div>Model: <span className="text-foreground">{agent.model}</span></div>
                )}
              </div>

              {/* Iteration counter */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">Iterations:</span>
                <span className="font-medium">
                  {agent.iterationCount} / {agent.maxIterations}
                </span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (agent.iterationCount / agent.maxIterations) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <Separator />

              {/* Task input for idle agents */}
              {agent.status === 'idle' && (
                <div className="flex gap-1.5">
                  <Input
                    value={startTaskInput[agent.id] || ''}
                    onChange={(e) =>
                      setStartTaskInput((prev) => ({ ...prev, [agent.id]: e.target.value }))
                    }
                    placeholder="Task description..."
                    className="h-7 text-[10px] flex-1"
                  />
                  <Button
                    size="sm"
                    className="h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleStart(agent.id)}
                    disabled={actionLoading[`start-${agent.id}`]}
                  >
                    {actionLoading[`start-${agent.id}`] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Start
                  </Button>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                {agent.status === 'running' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => handleStop(agent.id)}
                    disabled={actionLoading[`stop-${agent.id}`]}
                  >
                    {actionLoading[`stop-${agent.id}`] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Square className="w-3 h-3" />
                    )}
                    Stop
                  </Button>
                )}
                {agent.status === 'paused' && (
                  <Button
                    size="sm"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => handleStart(agent.id)}
                    disabled={actionLoading[`start-${agent.id}`]}
                  >
                    {actionLoading[`start-${agent.id}`] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Resume
                  </Button>
                )}
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(agent.id)}
                  disabled={agent.status === 'running'}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Last activity */}
              {agent.lastActivityAt && (
                <div className="text-[9px] text-muted-foreground">
                  Last activity: {new Date(agent.lastActivityAt).toLocaleString()}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
