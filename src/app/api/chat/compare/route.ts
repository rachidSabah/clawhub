import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { messages, models, temperature = 0.7, maxTokens = 2048 } = await req.json()

    if (!messages || !models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'messages and models array are required' },
        { status: 400 }
      )
    }

    if (models.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 models can be compared at once' },
        { status: 400 }
      )
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const results: Array<{
      model: string
      provider: string
      content: string
      error?: string
      duration?: number
    }> = []

    // Run all models in parallel
    const promises = models.map(
      async (m: { provider: string; model: string }) => {
        const startTime = Date.now()
        try {
          const completion = await zai.chat.completions.create({
            model: m.model || undefined,
            messages: messages.map((msg: { role: string; content: string }) => ({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: msg.content,
            })),
            temperature,
            max_tokens: maxTokens,
          })
          const duration = Date.now() - startTime
          return {
            model: m.model || 'default',
            provider: m.provider,
            content: completion.choices?.[0]?.message?.content || 'No response',
            duration,
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          const duration = Date.now() - startTime
          return {
            model: m.model || 'default',
            provider: m.provider,
            content: '',
            error: message,
            duration,
          }
        }
      }
    )

    const settled = await Promise.allSettled(promises)
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          model: 'unknown',
          provider: 'unknown',
          content: '',
          error: 'Promise rejected',
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[chat/compare] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
