'use client'

import { cn } from '@/lib/utils'
import { Bot, User, Wrench, Eye, Lightbulb } from 'lucide-react'
import type { Message, MessageRole } from '@/lib/types'

const roleConfig: Record<MessageRole, { icon: typeof Bot; label: string; color: string }> = {
  'user': { icon: User, label: 'You', color: 'bg-primary text-primary-foreground' },
  'assistant': { icon: Bot, label: 'ClawHub', color: 'bg-emerald-500/10 text-emerald-600' },
  'system': { icon: Wrench, label: 'System', color: 'bg-amber-500/10 text-amber-600' },
  'agent-thought': { icon: Lightbulb, label: 'Thought', color: 'bg-violet-500/10 text-violet-600' },
  'agent-action': { icon: Wrench, label: 'Action', color: 'bg-cyan-500/10 text-cyan-600' },
  'agent-observation': { icon: Eye, label: 'Observation', color: 'bg-blue-500/10 text-blue-600' },
}

export function MessageBubble({ message }: { message: Message & { isStreaming?: boolean } }) {
  const config = roleConfig[message.role] || roleConfig.assistant
  const Icon = config.icon
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', config.color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className={cn('flex-1 min-w-0 rounded-xl px-4 py-3 text-sm', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted/50')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">{config.label}</span>
          {message.isStreaming && <span className="text-[10px] text-muted-foreground animate-pulse">typing...</span>}
        </div>
        <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>
      </div>
    </div>
  )
}
