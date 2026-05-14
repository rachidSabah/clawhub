import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10), 1), 365)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Get messages within the date range
    const messages = await db.message.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: cutoffDate },
      },
      select: {
        metadata: true,
        createdAt: true,
        role: true,
        content: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Model pricing (approximate, per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'claude-sonnet-4': { input: 0.003, output: 0.015 },
      'claude-3.5-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'glm-4': { input: 0.001, output: 0.005 },
      'glm-4-flash': { input: 0.0001, output: 0.0005 },
      'deepseek-chat': { input: 0.00014, output: 0.00028 },
      'deepseek-reasoner': { input: 0.00055, output: 0.00219 },
    }
    const defaultPricing = { input: 0.001, output: 0.005 }

    let totalTokens = 0
    let totalCost = 0
    let totalMessages = messages.length
    const byDay: Record<string, { tokens: number; cost: number; messages: number }> = {}
    const byModel: Record<string, { tokens: number; cost: number; count: number }> = {}
    const byProvider: Record<string, { tokens: number; cost: number; count: number }> = {}

    for (const msg of messages) {
      const day = msg.createdAt.toISOString().slice(0, 10)
      if (!byDay[day]) byDay[day] = { tokens: 0, cost: 0, messages: 0 }
      byDay[day].messages++

      if (msg.metadata) {
        try {
          const meta = JSON.parse(msg.metadata)
          if (meta.tokenUsage) {
            const tokens = (meta.tokenUsage.prompt || 0) + (meta.tokenUsage.completion || 0)
            totalTokens += tokens

            const model = meta.model || 'unknown'
            const provider = meta.provider || 'unknown'
            const p = pricing[model] || defaultPricing
            const inputCost = ((meta.tokenUsage.prompt || 0) / 1000) * p.input
            const outputCost = ((meta.tokenUsage.completion || 0) / 1000) * p.output
            const cost = inputCost + outputCost
            totalCost += cost

            byDay[day].tokens += tokens
            byDay[day].cost += cost

            if (!byModel[model]) byModel[model] = { tokens: 0, cost: 0, count: 0 }
            byModel[model].tokens += tokens
            byModel[model].cost += cost
            byModel[model].count++

            if (!byProvider[provider]) byProvider[provider] = { tokens: 0, cost: 0, count: 0 }
            byProvider[provider].tokens += tokens
            byProvider[provider].cost += cost
            byProvider[provider].count++
          }
        } catch {
          // skip malformed metadata
        }
      }
    }

    // Sort by model usage count for top models
    const topModels = Object.entries(byModel)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([model, data]) => ({ model, ...data }))

    // Sort by provider usage count
    const topProviders = Object.entries(byProvider)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([provider, data]) => ({ provider, ...data }))

    // Daily breakdown sorted by date
    const dailyBreakdown = Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, ...data }))

    // Average per day
    const uniqueDays = Object.keys(byDay).length || 1
    const avgTokensPerDay = Math.round(totalTokens / uniqueDays)
    const avgCostPerDay = Number((totalCost / uniqueDays).toFixed(6))

    return NextResponse.json({
      days,
      totalTokens,
      totalCost: Number(totalCost.toFixed(6)),
      totalMessages,
      avgTokensPerDay,
      avgCostPerDay,
      dailyBreakdown,
      topModels,
      topProviders,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[insights] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
