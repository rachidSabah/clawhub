'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { MessageBubble } from './MessageBubble'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, MessageSquare, Sparkles } from 'lucide-react'

export function ChatWindow() {
  const { messages, isStreaming, streamingContent, activeConversationId, isAgentMode } = useAppStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive or streaming content updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Hermes AI Agent</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Start a new conversation or agent task to begin. Connect to Gemini CLI, OpenAI, Anthropic, or any OpenAI-compatible provider.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-border p-3 hover:bg-accent/50 cursor-pointer transition-colors">
              <MessageSquare className="w-5 h-5 text-emerald-500 mb-2" />
              <div className="text-sm font-medium">Chat Mode</div>
              <div className="text-xs text-muted-foreground mt-1">Standard AI conversation with streaming responses</div>
            </div>
            <div className="rounded-xl border border-border p-3 hover:bg-accent/50 cursor-pointer transition-colors">
              <Bot className="w-5 h-5 text-violet-500 mb-2" />
              <div className="text-sm font-medium">Agent Mode</div>
              <div className="text-xs text-muted-foreground mt-1">Autonomous agent with shell, file, and code access</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                {isAgentMode ? (
                  <Bot className="w-6 h-6 text-white" />
                ) : (
                  <MessageSquare className="w-6 h-6 text-white" />
                )}
              </div>
              <h3 className="text-lg font-medium mb-1">
                {isAgentMode ? 'Agent Task Ready' : 'Start a Conversation'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isAgentMode
                  ? 'Describe a task and the agent will autonomously execute it.'
                  : 'Type a message below to start chatting with the AI.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message, idx) => {
              const isLastAssistant = message.role === 'assistant' && idx === messages.length - 1 && isStreaming
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isStreaming={isLastAssistant}
                  streamingContent={isLastAssistant ? streamingContent : undefined}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
