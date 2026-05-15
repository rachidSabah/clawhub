import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Resolve API key: provider.apiKey > process.env > .env file
function resolveApiKey(envVar?: string | null, providerApiKey?: string | null): string | null {
  // 1. Provider's stored API key (from "Add Provider" form)
  if (providerApiKey) return providerApiKey

  // 2. process.env (loaded at startup)
  if (envVar && process.env[envVar]) return process.env[envVar]

  // 3. Read .env file directly (for keys saved via "API Keys" tab without restart)
  if (envVar) {
    try {
      const envPath = resolve(process.cwd(), '.env')
      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, 'utf-8')
        const match = envContent.match(new RegExp(`^${envVar}=(.+)$`, 'm'))
        if (match && match[1]) {
          const val = match[1].trim().replace(/^["']|["']$/g, '')
          if (val) return val
        }
      }
    } catch {}
  }

  return null
}

// Resolve base URL: provider.baseUrl > defaultBaseUrl from known list
const PROVIDER_DEFAULT_URLS: Record<string, string> = {
  'anthropic': 'https://api.anthropic.com/v1',
  'openrouter': 'https://openrouter.ai/api/v1',
  'novita': 'https://api.novita.ai/v3/openai',
  'ai-gateway': 'https://api.ai-gateway/v1',
  'zai': 'https://open.bigmodel.cn/api/paas/v4',
  'kimi': 'https://api.moonshot.cn/v1',
  'kimi-cn': 'https://api.moonshot.cn/v1',
  'arcee': 'https://api.arcee.ai/v1',
  'gmi': 'https://api.gmi.cloud/v1',
  'minimax': 'https://api.minimax.chat/v1',
  'minimax-cn': 'https://api.minimax.chat/v1',
  'alibaba': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'alibaba-coding': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'kilocode': 'https://api.kilocode.ai/v1',
  'xiaomi': 'https://api.xiaomi.com/v1',
  'tencent-tokenhub': 'https://api.tokenhub.tencent.com/v1',
  'opencode-zen': 'https://api.opencode.dev/v1',
  'opencode-go': 'https://api.opencode.dev/v1',
  'deepseek': 'https://api.deepseek.com/v1',
  'huggingface': 'https://api-inference.huggingface.co/v1',
  'gemini': 'https://generativelanguage.googleapis.com/v1beta',
  'lmstudio': 'http://localhost:1234/v1',
  'ollama': 'http://localhost:11434',
}

function resolveBaseUrl(providerType: string, providerBaseUrl?: string | null): string | null {
  if (providerBaseUrl) return providerBaseUrl.replace(/\/+$/, '')
  return PROVIDER_DEFAULT_URLS[providerType]?.replace(/\/+$/, '') ?? null
}

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

