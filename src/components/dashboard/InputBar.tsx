'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { createMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Paperclip, Search, Image, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function InputBar() {
  const {
    activeConversationId, isAgentMode, setIsStreaming, appendStreamingContent,
    clearStreamingContent, addMessage, messages, activeProvider, activeModel,
    modelConfigs,
  } = useAppStore()
  const [input, setInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || !activeConversationId) return

    const userContent = input.trim()

    // Save user message
    const msg = await createMessage(activeConversationId, { role: 'user', content: userContent })
    addMessage(msg)
    setInput('')

    setIsStreaming(true)
    clearStreamingContent()

    try {
      // Build messages history for context
      const history = messages
        .filter(m => !m.isDeleted)
        .map(m => ({
          role: (m.role === 'agent-thought' || m.role === 'agent-action' || m.role === 'agent-observation') ? 'assistant' as const : m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        }))
      history.push({ role: 'user', content: userContent })

      // Stream from API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          provider: activeProvider?.type || 'zai',
          model: activeModel || undefined,
          temperature: modelConfigs.find(c => c.isDefault)?.temperature || 0.7,
          maxTokens: modelConfigs.find(c => c.isDefault)?.maxTokens || 4096,
        }),
      })

      if (!response.ok) throw new Error('Stream failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === 'content') {
                  fullContent += data.content
                  appendStreamingContent(data.content)
                } else if (data.type === 'error') {
                  console.error('Stream error:', data.error)
                  fullContent += `\n\n[Error: ${data.error}]`
                }
              } catch {
                // ignore malformed JSON lines
              }
            }
          }
        }
      }

      // Save AI response
      const aiMsg = await createMessage(activeConversationId, {
        role: 'assistant',
        content: fullContent || 'No response received.',
        metadata: JSON.stringify({ model: activeModel, provider: activeProvider?.type }),
      })
      addMessage(aiMsg)
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      // Fallback: show error message
      const aiMsg = await createMessage(activeConversationId, {
        role: 'assistant',
        content: `[Connection error: ${errorMsg}]. Please check your provider settings and try again.`,
      })
      addMessage(aiMsg)
    }

    clearStreamingContent()
    setIsStreaming(false)
  }

  const handleWebSearch = async () => {
    if (!input.trim() || !activeConversationId) return

    const query = input.trim()
    setInput('')
    setIsSearching(true)

    // Add search indicator message
    const searchMsg = await createMessage(activeConversationId, {
      role: 'system',
      content: `Searching the web for: "${query}"...`,
    })
    addMessage(searchMsg)

    try {
      const res = await fetch('/api/chat/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, num: 5 }),
      })
      const data = await res.json()
      if (data.results) {
        const resultsText = data.results.map((r: { name: string; snippet: string; url: string }, i: number) =>
          `${i + 1}. **${r.name}**\n   ${r.snippet}\n   [${r.url}](${r.url})`
        ).join('\n\n')
        const resultMsg = await createMessage(activeConversationId, {
          role: 'assistant',
          content: `## Web Search Results\n\n${resultsText}`,
        })
        addMessage(resultMsg)
      }
    } catch (error: unknown) {
      const errStr = error instanceof Error ? error.message : 'Unknown error'
      const errMsg = await createMessage(activeConversationId, {
        role: 'assistant',
        content: `Search failed: ${errStr}`,
      })
      addMessage(errMsg)
    }

    setIsSearching(false)
  }

  const handleImageGeneration = async () => {
    if (!input.trim() || !activeConversationId) return

    const prompt = input.trim()
    setInput('')
    setIsGeneratingImage(true)

    const promptMsg = await createMessage(activeConversationId, {
      role: 'system',
      content: `Generating image: "${prompt}"...`,
    })
    addMessage(promptMsg)

    try {
      const res = await fetch('/api/chat/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.image) {
        const imgMsg = await createMessage(activeConversationId, {
          role: 'assistant',
          content: `![Generated Image](data:image/png;base64,${data.image})`,
          metadata: JSON.stringify({ type: 'image', prompt }),
        })
        addMessage(imgMsg)
      } else if (data.error) {
        const errMsg = await createMessage(activeConversationId, {
          role: 'assistant',
          content: `Image generation failed: ${data.error}`,
        })
        addMessage(errMsg)
      }
    } catch (error: unknown) {
      const errStr = error instanceof Error ? error.message : 'Unknown error'
      const errMsg = await createMessage(activeConversationId, {
        role: 'assistant',
        content: `Image generation failed: ${errStr}`,
      })
      addMessage(errMsg)
    }

    setIsGeneratingImage(false)
  }

  const isWorking = useAppStore(s => s.isStreaming) || isSearching || isGeneratingImage

  return (
    <div className="shrink-0 border-t border-border p-3">
      <div className="flex gap-2 max-w-3xl mx-auto items-center">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" disabled={isWorking}>
          <Paperclip className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-emerald-600"
          onClick={handleWebSearch} disabled={!input.trim() || isWorking}>
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-violet-600"
          onClick={handleImageGeneration} disabled={!input.trim() || isWorking}>
          {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
        </Button>
        <Input value={input} onChange={e => setInput(e.target.value)}
          placeholder={isAgentMode ? 'Enter agent task...' : 'Type a message...'}
          className="h-9 text-sm flex-1"
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
        <AnimatePresence mode="wait">
          <motion.div
            key={isWorking ? 'working' : 'idle'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Button size="icon" className="h-9 w-9 shrink-0 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSend} disabled={!input.trim() || isWorking}>
              <Send className="w-4 h-4" />
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
