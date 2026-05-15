'use client'

import { useAppStore } from '@/lib/store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ModelSelector() {
  const { availableModels, activeModel, setActiveModel } = useAppStore()
  return (
    <Select value={activeModel || ''} onValueChange={setActiveModel}>
      <SelectTrigger className="h-8 w-[200px] text-xs border-0 bg-muted/50">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {availableModels.map((m, i) => <SelectItem key={(m as any)._compositeKey || `${m.provider}-${m.id}-${i}`} value={m.id || `model-${i}`} className="text-xs">{m.name || m.id}</SelectItem>)}
        {availableModels.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No models available</div>}
      </SelectContent>
    </Select>
  )
}
