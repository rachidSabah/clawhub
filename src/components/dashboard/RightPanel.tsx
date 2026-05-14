'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Cpu, Thermometer, Zap, Coins, Search, Image, Download, Upload, FileText, ArrowLeftRight } from 'lucide-react'
import { TokenUsagePanel } from './TokenUsagePanel'
import { ImageGenerationPanel } from './ImageGenerationPanel'
import { WebSearchPanel } from './WebSearchPanel'
import { DocumentsPanel } from './DocumentsPanel'
import { ModelComparisonPanel } from './ModelComparisonPanel'

export function RightPanel() {
  const { modelConfigs, loadModelConfigs, rightPanelTab, setRightPanelTab } = useAppStore()
  const [hardware, setHardware] = useState<any>(null)

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

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `clawhub-export-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          // Reload data
          const store = useAppStore.getState()
          store.loadConversations()
          store.loadProviders()
          store.loadModelConfigs()
        }
      } catch (error) {
        console.error('Import failed:', error)
      }
    }
    input.click()
  }

  return (
    <div className="w-[320px] h-full flex flex-col">
      <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 border-b border-border px-3 pt-3 pb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Inspector</span>
          </div>
          <TabsList className="w-full grid grid-cols-7 h-7">
            <TabsTrigger value="model" className="text-[10px] gap-0.5"><Zap className="w-3 h-3" /> Model</TabsTrigger>
            <TabsTrigger value="compare" className="text-[10px] gap-0.5"><ArrowLeftRight className="w-3 h-3" /> Compare</TabsTrigger>
            <TabsTrigger value="tokens" className="text-[10px] gap-0.5"><Coins className="w-3 h-3" /> Tokens</TabsTrigger>
            <TabsTrigger value="search" className="text-[10px] gap-0.5"><Search className="w-3 h-3" /> Search</TabsTrigger>
            <TabsTrigger value="image" className="text-[10px] gap-0.5"><Image className="w-3 h-3" /> Image</TabsTrigger>
            <TabsTrigger value="docs" className="text-[10px] gap-0.5"><FileText className="w-3 h-3" /> Docs</TabsTrigger>
            <TabsTrigger value="export" className="text-[10px] gap-0.5"><Download className="w-3 h-3" /> Data</TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="flex-1">
          <TabsContent value="model" className="p-3 m-0 space-y-2">
            {/* Model configs */}
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

            {/* Hardware / System info */}
            {hardware ? (
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
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">Loading hardware info...</div>
            )}
          </TabsContent>

          <TabsContent value="compare" className="m-0">
            <ModelComparisonPanel />
          </TabsContent>

          <TabsContent value="tokens" className="m-0">
            <TokenUsagePanel />
          </TabsContent>

          <TabsContent value="search" className="m-0">
            <WebSearchPanel />
          </TabsContent>

          <TabsContent value="image" className="m-0">
            <ImageGenerationPanel />
          </TabsContent>

          <TabsContent value="docs" className="m-0">
            <DocumentsPanel />
          </TabsContent>

          <TabsContent value="export" className="p-3 m-0 space-y-3">
            <div className="text-xs font-medium">Data Management</div>
            <div className="space-y-2">
              <Button onClick={handleExport} variant="outline" className="w-full h-9 text-xs gap-2">
                <Download className="w-3.5 h-3.5" />
                Export All Data
              </Button>
              <Button onClick={handleImport} variant="outline" className="w-full h-9 text-xs gap-2">
                <Upload className="w-3.5 h-3.5" />
                Import Data
              </Button>
            </div>
            <div className="text-[10px] text-muted-foreground space-y-1 pt-2 border-t border-border">
              <p>Export includes all conversations, messages, providers, model configs, and settings.</p>
              <p>Import will merge data with existing records. Duplicates will be skipped.</p>
            </div>
            {hardware?.recommendations && (
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
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
