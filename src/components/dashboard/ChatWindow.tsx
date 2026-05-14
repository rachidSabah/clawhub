'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { MessageBubble } from './MessageBubble'
import { Bot, MessageSquarePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ChatWindow() {
  const { messages, activeConversationId, streamingContent, isAgentMode } = useAppStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevMsgCount = useRef(0)

  useEffect(() => {
    if (messages.length > prevMsgCount.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    prevMsgCount.current = messages.length
  }, [messages, streamingContent])

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
            <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={async () => { const { deleteMessage } = await import('@/lib/api'); await deleteMessage(msg.id) }}>
                <Trash2 className="w-3 h-3" />
              </Button>
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
