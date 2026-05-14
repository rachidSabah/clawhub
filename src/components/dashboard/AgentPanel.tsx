'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Brain, Wrench, Eye, Terminal, CircleStop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AgentStreamEvent } from '@/lib/types'

const eventIcons: Record<string, React.ElementType> = {
  thought: Brain,
  action: Wrench,
  observation: Eye,
  stdout: Terminal,
  stderr: Terminal,
  stopped: CircleStop,
}

const eventColors: Record<string, string> = {
  thought: 'text-violet-500 border-violet-500/30 bg-violet-500/5',
  action: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  observation: 'text-cyan-500 border-cyan-500/30 bg-cyan-500/5',
  stdout: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/5',
  stderr: 'text-red-500 border-red-500/30 bg-red-500/5',
  stopped: 'text-muted-foreground border-border bg-muted/50',
}

export function AgentPanel() {
  const { agentLog, isStreaming, isAgentMode } = useAppStore()

  if (!isAgentMode) return null

  return (
    <div className="border-t border-border bg-muted/20">
      {/* Agent header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium">Agent Log</span>
          <span className="text-[10px] text-muted-foreground">
            {agentLog.length} events
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isStreaming && (
            <span className="text-[10px] text-emerald-500 animate-pulse mr-2">Running...</span>
          )}
        </div>
      </div>

      {/* Agent log content */}
      <ScrollArea className="h-48">
        <div className="p-3 space-y-1.5 font-mono text-xs">
          {agentLog.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              Agent events will appear here...
            </div>
          ) : (
            agentLog.map((event, idx) => {
              const Icon = eventIcons[event.type] || Terminal
              const colorClass = eventColors[event.type] || 'text-muted-foreground border-border bg-muted/50'
              return (
                <div
                  key={idx}
                  className={cn(
                    'rounded border px-2.5 py-1.5 flex items-start gap-2',
                    colorClass
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold uppercase text-[10px] tracking-wider">
                        {event.type}
                      </span>
                      <span className="text-[9px] opacity-50">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap break-all text-muted-foreground">
                      {event.data}
                    </div>
                    {event.actionInput && (
                      <div className="mt-1 text-[10px] opacity-70">
                        Input: {JSON.stringify(event.actionInput, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
