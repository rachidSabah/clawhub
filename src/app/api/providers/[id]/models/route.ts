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

const GEMINI_KNOWN_MODELS = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', owned_by: 'google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', owned_by: 'google' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', owned_by: 'google' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', owned_by: 'google' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', owned_by: 'google' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', owned_by: 'google' },
]

const DEEPSEEK_KNOWN_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek Chat', owned_by: 'deepseek' },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', owned_by: 'deepseek' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', owned_by: 'deepseek' },
]

const OPENROUTER_DEFAULT_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', owned_by: 'openai' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', owned_by: 'openai' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', owned_by: 'anthropic' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', owned_by: 'anthropic' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', owned_by: 'google' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', owned_by: 'deepseek' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', owned_by: 'meta' },
]

// Provider types that use OpenAI-compatible /models endpoint
const OPENAI_COMPATIBLE_TYPES = [
  'openai-compatible',
  'openrouter',
  'novita',
  'ai-gateway',
  'zai',
  'kimi',
  'kimi-cn',
  'arcee',
  'gmi',
  'minimax',
  'minimax-cn',
  'alibaba',
  'alibaba-coding',
  'kilocode',
  'xiaomi',
  'tencent-tokenhub',
  'opencode-zen',
  'opencode-go',
  'huggingface',
  'vllm',
  'lmstudio',
  'custom',
  'nous-portal',
  'openai-codex',
]

// Provider types that use CLI and can't fetch models remotely
const CLI_TYPES = ['cli', 'gemini-cli', 'github-copilot-acp']

// Provider types that use OAuth / device-code flow
const OAUTH_TYPES = ['github-copilot', 'gemini-oauth']

// Provider types with known model lists (no /models endpoint)
const KNOWN_MODEL_TYPES: Record<string, Array<Record<string, unknown>>> = {
  'anthropic': ANTHROPIC_KNOWN_MODELS,
  'deepseek': DEEPSEEK_KNOWN_MODELS,
}

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

    // CLI-based providers
    if (CLI_TYPES.includes(provider.type)) {
      // For Gemini CLI, try to list available models
      if (provider.type === 'gemini-cli') {
        return NextResponse.json({
          models: [
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: provider.id },
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: provider.id },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: provider.id },
          ],
          count: 3,
          message: 'Gemini CLI models. Use gemini --model <model> to select.',
        })
      }
      return NextResponse.json(
        { error: 'CLI providers do not support remote model fetching. Configure models manually.' },
        { status: 400 }
      )
    }

    // OAuth / device-code providers
    if (OAUTH_TYPES.includes(provider.type)) {
      return NextResponse.json(
        { error: 'OAuth-based providers require authentication first. Please log in via the provider.' },
        { status: 400 }
      )
    }

    // Providers with known model lists
    if (KNOWN_MODEL_TYPES[provider.type]) {
      models = KNOWN_MODEL_TYPES[provider.type]
    }
    // Gemini API — try fetching from Google's endpoint
    else if (provider.type === 'gemini') {
      const apiKey = provider.apiKey || process.env.GOOGLE_API_KEY
      if (!apiKey) {
        models = GEMINI_KNOWN_MODELS
      } else {
        try {
          const baseUrl = (provider.baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '')
          const response = await fetch(`${baseUrl}/models?key=${apiKey}`, {
            signal: AbortSignal.timeout(15000),
          })
          if (response.ok) {
            const data = await response.json()
            models = (data.models ?? []).map((m: Record<string, unknown>) => ({
              id: m.name?.toString().replace('models/', '') ?? m.name,
              name: m.displayName ?? m.name?.toString().replace('models/', ''),
              owned_by: 'google',
            }))
          } else {
            models = GEMINI_KNOWN_MODELS
          }
        } catch {
          models = GEMINI_KNOWN_MODELS
        }
      }
    }
    // Ollama — use /api/tags
    else if (provider.type === 'ollama') {
      const baseUrl = (provider.baseUrl || 'http://localhost:11434').replace(/\/+$/, '')
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
      const ollamaModels = Array.isArray(data) ? data : (data.models ?? [])
      models = ollamaModels.map((m: Record<string, unknown>) => ({
        id: m.name ?? m.model,
        name: m.name ?? m.model,
        ...m,
      }))
    }
    // OpenAI-compatible providers — try /models endpoint
    else if (OPENAI_COMPATIBLE_TYPES.includes(provider.type)) {
      const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '')
      if (!baseUrl) {
        return NextResponse.json(
          { error: 'Base URL is required for this provider type. Please configure it in settings.' },
          { status: 400 }
        )
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Resolve API key from provider or environment variable
      const apiKey = provider.apiKey || (provider.envVar ? process.env[provider.envVar] : null)
      if (apiKey) {
        if (provider.type === 'openrouter') {
          headers['Authorization'] = `Bearer ${apiKey}`
          headers['HTTP-Referer'] = 'https://hermes-ai.app'
          headers['X-Title'] = 'Hermes AI Agent'
        } else if (provider.type === 'huggingface') {
          headers['Authorization'] = `Bearer ${apiKey}`
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`
        }
      }

      try {
        const response = await fetch(`${baseUrl}/models`, {
          headers,
          signal: AbortSignal.timeout(15000),
        })

        if (!response.ok) {
          // Fallback for OpenRouter
          if (provider.type === 'openrouter') {
            models = OPENROUTER_DEFAULT_MODELS
          } else {
            const errorText = await response.text().catch(() => 'Unknown error')
            return NextResponse.json(
              { error: `Failed to fetch models: ${response.status} - ${errorText}` },
              { status: 502 }
            )
          }
        } else {
          const data = await response.json()
          models = Array.isArray(data) ? data : (data.data ?? [])
        }
      } catch {
        if (provider.type === 'openrouter') {
          models = OPENROUTER_DEFAULT_MODELS
        } else {
          throw new Error('Network error fetching models')
        }
      }
    }
    // Unknown type — try generic OpenAI-compatible approach
    else {
      if (provider.baseUrl) {
        try {
          const baseUrl = provider.baseUrl.replace(/\/+$/, '')
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (provider.apiKey) headers['Authorization'] = `Bearer ${provider.apiKey}`
          const response = await fetch(`${baseUrl}/models`, {
            headers,
            signal: AbortSignal.timeout(15000),
          })
          if (response.ok) {
            const data = await response.json()
            models = Array.isArray(data) ? data : (data.data ?? [])
          }
        } catch {
          // Return empty models list
        }
      }

      if (models.length === 0) {
        return NextResponse.json(
          { error: `Cannot fetch models for provider type: ${provider.type}. Configure models manually or set a base URL.` },
          { status: 400 }
        )
      }
    }

    // Normalize models to have consistent fields
    const normalizedModels = models.map((m) => ({
      id: (m.id ?? m.name ?? m.model ?? '').toString(),
      name: (m.name ?? m.id ?? m.model ?? '').toString(),
      provider: provider.id,
    }))

    // Update the provider's models field
    await db.provider.update({
      where: { id },
      data: {
        models: JSON.stringify(normalizedModels),
      },
    })

    return NextResponse.json({ models: normalizedModels, count: normalizedModels.length })
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
