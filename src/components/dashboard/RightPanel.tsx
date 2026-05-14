'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Cpu, Thermometer, Zap } from 'lucide-react'

export function RightPanel() {
  const { modelConfigs, loadModelConfigs } = useAppStore()
  const [hardware, setHardware] = useState<any>(null)
  const [tab, setTab] = useState('model')

  useEffect(() => {
    loadModelConfigs()
  }, [loadModelConfigs])

  useEffect(() => {
    let cancelled = false
    fetch('/api/hardware')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (!cancelled && data) setHardware(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="w-[320px] h-full flex flex-col">
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 border-b border-border px-3 pt-3 pb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Inspector</span>
          </div>
          <TabsList className="w-full grid grid-cols-2 h-7">
            <TabsTrigger value="model" className="text-[10px] gap-1"><Zap className="w-3 h-3" /> Model</TabsTrigger>
            <TabsTrigger value="system" className="text-[10px] gap-1"><Cpu className="w-3 h-3" /> System</TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="flex-1">
          <TabsContent value="model" className="p-3 m-0 space-y-2">
            {modelConfigs.map(mc => (
              <div key={mc.id} className="rounded-lg border border-border p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{mc.name}</span>
                  {mc.isDefault && <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Default</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                  <div>Context: {mc.contextWindow.toLocaleString()}</div>
                  <div>Temp: {mc.temperature}</div>
                  <div>Max Tokens: {mc.maxTokens}</div>
                  <div>Priority: {mc.priority}</div>
                </div>
                {mc.auxiliaryModels && (() => { try { const aux = JSON.parse(mc.auxiliaryModels); return aux.length > 0 ? <div className="text-[10px]"><span className="text-muted-foreground">Aux:</span> {aux.join(', ')}</div> : null } catch { return null } })()}
              </div>
            ))}
            {modelConfigs.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">No model configs yet. Add in Settings.</div>}
          </TabsContent>

          <TabsContent value="system" className="p-3 m-0 space-y-2">
            {hardware ? (
              <>
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-emerald-500" /><span className="text-xs font-medium">Hardware</span></div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-md bg-muted/30 p-2"><div className="text-muted-foreground">Platform</div><div className="font-medium">{hardware.hardware?.platform}</div></div>
                    <div className="rounded-md bg-muted/30 p-2"><div className="text-muted-foreground">Architecture</div><div className="font-medium">{hardware.hardware?.arch}</div></div>
                    <div className="rounded-md bg-muted/30 p-2"><div className="text-muted-foreground">CPU Cores</div><div className="font-medium">{hardware.hardware?.cpuCores}</div></div>
                    <div className="rounded-md bg-muted/30 p-2"><div className="text-muted-foreground">RAM</div><div className="font-medium">{hardware.hardware?.totalRamGB} GB</div></div>
                  </div>
                  {hardware.hardware?.cpuModel && <div className="text-[10px] text-muted-foreground">{hardware.hardware.cpuModel}</div>}
                </div>
                {hardware.recommendations && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-amber-500" /><span className="text-xs font-medium">Recommendations</span></div>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between"><span className="text-muted-foreground">Profile</span><Badge variant="outline" className="text-[8px] h-3.5 px-1">{hardware.recommendations.performanceProfile}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Max Context</span><span>{hardware.recommendations.maxContextWindow?.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Max Concurrent</span><span>{hardware.recommendations.maxConcurrentAgents}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Local Models</span><span>{hardware.recommendations.canRunLocalModels ? '✓ Yes' : '✗ No'}</span></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-6">Loading hardware info...</div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
