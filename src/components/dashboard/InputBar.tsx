'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { createMessage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Paperclip } from 'lucide-react'

export function InputBar() {
  const { activeConversationId, isAgentMode, setIsStreaming, appendStreamingContent, clearStreamingContent, addMessage } = useAppStore()
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (!input.trim() || !activeConversationId) return
    const msg = await createMessage(activeConversationId, { role: 'user', content: input.trim() })
    addMessage(msg)
    setInput('')
    // Simulate AI response (replace with actual LLM call)
    setIsStreaming(true)
    clearStreamingContent()
    const response = 'This is a simulated response. Connect an AI provider in Settings to get real responses from your configured models.'
    for (let i = 0; i < response.length; i += 5) {
      appendStreamingContent(response.substring(0, i + 5))
      await new Promise(r => setTimeout(r, 30))
    }
    const aiMsg = await createMessage(activeConversationId, { role: 'assistant', content: response })
    addMessage(aiMsg)
    clearStreamingContent()
    setIsStreaming(false)
  }

  return (
    <div className="shrink-0 border-t border-border p-3">
      <div className="flex gap-2 max-w-3xl mx-auto">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Paperclip className="w-4 h-4" /></Button>
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder={isAgentMode ? 'Enter agent task...' : 'Type a message...'}
          className="h-9 text-sm" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
        <Button size="icon" className="h-9 w-9 shrink-0 bg-emerald-600 hover:bg-emerald-700" onClick={handleSend} disabled={!input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
