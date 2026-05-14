'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import {
  createMessage,
  compressContext,
  fetchInsights,
  executeSkill,
  fetchAppStatus,
  fetchMessagingStatus,
  setHomeDir,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Send, Paperclip, Search, Image, Loader2, Slash,
  Minimize2, BarChart3, Sparkles, Square, Radio, Activity,
  Home, HelpCircle, Terminal,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SlashCommand {
  name: string
  description: string
  icon: React.ReactNode
  usage?: string
  execute: (args: string) => Promise<string>
}

export function InputBar() {
  const {
    activeConversationId, isAgentMode, setIsStreaming, appendStreamingContent,
    clearStreamingContent, addMessage, messages, activeProvider, activeModel,
    modelConfigs, abortController, setAbortController, skills, loadSkills,
  } = useAppStore()
  const [input, setInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandFilter, setCommandFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const commandRef = useRef<HTMLDivElement>(null)

  // Load skills for dynamic commands
  useEffect(() => {
    loadSkills()
  }, [loadSkills])

  // Close command menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(e.target as Node)) {
        setShowCommandMenu(false)
      }
    }
    if (showCommandMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCommandMenu])

  const addSystemMessage = useCallback(async (content: string) => {
    if (!activeConversationId) return
    const msg = await createMessage(activeConversationId, { role: 'system', content })
    addMessage(msg)
  }, [activeConversationId, addMessage])

  // Define slash commands
  const slashCommands: SlashCommand[] = [
    {
      name: 'compress',
      description: 'Compress conversation context',
      icon: <Minimize2 className="w-4 h-4" />,
      usage: '[maxMessages]',
      execute: async () => {
        if (!activeConversationId) return 'No active conversation'
        try {
          const result = await compressContext(activeConversationId, 20)
          if (result.compressed) {
            return `✅ Context compressed: ${result.compressedCount} messages summarized into 1 summary. ${result.remainingCount} messages remaining.`
          }
          return `ℹ️ ${result.message}`
        } catch (err: unknown) {
          return `❌ Compression failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      },
    },
    {
      name: 'usage',
      description: 'Show token usage stats',
      icon: <BarChart3 className="w-4 h-4" />,
      execute: async () => {
        try {
          const data = await fetch('/api/tokens').then(r => r.json())
          return `📊 **Token Usage**\n- Total tokens: ${data.totalTokens?.toLocaleString() || 0}\n- Total cost: $${data.totalCost?.toFixed(4) || '0.0000'}\n- Messages: ${data.messageCount || 0}\n- Models: ${Object.keys(data.byModel || {}).length}`
        } catch (err: unknown) {
          return `❌ Failed to fetch usage: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      },
    },
    {
      name: 'insights',
      description: 'Show usage insights for last N days',
      icon: <BarChart3 className="w-4 h-4" />,
      usage: '[--days N]',
      execute: async (args) => {
        const daysMatch = args.match(/--days\s+(\d+)/)
        const days = daysMatch ? parseInt(daysMatch[1], 10) : 7
        try {
          const data = await fetchInsights(days)
          const topModelsStr = (data.topModels || [])
            .slice(0, 3)
            .map((m: { model: string; count: number; cost: number }) => `  - ${m.model}: ${m.count} uses, $${m.cost.toFixed(4)}`)
            .join('\n')
          return `📈 **Usage Insights (${data.days} days)**\n- Total tokens: ${data.totalTokens?.toLocaleString() || 0}\n- Total cost: $${data.totalCost?.toFixed(4) || '0.0000'}\n- Total messages: ${data.totalMessages || 0}\n- Avg tokens/day: ${data.avgTokensPerDay?.toLocaleString() || 0}\n- Avg cost/day: $${data.avgCostPerDay?.toFixed(4) || '0.0000'}\n\n**Top Models:**\n${topModelsStr || '  No data'}`
        } catch (err: unknown) {
          return `❌ Failed to fetch insights: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      },
    },
    {
      name: 'skills',
      description: 'List all available skills',
      icon: <Sparkles className="w-4 h-4" />,
      execute: async () => {
        try {
          const data = await fetch('/api/skills').then(r => r.json())
          if (!data.length) return '📋 No skills available. Create some in Settings.'
          const skillList = data.map((s: { name: string; category: string; description?: string }) =>
            `  - \`/${s.name}\` (${s.category}): ${s.description || 'No description'}`
          ).join('\n')
          return `📋 **Available Skills:**\n${skillList}`
        } catch (err: unknown) {
          return `❌ Failed to fetch skills: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      },
    },
    {
      name: 'stop',
      description: 'Interrupt current streaming/response',
      icon: <Square className="w-4 h-4" />,
      execute: async () => {
        if (abortController) {
          abortController.abort()
          setAbortController(null)
          clearStreamingContent()
          setIsStreaming(false)
          return '⏹️ Response interrupted.'
        }
        return 'ℹ️ No active response to interrupt.'
      },
    },
    {
      name: 'platforms',
      description: 'Show messaging platform status',
      icon: <Radio className="w-4 h-4" />,
      execute: async () => {
        try {
          const data = await fetchMessagingStatus()
          const platformList = (data.platforms || [])
            .map((p: { platform: string; connected: boolean; info: string }) =>
              `  - ${p.connected ? '🟢' : '🔴'} **${p.platform}**: ${p.info}`
            ).join('\n')
          return `📡 **Messaging Platforms** (${data.summary?.connected || 0}/${data.summary?.total || 0} connected)\n${platformList}`
        } catch (err: unknown) {
          return `❌ Failed to fetch platform status: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      },
    },
    {
      name: 'status',
      description: 'Show overall app status',
      icon: <Activity className="w-4 h-4" />,
      execute: async () => {
        try {
          const data = await fetchAppStatus()
          return `🟢 **ClawHub Status**\n- Uptime: ${data.uptime?.formatted || 'Unknown'}\n- Version: ${data.version || '1.0.0'}\n- Providers: ${data.providers?.active || 0} active / ${data.providers?.total || 0} total\n- Conversations: ${data.conversations?.active || 0} active / ${data.conversations?.total || 0} total\n- Agents: ${data.agents?.running || 0} running / ${data.agents?.total || 0} total\n- Memory: ${data.memory?.total || 0} entries\n- Skills: ${data.skills?.total || 0}\n- MCP: ${data.mcp?.connected || 0} connected / ${data.mcp?.total || 0} total\n- Hardware: ${data.hardware?.cpuModel || 'Unknown'} (${data.hardware?.cpuCores || '?'} cores), ${data.hardware?.usedMemoryGB || '?'}GB / ${data.hardware?.totalMemoryGB || '?'}GB RAM (${data.hardware?.memoryUsagePercent || '?'}%)`
        } catch (err: unknown) {
          return `❌ Failed to fetch status: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      },
    },
    {
      name: 'sethome',
      description: 'Set the home/workspace directory',
      icon: <Home className="w-4 h-4" />,
      usage: '<path>',
      execute: async (args) => {
        const path = args.trim()
        if (!path) return '❌ Usage: /sethome <path>'
        try {
          await setHomeDir(path)
          return `✅ Home directory set to: \`${path}\``
        } catch (err: unknown) {
          return `❌ Failed to set home directory: ${err instanceof Error ? err.message : 'Unknown error'}`
        }
      },
    },
    {
      name: 'help',
      description: 'Show all available commands',
      icon: <HelpCircle className="w-4 h-4" />,
      execute: async () => {
        return `📖 **Slash Commands:**\n` +
          `  - \`/compress\` — Compress conversation context\n` +
          `  - \`/usage\` — Show token usage stats\n` +
          `  - \`/insights [--days N]\` — Usage insights for last N days\n` +
          `  - \`/skills\` — List all available skills\n` +
          `  - \`/<skill-name> [input]\` — Execute a skill by name\n` +
          `  - \`/stop\` — Interrupt current streaming\n` +
          `  - \`/platforms\` — Show messaging platform status\n` +
          `  - \`/status\` — Show overall app status\n` +
          `  - \`/sethome <path>\` — Set home/workspace directory\n` +
          `  - \`/help\` — Show this help message`
      },
    },
  ]

  // Add dynamic skill commands
  const skillCommands: SlashCommand[] = skills.map(skill => ({
    name: skill.name,
    description: skill.description || `Execute skill: ${skill.name}`,
    icon: <Sparkles className="w-4 h-4" />,
    usage: '[input]',
    execute: async (args) => {
      try {
        const result = await executeSkill(skill.name, args)
        if (result.success) {
          return `✅ **Skill: ${skill.name}**\n${result.result}`
        }
        return `❌ Skill execution failed: ${result.error}`
      } catch (err: unknown) {
        return `❌ Skill error: ${err instanceof Error ? err.message : 'Unknown error'}`
      }
    },
  }))

  const allCommands = [...slashCommands, ...skillCommands]

  // Filter commands based on input
  const filteredCommands = allCommands.filter(cmd =>
    cmd.name.toLowerCase().includes(commandFilter.toLowerCase())
  )

  const handleInputChange = (value: string) => {
    setInput(value)
    if (value.startsWith('/')) {
      setCommandFilter(value.slice(1))
      setShowCommandMenu(true)
    } else {
      setShowCommandMenu(false)
    }
  }

  const handleCommandSelect = async (cmd: SlashCommand) => {
    const args = input.slice(1 + cmd.name.length).trim()
    setShowCommandMenu(false)
    setInput('')

    const result = await cmd.execute(args)
    await addSystemMessage(result)
  }

  const handleSend = async () => {
    if (!input.trim() || !activeConversationId) return

    // Check if input is a slash command
    if (input.startsWith('/')) {
      const cmdName = input.slice(1).split(' ')[0]
      const cmd = allCommands.find(c => c.name === cmdName)
      if (cmd) {
        const args = input.slice(1 + cmdName.length).trim()
        setShowCommandMenu(false)
        setInput('')
        const result = await cmd.execute(args)
        await addSystemMessage(result)
        return
      }
      // Unknown command
      setShowCommandMenu(false)
      setInput('')
      await addSystemMessage(`❌ Unknown command: \`/${cmdName}\`. Type \`/help\` for available commands.`)
      return
    }

    const userContent = input.trim()

    // Save user message
    const msg = await createMessage(activeConversationId, { role: 'user', content: userContent })
    addMessage(msg)
    setInput('')
    setShowCommandMenu(false)

    setIsStreaming(true)
    clearStreamingContent()

    // Create AbortController for this request
    const controller = new AbortController()
    setAbortController(controller)

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
        signal: controller.signal,
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
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Request was aborted by /stop command
        const aiMsg = await createMessage(activeConversationId, {
          role: 'assistant',
          content: '⏹️ *Response interrupted by user.*',
        })
        addMessage(aiMsg)
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        const aiMsg = await createMessage(activeConversationId, {
          role: 'assistant',
          content: `[Connection error: ${errorMsg}]. Please check your provider settings and try again.`,
        })
        addMessage(aiMsg)
      }
    }

    clearStreamingContent()
    setIsStreaming(false)
    setAbortController(null)
  }

  const handleWebSearch = async () => {
    if (!input.trim() || !activeConversationId) return

    const query = input.trim()
    setInput('')
    setShowCommandMenu(false)
    setIsSearching(true)

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
    setShowCommandMenu(false)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCommandMenu) {
      if (e.key === 'Escape') {
        setShowCommandMenu(false)
        return
      }
      // Let the Command component handle navigation
      if (e.key === 'Enter' && filteredCommands.length === 1) {
        e.preventDefault()
        handleCommandSelect(filteredCommands[0])
        return
      }
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isWorking = useAppStore(s => s.isStreaming) || isSearching || isGeneratingImage

  return (
    <div className="shrink-0 border-t border-border p-3 relative">
      {/* Slash Command Menu */}
      {showCommandMenu && (
        <div ref={commandRef} className="absolute bottom-full left-3 right-3 mb-1 z-50">
          <div className="bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-hidden">
            <Command shouldFilter={false}>
              <CommandList>
                <CommandEmpty>No matching commands</CommandEmpty>
                {filteredCommands.length > 0 && (
                  <CommandGroup heading="Commands">
                    {filteredCommands.map(cmd => (
                      <CommandItem
                        key={cmd.name}
                        value={cmd.name}
                        onSelect={() => handleCommandSelect(cmd)}
                        className="cursor-pointer"
                      >
                        <span className="mr-2 text-muted-foreground">{cmd.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">/{cmd.name}</span>
                            {cmd.usage && (
                              <span className="text-xs text-muted-foreground">{cmd.usage}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{cmd.description}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        </div>
      )}

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

        <div className="flex-1 relative">
          <div className="flex items-center gap-2">
            {input.startsWith('/') ? (
              <Slash className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Terminal className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <Input
              ref={inputRef}
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              placeholder={isAgentMode ? 'Enter agent task or / for commands...' : 'Type a message or / for commands...'}
              className="h-9 text-sm flex-1"
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

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
