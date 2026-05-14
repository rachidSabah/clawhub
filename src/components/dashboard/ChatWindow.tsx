'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { branchConversation, deleteMessage } from '@/lib/api'
import { MessageBubble } from './MessageBubble'
import { Bot, MessageSquarePlus, Trash2, GitBranch, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function ChatWindow() {
  const {
    messages, activeConversationId, streamingContent, isAgentMode,
    setActiveConversation, loadMessages, loadConversations,
  } = useAppStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevMsgCount = useRef(0)
  const [branchingMessageId, setBranchingMessageId] = useState<string | null>(null)

  useEffect(() => {
    if (messages.length > prevMsgCount.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    prevMsgCount.current = messages.length
  }, [messages, streamingContent])

  const handleBranch = async (messageId: string) => {
    if (!activeConversationId || branchingMessageId) return
    setBranchingMessageId(messageId)
    try {
      const newConv = await branchConversation(activeConversationId, messageId)
      // Reload conversations list and switch to the branched conversation
      await loadConversations()
      setActiveConversation(newConv.id)
      await loadMessages(newConv.id)
    } catch (error) {
      console.error('Branch error:', error)
    } finally {
      setBranchingMessageId(null)
    }
  }

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto">
            {isAgentMode ? <Bot className="w-8 h-8 text-white" /> : <MessageSquarePlus className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-lg font-semibold">INFOHAS ClawHub</h2>
          <p className="text-sm text-muted-foreground max-w-xs">Start a new chat or agent task to begin</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {messages.filter(m => !m.isDeleted).map(msg => (
          <div key={msg.id} className="group relative">
            <MessageBubble message={msg} />
            <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-emerald-600"
                      disabled={branchingMessageId === msg.id}
                      onClick={() => handleBranch(msg.id)}
                    >
                      {branchingMessageId === msg.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <GitBranch className="w-3 h-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    Branch conversation from here
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        await deleteMessage(msg.id)
                        if (activeConversationId) await loadMessages(activeConversationId)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    Delete message
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
        {streamingContent && (
          <MessageBubble message={{ id: 'streaming', conversationId: '', role: 'assistant', content: streamingContent, isStreaming: true, isDeleted: false, createdAt: new Date().toISOString() }} />
        )}
      </div>
    </div>
  )
}
