'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Bot, User, Brain, Wrench, Eye, Terminal, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Message } from '@/lib/types'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}

const roleConfig: Record<string, { icon: React.ElementType; label: string; colorClass: string; bgClass: string }> = {
  'user': { icon: User, label: 'You', colorClass: 'text-foreground', bgClass: 'bg-primary text-primary-foreground' },
  'assistant': { icon: Bot, label: 'Assistant', colorClass: 'text-foreground', bgClass: 'bg-emerald-600 text-white' },
  'system': { icon: Terminal, label: 'System', colorClass: 'text-amber-600', bgClass: 'bg-amber-600 text-white' },
  'agent-thought': { icon: Brain, label: 'Thought', colorClass: 'text-violet-600 dark:text-violet-400', bgClass: 'bg-violet-600 text-white' },
  'agent-action': { icon: Wrench, label: 'Action', colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-600 text-white' },
  'agent-observation': { icon: Eye, label: 'Observation', colorClass: 'text-cyan-600 dark:text-cyan-400', bgClass: 'bg-cyan-600 text-white' },
}

export function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const config = roleConfig[message.role] || roleConfig['assistant']
  const Icon = config.icon
  const [copied, setCopied] = useState(false)
  const isAgent = message.role.startsWith('agent-')
  const content = isStreaming ? (streamingContent || message.content) : message.content

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4 px-4">
        <div className="max-w-[80%] flex flex-col items-end">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 px-1">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    )
  }

  if (isAgent) {
    return (
      <div className="mx-4 mb-2">
        <div className={cn(
          'rounded-lg border text-sm overflow-hidden',
          message.role === 'agent-thought' && 'border-violet-500/30 bg-violet-500/5',
          message.role === 'agent-action' && 'border-amber-500/30 bg-amber-500/5',
          message.role === 'agent-observation' && 'border-cyan-500/30 bg-cyan-500/5',
        )}>
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-xs font-medium border-b',
            message.role === 'agent-thought' && 'border-violet-500/30 text-violet-600 dark:text-violet-400',
            message.role === 'agent-action' && 'border-amber-500/30 text-amber-600 dark:text-amber-400',
            message.role === 'agent-observation' && 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400',
          )}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
            {isStreaming && <span className="animate-pulse">...</span>}
          </div>
          <div className="px-3 py-2 font-mono text-xs whitespace-pre-wrap break-all text-muted-foreground">
            {content}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-4 px-4">
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
        config.bgClass
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-foreground/70 animate-pulse ml-0.5 align-middle" />
        )}
        {!isStreaming && content && (
          <div className="mt-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
