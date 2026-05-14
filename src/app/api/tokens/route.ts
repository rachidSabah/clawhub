import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all messages with metadata
    const messages = await db.message.findMany({
      where: { isDeleted: false },
      select: {
        metadata: true,
        createdAt: true,
        role: true,
      },
    })

    let totalTokens = 0
    let totalCost = 0
    const byModel: Record<string, { tokens: number; cost: number; count: number }> = {}
    const byDay: Record<string, { tokens: number; cost: number }> = {}

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
      'deepseek-chat': { input: 0.00014, output: 0.00028 },
      'deepseek-reasoner': { input: 0.00055, output: 0.00219 },
    }

    const defaultPricing = { input: 0.001, output: 0.005 }

    for (const msg of messages) {
      if (!msg.metadata) continue
      try {
        const meta = JSON.parse(msg.metadata)
        if (meta.tokenUsage) {
          const tokens = (meta.tokenUsage.prompt || 0) + (meta.tokenUsage.completion || 0)
          totalTokens += tokens

          const model = meta.model || 'unknown'
          const p = pricing[model] || defaultPricing
          const inputCost = ((meta.tokenUsage.prompt || 0) / 1000) * p.input
          const outputCost = ((meta.tokenUsage.completion || 0) / 1000) * p.output
          const cost = inputCost + outputCost
          totalCost += cost

          // By model
          if (!byModel[model]) byModel[model] = { tokens: 0, cost: 0, count: 0 }
          byModel[model].tokens += tokens
          byModel[model].cost += cost
          byModel[model].count += 1

          // By day
          const day = msg.createdAt.toISOString().slice(0, 10)
          if (!byDay[day]) byDay[day] = { tokens: 0, cost: 0 }
          byDay[day].tokens += tokens
          byDay[day].cost += cost
        }
      } catch {
        // skip malformed metadata
      }
    }

    // Also count messages without metadata for total count
    const messageCount = messages.length

    return NextResponse.json({
      totalTokens,
      totalCost: Number(totalCost.toFixed(6)),
      byModel,
      byDay,
      messageCount,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[tokens] Error:', errMsg)
    return NextResponse.json({
      totalTokens: 0,
      totalCost: 0,
      byModel: {},
      byDay: {},
      messageCount: 0,
    })
  }
}
