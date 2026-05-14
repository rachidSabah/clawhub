'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ChevronDown, Bot, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'
import type { ModelInfo } from '@/lib/types'

export function ModelSelector() {
  const {
    activeProvider,
    activeModel,
    setActiveModel,
    availableModels,
    providers,
  } = useAppStore()

  const [open, setOpen] = useState(false)

  // Group models by provider
  const modelsByProvider = availableModels.reduce<Record<string, ModelInfo[]>>((acc, model) => {
    const provider = providers.find(p => p.id === model.provider)
    const providerName = provider?.name || 'Unknown'
    if (!acc[providerName]) acc[providerName] = []
    acc[providerName].push(model)
    return acc
  }, {})

  const currentModel = availableModels.find(m => m.id === activeModel)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs font-normal border-dashed"
        >
          <Zap className="w-3 h-3 text-emerald-500" />
          <span className="max-w-[200px] truncate">
            {currentModel?.name || activeModel || 'Select Model'}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border">
          <span className="text-xs font-medium">Select Model</span>
        </div>
        <ScrollArea className="h-64">
          {Object.keys(modelsByProvider).length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No models available. Configure a provider in Settings.
            </div>
          ) : (
            Object.entries(modelsByProvider).map(([providerName, models]) => (
              <div key={providerName}>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {providerName}
                </div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2',
                      activeModel === model.id && 'bg-accent'
                    )}
                    onClick={() => {
                      setActiveModel(model.id)
                      setOpen(false)
                    }}
                  >
                    <Bot className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{model.name}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
