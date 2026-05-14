import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KNOWN_MODELS = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', created: null, owned_by: 'anthropic' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', created: null, owned_by: 'anthropic' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', created: null, owned_by: 'anthropic' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', created: null, owned_by: 'anthropic' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', created: null, owned_by: 'anthropic' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', created: null, owned_by: 'anthropic' },
]

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const provider = await db.provider.findUnique({ where: { id } })
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    let models: Array<Record<string, unknown>> = []

    switch (provider.type) {
      case 'openai-compatible': {
        if (!provider.baseUrl) {
          return NextResponse.json(
            { error: 'Base URL is required for openai-compatible providers' },
            { status: 400 }
          )
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (provider.apiKey) {
          headers['Authorization'] = `Bearer ${provider.apiKey}`
        }

        const baseUrl = provider.baseUrl.replace(/\/+$/, '')
        const response = await fetch(`${baseUrl}/models`, {
          headers,
          signal: AbortSignal.timeout(15000),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          return NextResponse.json(
            { error: `Failed to fetch models: ${response.status} - ${errorText}` },
            { status: 502 }
          )
        }

        const data = await response.json()
        // OpenAI-compatible APIs typically return { data: [...] }
        models = Array.isArray(data) ? data : (data.data ?? [])
        break
      }

      case 'anthropic': {
        models = ANTHROPIC_KNOWN_MODELS
        break
      }

      case 'ollama': {
        if (!provider.baseUrl) {
          return NextResponse.json(
            { error: 'Base URL is required for Ollama providers' },
            { status: 400 }
          )
        }

        const baseUrl = provider.baseUrl.replace(/\/+$/, '')
        const response = await fetch(`${baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(15000),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          return NextResponse.json(
            { error: `Failed to fetch models from Ollama: ${response.status} - ${errorText}` },
            { status: 502 }
          )
        }

        const data = await response.json()
        // Ollama returns { models: [...] }
        const ollamaModels = Array.isArray(data) ? data : (data.models ?? [])
        models = ollamaModels.map((m: Record<string, unknown>) => ({
          id: m.name ?? m.model,
          name: m.name ?? m.model,
          ...m,
        }))
        break
      }

      case 'cli': {
        return NextResponse.json(
          { error: 'CLI providers do not support model fetching. Configure models manually.' },
          { status: 400 }
        )
      }

      default: {
        return NextResponse.json(
          { error: `Unsupported provider type: ${provider.type}` },
          { status: 400 }
        )
      }
    }

    // Update the provider's models field
    await db.provider.update({
      where: { id },
      data: {
        models: JSON.stringify(models),
      },
    })

    return NextResponse.json({ models, count: models.length })
  } catch (error) {
    console.error('Failed to fetch models:', error)

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timed out while fetching models' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}
