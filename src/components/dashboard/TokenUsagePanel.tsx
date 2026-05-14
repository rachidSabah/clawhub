'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Coins, TrendingUp, Hash } from 'lucide-react'

interface TokenData {
  totalTokens: number
  totalCost: number
  byModel: Record<string, { tokens: number; cost: number; count: number }>
  byDay: Record<string, { tokens: number; cost: number }>
  messageCount: number
}

export function TokenUsagePanel() {
  const [data, setData] = useState<TokenData | null>(null)

  useEffect(() => {
    fetch('/api/tokens')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setData(d)
      })
      .catch(console.error)
  }, [])

  if (!data) return <div className="p-4 text-sm text-muted-foreground">Loading token usage...</div>

  const dailyData = Object.entries(data.byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([day, d]) => ({ day: day.slice(5), tokens: d.tokens, cost: Number(d.cost.toFixed(4)) }))

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Tokens</span>
            </div>
            <div className="text-xl font-bold">{data.totalTokens.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Est. Cost</span>
            </div>
            <div className="text-xl font-bold">${data.totalCost.toFixed(4)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Messages</span>
            </div>
            <div className="text-xl font-bold">{data.messageCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">Daily Token Usage</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="tokens" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">No usage data yet</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm">By Model</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-2">
            {Object.entries(data.byModel).map(([model, info]) => (
              <div key={model} className="flex items-center justify-between text-xs border-b border-border pb-1.5">
                <span className="font-medium truncate max-w-[120px]">{model}</span>
                <div className="flex gap-3 text-muted-foreground">
                  <span>{info.tokens.toLocaleString()} tokens</span>
                  <span>${info.cost.toFixed(4)}</span>
                  <span>{info.count} reqs</span>
                </div>
              </div>
            ))}
            {Object.keys(data.byModel).length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">No usage data yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