// Shared logic for fetching models for a provider
async function fetchModelsForProvider(id: string) {
  const provider = await db.provider.findUnique({ where: { id } })
  if (!provider) {
    return NextResponse.json(
      { error: 'Provider not found' },
      { status: 404 }
    )
  }

  let models: Array<Record<string, unknown>> = []

  // Helper: return models and persist them to DB
  async function returnModels(modelsList: Array<Record<string, unknown>>, message?: string) {
    const normalizedModels = modelsList.map((m, i) => {
      const rawId = (m.id ?? m.name ?? m.model ?? '').toString()
      const rawName = (m.name ?? m.id ?? m.model ?? '').toString()
      return {
        id: rawId || `${provider.type}-model-${i}`,
        name: rawName || `Model ${i + 1}`,
        provider: provider.id,
      }
    })

    // Persist to DB
    try {
      await db.provider.update({
        where: { id },
        data: { models: JSON.stringify(normalizedModels) },
      })
    } catch (e) {
      console.error('Failed to persist models:', e)
    }

    return NextResponse.json({ models: normalizedModels, count: normalizedModels.length, ...(message ? { message } : {}) })
  }

  // CLI-based providers
  if (CLI_TYPES.includes(provider.type)) {
    if (provider.type === 'gemini-cli') {
      return returnModels([
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      ], 'Gemini CLI models. Use gemini --model <model> to select.')
    }
    // Other CLI providers: return empty models list (not an error)
    return returnModels([], 'CLI providers do not support remote model fetching. Configure models manually.')
  }

  // OAuth / device-code providers: return known models instead of error
  if (OAUTH_TYPES.includes(provider.type)) {
    const oauthModels: Record<string, Array<Record<string, unknown>>> = {
      'github-copilot': [
        { id: 'gpt-4o', name: 'GPT-4o (Copilot)' },
        { id: 'claude-sonnet-4', name: 'Claude Sonnet 4 (Copilot)' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Copilot)' },
      ],
      'gemini-oauth': [
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      ],
    }
    const known = oauthModels[provider.type] || []
    return returnModels(known, 'OAuth provider — showing default models. Authenticate to fetch full list.')
  }

  // Providers with known model lists
  if (KNOWN_MODEL_TYPES[provider.type]) {
    models = KNOWN_MODEL_TYPES[provider.type]
  }
  // Gemini API — try fetching from Google's endpoint
  else if (provider.type === 'gemini') {
    const apiKey = resolveApiKey(provider.envVar, provider.apiKey)
    if (!apiKey) {
      models = GEMINI_KNOWN_MODELS
    } else {
      try {
        const baseUrl = resolveBaseUrl(provider.type, provider.baseUrl) || 'https://generativelanguage.googleapis.com/v1beta'
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
    const baseUrl = resolveBaseUrl(provider.type, provider.baseUrl) || 'http://localhost:11434'
    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) {
        // Return cached models if available, otherwise empty list
        if (provider.models) {
          try {
            const cached = JSON.parse(provider.models)
            if (Array.isArray(cached) && cached.length > 0) {
              return NextResponse.json({ models: cached, count: cached.length, message: 'Ollama not reachable. Using cached models.' })
            }
          } catch {}
        }
        return returnModels([], `Ollama not reachable at ${baseUrl}. Make sure Ollama is running.`)
      }
      const data = await response.json()
      const ollamaModels = Array.isArray(data) ? data : (data.models ?? [])
      models = ollamaModels.map((m: Record<string, unknown>) => ({
        id: m.name ?? m.model,
        name: m.name ?? m.model,
        ...m,
      }))
    } catch {
      // Network error for Ollama
      if (provider.models) {
        try {
          const cached = JSON.parse(provider.models)
          if (Array.isArray(cached) && cached.length > 0) {
            return NextResponse.json({ models: cached, count: cached.length, message: 'Ollama not reachable. Using cached models.' })
          }
        } catch {}
      }
      return returnModels([], `Ollama not reachable at ${baseUrl}. Make sure Ollama is running.`)
    }
  }
  // OpenAI-compatible providers — try /models endpoint
  else if (OPENAI_COMPATIBLE_TYPES.includes(provider.type)) {
    const baseUrl = resolveBaseUrl(provider.type, provider.baseUrl)
    if (!baseUrl) {
      // No base URL: return empty models (not an error) — provider needs configuration
      return returnModels([], 'Base URL is required for this provider type. Please configure it in settings.')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Resolve API key from provider DB, process.env, or .env file
    const apiKey = resolveApiKey(provider.envVar, provider.apiKey)
    if (apiKey) {
      if (provider.type === 'openrouter') {
        headers['Authorization'] = `Bearer ${apiKey}`
        headers['HTTP-Referer'] = 'https://hermes-ai.app'
        headers['X-Title'] = 'Hermes AI Agent'
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
          // Return cached models if available, otherwise empty list
          if (provider.models) {
            try {
              const cached = JSON.parse(provider.models)
              if (Array.isArray(cached) && cached.length > 0) {
                return NextResponse.json({ models: cached, count: cached.length, message: 'Using cached models (API returned error).' })
              }
            } catch {}
          }
          // No cached models — return empty list with warning
          return returnModels([], `Could not fetch models from API (status ${response.status}). Check your API key and base URL.`)
        }
      } else {
        const data = await response.json()
        models = Array.isArray(data) ? data : (data.data ?? [])
      }
    } catch {
      if (provider.type === 'openrouter') {
        models = OPENROUTER_DEFAULT_MODELS
      } else {
        // Network error: return cached models if available
        if (provider.models) {
          try {
            const cached = JSON.parse(provider.models)
            if (Array.isArray(cached) && cached.length > 0) {
              return NextResponse.json({ models: cached, count: cached.length, message: 'Using cached models (network error).' })
            }
          } catch {}
        }
        return returnModels([], 'Network error fetching models. Check your connection and API configuration.')
      }
    }
  }
  // Unknown type — try generic OpenAI-compatible approach
  else {
    const baseUrl = resolveBaseUrl(provider.type, provider.baseUrl)
    if (baseUrl) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        const apiKey = resolveApiKey(provider.envVar, provider.apiKey)
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
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
      // Try cached models first
      if (provider.models) {
        try {
          const cached = JSON.parse(provider.models)
          if (Array.isArray(cached) && cached.length > 0) {
            return NextResponse.json({ models: cached, count: cached.length, message: 'Using cached models.' })
          }
        } catch {}
      }
      // Return empty models instead of error
      return returnModels([], `Cannot fetch models for provider type: ${provider.type}. Configure models manually or set a base URL.`)
    }
  }

  // Normalize models to have consistent fields — ensure no empty IDs
  const normalizedModels = models.map((m, i) => {
    const rawId = (m.id ?? m.name ?? m.model ?? '').toString()
    const rawName = (m.name ?? m.id ?? m.model ?? '').toString()
    return {
      id: rawId || `${provider.type}-model-${i}`,
      name: rawName || `Model ${i + 1}`,
      provider: provider.id,
    }
  })

  // Update the provider's models field
  await db.provider.update({
    where: { id },
    data: {
      models: JSON.stringify(normalizedModels),
    },
  })

  return NextResponse.json({ models: normalizedModels, count: normalizedModels.length })
}

// GET /api/providers/[id]/models — Fetch models for a provider
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await fetchModelsForProvider(id)
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

// POST /api/providers/[id]/models — Fetch and persist models for a provider
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return await fetchModelsForProvider(id)
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
