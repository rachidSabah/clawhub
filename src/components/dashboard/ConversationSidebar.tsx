'use client'

import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { createConversation, deleteConversation, updateConversation } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { MessageSquarePlus, Bot, Trash2, Archive, Pencil, Check, X, Code2, Monitor, Cpu, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday, subDays } from 'date-fns'

// Prebuilt agent definitions
const PREBUILT_AGENTS = [
  {
    id: 'hermes-agent',
    name: 'Hermes Agent',
    description: 'Full AI capacity — unlimited capabilities',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-600',
    mode: 'agent' as const,
  },
  {
    id: 'hermes-coder',
    name: 'Hermes Coder',
    description: 'Autonomous coding & debugging',
    icon: Code2,
    color: 'from-cyan-500 to-blue-600',
    mode: 'agent' as const,
  },
  {
    id: 'hermes-fullstack',
    name: 'Hermes Full-Stack',
    description: 'Complete web application builder',
    icon: Cpu,
    color: 'from-emerald-500 to-teal-600',
    mode: 'agent' as const,
  },
  {
    id: 'hermes-sysadmin',
    name: 'Hermes SysAdmin',
    description: 'System administration & DevOps',
    icon: Monitor,
    color: 'from-orange-500 to-red-600',
    mode: 'agent' as const,
  },
]

export function ConversationSidebar() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    loadConversations,
    loadMessages,
    clearAgentLog,
    swarmAgents,
    loadSwarmAgents,
  } = useAppStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showAgents, setShowAgents] = useState(true)

  useEffect(() => {
    loadConversations()
    loadSwarmAgents()
  }, [loadConversations, loadSwarmAgents])

  const groupedConversations = useMemo(() => {
    const groups: Record<string, typeof conversations> = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': [],
    }

    for (const conv of conversations) {
      if (conv.isArchived) continue
      const date = new Date(conv.updatedAt)
      if (isToday(date)) groups['Today'].push(conv)
      else if (isYesterday(date)) groups['Yesterday'].push(conv)
      else if (date > subDays(new Date(), 7)) groups['Previous 7 Days'].push(conv)
      else groups['Older'].push(conv)
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0)
  }, [conversations])

  const handleNewChat = async (mode: 'chat' | 'agent' = 'chat', title?: string) => {
    try {
      const conv = await createConversation({
        title: title || (mode === 'agent' ? 'New Agent Task' : 'New Chat'),
        mode,
      })
      await loadConversations()
      setActiveConversation(conv.id)
      clearAgentLog()
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const handleStartPrebuiltAgent = async (agent: typeof PREBUILT_AGENTS[number]) => {
    try {
      // Find the matching swarm agent for system prompt
      const swarmAgent = swarmAgents.find(a => a.name === agent.name)
      const conv = await createConversation({
        title: `${agent.name} Task`,
        mode: 'agent',
        systemPrompt: swarmAgent?.systemPrompt || undefined,
      })
      await loadConversations()
      setActiveConversation(conv.id)
      clearAgentLog()
    } catch (err) {
      console.error('Failed to start agent:', err)
    }
  }

  const handleSelect = async (id: string) => {
    setActiveConversation(id)
    await loadMessages(id)
    clearAgentLog()
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteConversation(id)
      await loadConversations()
      if (activeConversationId === id) {
        setActiveConversation(null)
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updateConversation(id, { isArchived: true } as any)
      await loadConversations()
    } catch (err) {
      console.error('Failed to archive conversation:', err)
    }
  }

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const saveEdit = async (id: string) => {
    try {
      await updateConversation(id, { title: editTitle } as any)
      await loadConversations()
    } catch (err) {
      console.error('Failed to update title:', err)
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Hermes AI</span>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-1.5 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => handleNewChat('chat')}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            New Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => handleNewChat('agent')}
          >
            <Bot className="w-3.5 h-3.5" />
            Agent
          </Button>
        </div>

        {/* Prebuilt Agents Section */}
        <div>
          <button
            className="flex items-center gap-1.5 w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
            onClick={() => setShowAgents(!showAgents)}
          >
            {showAgents ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Quick Start Agents
          </button>
          {showAgents && (
            <div className="grid grid-cols-2 gap-1 mt-1">
              {PREBUILT_AGENTS.map((agent) => {
                const Icon = agent.icon
                return (
                  <button
                    key={agent.id}
                    className="flex flex-col items-start gap-0.5 rounded-lg border border-border p-2 text-left hover:bg-accent/50 transition-colors"
                    onClick={() => handleStartPrebuiltAgent(agent)}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        'w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br',
                        agent.color
                      )}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-medium leading-tight">{agent.name}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground leading-tight pl-[26px]">{agent.description}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {groupedConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conversations yet
            </div>
          ) : (
            groupedConversations.map(([group, items]) => (
              <div key={group} className="mb-3">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group}
                </div>
                {items.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-sm transition-colors mb-0.5',
                      activeConversationId === conv.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50 text-foreground/80'
                    )}
                    onClick={() => handleSelect(conv.id)}
                  >
                    {conv.mode === 'agent' ? (
                      <Bot className="w-4 h-4 shrink-0 text-emerald-500" />
                    ) : (
                      <MessageSquarePlus className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      {editingId === conv.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(conv.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            className="flex-1 bg-background border rounded px-1.5 py-0.5 text-xs outline-none focus:ring-1 ring-ring"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(conv.id)} className="p-0.5 hover:text-emerald-500">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={cancelEdit} className="p-0.5 hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="truncate">{conv.title}</span>
                          {conv.provider === 'whatsapp' && (
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-emerald-500/30 text-emerald-600">
                              WA
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        onClick={(e) => startEditing(conv.id, conv.title, e)}
                        className="p-1 rounded hover:bg-accent/80"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleArchive(conv.id, e)}
                        className="p-1 rounded hover:bg-accent/80"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 rounded hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
