'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeftRight, Loader2, Trophy, Clock, Cpu, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ComparisonResult {
  model: string
  provider: string
  content: string
  error?: string
  duration?: number
}

export function ModelComparisonPanel() {
  const { modelConfigs } = useAppStore()
  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const [comparing, setComparing] = useState(false)
  const [results, setResults] = useState<ComparisonResult[]>([])
  const [winner, setWinner] = useState<string | null>(null)

  const activeModels = modelConfigs.filter(m => m.isActive)

  const toggleModel = (id: string) => {
    setSelectedModels(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 4) next.add(id)
      return next
    })
    setWinner(null)
  }

  const handleCompare = async () => {
    if (!prompt.trim() || selectedModels.size < 2) return
    setComparing(true)
    setResults([])
    setWinner(null)

    const models = Array.from(selectedModels).map(id => {
      const config = modelConfigs.find(c => c.id === id)
      return {
        provider: config?.provider || 'zai',
        model: config?.modelId || config?.name || 'default',
      }
    })

    try {
      const res = await fetch('/api/chat/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt.trim() }],
          models,
          temperature: 0.7,
          maxTokens: 1024,
        }),
      })
      const data = await res.json()
      if (data.results) {
        setResults(data.results)
      }
      if (data.error) {
        setResults([
          { model: 'Error', provider: '', content: '', error: data.error },
        ])
      }
    } catch (error) {
      console.error('Comparison failed:', error)
      setResults([
        {
          model: 'Error',
          provider: '',
          content: '',
          error: error instanceof Error ? error.message : 'Comparison request failed',
        },
      ])
    }
    setComparing(false)
  }

  const getWinnerLabel = () => {
    if (!winner) return null
    const winningResult = results.find(r => r.model === winner)
    return winningResult ? winningResult.model : null
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-2">
        <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-semibold">Model Comparison</h3>
      </div>

      {/* Prompt Input */}
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">Enter a prompt to compare across models:</div>
        <Input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="What is the meaning of life?"
          className="text-sm"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && prompt.trim() && selectedModels.size >= 2 && !comparing) {
              e.preventDefault()
              handleCompare()
            }
          }}
        />
      </div>

      {/* Model Selection */}
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">
          Select 2-4 models <span className="text-emerald-600">({selectedModels.size}/4 selected)</span>
        </div>
        <ScrollArea className="max-h-[160px]">
          <div className="space-y-0.5">
            {activeModels.map(config => (
              <label
                key={config.id}
                className="flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-accent/50 rounded-md text-xs transition-colors"
              >
                <Checkbox
                  checked={selectedModels.has(config.id)}
                  onCheckedChange={() => toggleModel(config.id)}
                  disabled={!selectedModels.has(config.id) && selectedModels.size >= 4}
                />
                <Cpu className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{config.name}</span>
                <span className="text-muted-foreground text-[10px]">({config.provider})</span>
                {config.isDefault && (
                  <Badge variant="outline" className="text-[8px] h-3.5 px-1 ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">
                    Default
                  </Badge>
                )}
              </label>
            ))}
            {activeModels.length === 0 && (
              <div className="text-xs text-muted-foreground py-3 text-center">
                No active models. Configure in Settings.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Compare Button */}
      <Button
        onClick={handleCompare}
        disabled={!prompt.trim() || selectedModels.size < 2 || comparing}
        className="w-full h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
      >
        {comparing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ArrowLeftRight className="w-3.5 h-3.5" />
        )}
        {comparing ? 'Comparing...' : `Compare ${selectedModels.size} Model${selectedModels.size !== 1 ? 's' : ''}`}
      </Button>

      {/* Winner Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-xs font-medium">
              Winner: <span className="text-amber-600">{getWinnerLabel()}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence mode="wait">
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`grid gap-2 ${results.length <= 2 ? 'grid-cols-1' : 'grid-cols-2'}`}
          >
            {results.map((r, i) => (
              <motion.div
                key={`${r.model}-${r.provider}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`relative transition-all ${
                    winner === r.model
                      ? 'ring-2 ring-amber-500 shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                >
                  <CardHeader className="pb-1 pt-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-emerald-500" />
                        <span className="truncate max-w-[120px]">{r.model}</span>
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {r.duration != null && (
                          <Badge variant="outline" className="text-[8px] h-4 px-1.5 gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {r.duration >= 1000 ? `${(r.duration / 1000).toFixed(1)}s` : `${r.duration}ms`}
                          </Badge>
                        )}
                        <button
                          onClick={() => setWinner(winner === r.model ? null : r.model)}
                          className={`p-1 rounded transition-colors ${
                            winner === r.model
                              ? 'text-amber-500 bg-amber-500/10'
                              : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                          }`}
                          title="Vote as best response"
                        >
                          <Trophy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[8px] h-4 w-fit">
                      {r.provider}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    {r.error ? (
                      <div className="flex items-start gap-1.5 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{r.error}</span>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[220px]">
                        <div className="text-xs whitespace-pre-wrap leading-relaxed">
                          {r.content || 'No response'}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duration comparison bar */}
      {results.length > 1 && results.some(r => r.duration != null) && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="text-xs font-medium">Response Time Comparison</div>
          {results
            .filter(r => r.duration != null)
            .sort((a, b) => (a.duration ?? 0) - (b.duration ?? 0))
            .map((r, i) => {
              const maxDuration = Math.max(...results.filter(x => x.duration != null).map(x => x.duration ?? 0))
              const pct = maxDuration > 0 ? ((r.duration ?? 0) / maxDuration) * 100 : 0
              return (
                <div key={r.model} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-medium truncate max-w-[140px]">{r.model}</span>
                    <span className="text-muted-foreground">
                      {r.duration != null && r.duration >= 1000
                        ? `${(r.duration / 1000).toFixed(1)}s`
                        : `${r.duration}ms`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-amber-500' : 'bg-violet-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
