'use client'

import { useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { createConversation, deleteConversation, updateConversation } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquarePlus, Bot, Trash2, Archive, Pencil, Check, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday, subDays } from 'date-fns'

export function ConversationSidebar() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    loadConversations,
    loadMessages,
    clearAgentLog,
  } = useAppStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const groupedConversations = useMemo(() => {
    const groups: Record<string, typeof conversations> = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': [],
    }

    for (const conv of conversations) {
      const date = new Date(conv.updatedAt)
      if (isToday(date)) groups['Today'].push(conv)
      else if (isYesterday(date)) groups['Yesterday'].push(conv)
      else if (date > subDays(new Date(), 7)) groups['Previous 7 Days'].push(conv)
      else groups['Older'].push(conv)
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0)
  }, [conversations])

  const handleNewChat = async (mode: 'chat' | 'agent' = 'chat') => {
    try {
      const conv = await createConversation({
        title: mode === 'agent' ? 'New Agent Task' : 'New Chat',
        mode,
      })
      await loadConversations()
      setActiveConversation(conv.id)
      clearAgentLog()
    } catch (err) {
      console.error('Failed to create conversation:', err)
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
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Hermes AI</span>
          </div>
        </div>
        <div className="flex gap-1.5">
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
            Agent Task
          </Button>
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
                        <span className="truncate block">{conv.title}</span>
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
