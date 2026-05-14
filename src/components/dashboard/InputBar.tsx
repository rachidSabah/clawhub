'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Send, Paperclip, X, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InputBar() {
  const {
    isStreaming,
    setIsStreaming,
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    activeConversationId,
    isAgentMode,
    streamingContent,
    appendStreamingContent,
    clearStreamingContent,
    activeProvider,
    activeModel,
    messages,
    addMessage,
  } = useAppStore()

  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<any>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // Connect to WebSocket
  useEffect(() => {
    const initSocket = async () => {
      const { io } = await import('socket.io-client')
      const socket = io('/?XTransformPort=3003', {
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      })

      socket.on('chat:stream', (event: any) => {
        if (event.type === 'content') {
          appendStreamingContent(event.data)
        } else if (event.type === 'done') {
          setIsStreaming(false)
        } else if (event.type === 'error') {
          console.error('Stream error:', event.data)
          setIsStreaming(false)
        }
      })

      socketRef.current = socket

      return () => {
        socket.disconnect()
      }
    }

    initSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [appendStreamingContent, setIsStreaming])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return
    if (!activeConversationId) return

    const messageContent = input.trim()
    setInput('')
    clearStreamingContent()

    // Add user message to store
    const userMsg = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId,
      role: 'user' as const,
      content: messageContent,
      isStreaming: false,
      createdAt: new Date().toISOString(),
    }
    addMessage(userMsg)

    // Create assistant placeholder
    const assistantMsg = {
      id: `temp-assistant-${Date.now()}`,
      conversationId: activeConversationId,
      role: 'assistant' as const,
      content: '',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    }
    addMessage(assistantMsg)

    setIsStreaming(true)

    // Save to DB
    try {
      const { createMessage } = await import('@/lib/api')
      await createMessage(activeConversationId, {
        role: 'user',
        content: messageContent,
      })
    } catch (err) {
      console.error('Failed to save message:', err)
    }

    // Send to backend
    if (socketRef.current?.connected) {
      if (activeProvider?.type === 'cli') {
        socketRef.current.emit('chat:gemini', {
          prompt: messageContent,
          model: activeModel || 'gemini-2.0-flash',
        })
      } else if (activeProvider?.baseUrl && activeProvider?.apiKey) {
        socketRef.current.emit('chat:api', {
          baseUrl: activeProvider.baseUrl,
          apiKey: activeProvider.apiKey,
          model: activeModel || 'gpt-3.5-turbo',
          messages: [
            ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
            { role: 'user', content: messageContent },
          ],
        })
      }
    } else {
      // Fallback: use API route for non-streaming
      try {
        const { executeCommand } = await import('@/lib/api')
        const result = await executeCommand(
          `gemini --model ${activeModel || 'gemini-2.0-flash'} --prompt "${messageContent.replace(/"/g, '\\"')}"`,
          undefined,
          60000
        )
        appendStreamingContent(result.stdout || result.stderr)
        setIsStreaming(false)
      } catch (err: any) {
        appendStreamingContent(`Error: ${err.message}`)
        setIsStreaming(false)
      }
    }

    clearAttachments()
  }, [input, isStreaming, activeConversationId, activeProvider, activeModel, messages, addMessage, setIsStreaming, appendStreamingContent, clearStreamingContent, clearAttachments])

  const handleStop = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('agent:stop')
    }
    setIsStreaming(false)
  }, [setIsStreaming])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      for (const file of files) {
        addAttachment(file)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [addAttachment])

  return (
    <div className="border-t border-border bg-background p-3">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1 text-xs"
            >
              <Paperclip className="w-3 h-3" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button
                onClick={() => removeAttachment(idx)}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAgentMode
                ? "Describe the task for the agent to execute..."
                : "Type a message... (Shift+Enter for new line)"
            }
            className={cn(
              'w-full resize-none rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring',
              'min-h-[44px] max-h-[200px]'
            )}
            rows={1}
            disabled={isStreaming}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming}
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {isStreaming ? (
          <Button
            variant="destructive"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleStop}
          >
            <Square className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-10 w-10 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSend}
            disabled={!input.trim() || !activeConversationId}
          >
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[10px] text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Shift+Enter</kbd> new line
        </span>
        {isAgentMode && (
          <span className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Agent Mode Active
          </span>
        )}
      </div>
    </div>
  )
}
