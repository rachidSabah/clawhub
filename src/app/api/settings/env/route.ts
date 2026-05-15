import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Environment Variable Configuration API
// Allows the Dashboard Settings UI to read/write .env values
// ---------------------------------------------------------------------------

// Keys that contain sensitive values — masked on read
const SENSITIVE_PATTERNS = [
  /_API_KEY$/i,
  /_TOKEN$/i,
  /_SECRET$/i,
  /^HF_TOKEN$/i,
  /^GLM_API_KEY$/i,
  /^DASHSCOPE_API_KEY$/i,
]

// All known env keys organized by category
const ENV_CATEGORIES = {
  database: ['DATABASE_URL'],
  aiProviders: [
    'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_API_KEY', 'DEEPSEEK_API_KEY',
    'OPENROUTER_API_KEY', 'HF_TOKEN', 'GLM_API_KEY', 'KIMI_API_KEY',
    'DASHSCOPE_API_KEY', 'MINIMAX_API_KEY', 'NOVITA_API_KEY', 'GROQ_API_KEY',
    'MISTRAL_API_KEY', 'COHERE_API_KEY', 'TOGETHER_API_KEY', 'FIREWORKS_API_KEY',
    'PERPLEXITY_API_KEY', 'XAI_API_KEY', 'SAMBANOVA_API_KEY', 'CEREBRAS_API_KEY',
    'AI21_API_KEY', 'VOYAGE_API_KEY', 'LM_API_KEY', 'LM_BASE_URL',
    'OLLAMA_BASE_URL',
  ],
  messaging: [
    'MESSAGING_ENABLED', 'TELEGRAM_BOT_TOKEN', 'DISCORD_BOT_TOKEN',
    'SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'SLACK_APP_TOKEN',
    'SIGNAL_NUMBER', 'SIGNAL_CLI_API', 'HA_WEBHOOK_URL', 'HA_TOKEN',
  ],
  whatsapp: ['WHATTSAPP_ENABLED'],
  agentWs: ['AGENT_WS_PORT'],
  security: [
    'SECURITY_AUTO_APPROVE_LOW', 'DM_ALLOWED_TELEGRAM', 'DM_ALLOWED_DISCORD',
    'RATE_LIMIT_RPM',
  ],
  autoUpdate: ['AUTO_UPDATE_ENABLED', 'AUTO_UPDATE_INTERVAL_MINUTES'],
  app: ['PORT', 'NODE_ENV', 'APP_VERSION', 'NEXT_TELEMETRY_DISABLED'],
}

function isSensitive(key: string): boolean {
  return SENSITIVE_PATTERNS.some(p => p.test(key))
}

function maskValue(value: string): string {
  if (!value || value.length <= 8) return '••••••••'
  return value.slice(0, 4) + '••••' + value.slice(-4)
}

function getEnvPath(): string {
  // Resolve .env path relative to project root
  // In development, cwd is the project root
  // In production, we need to find it
  const cwd = process.cwd()
  return join(cwd, '.env')
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

function serializeEnvFile(entries: Record<string, string>, existingContent: string): string {
  // Parse existing content to preserve comments and structure
  const existingParsed = parseEnvFile(existingContent)
  const merged = { ...existingParsed, ...entries }

  // Build the new .env content preserving the original structure
  const lines = existingContent.split('\n')
  const updatedKeys = new Set<string>()
  const result: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      result.push(line)
      continue
    }
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) {
      result.push(line)
      continue
    }
    const key = trimmed.slice(0, eqIndex).trim()
    if (key in entries) {
      // Update this key's value
      const value = entries[key]
      const needsQuotes = value.includes(' ') || value.includes('#')
      result.push(needsQuotes ? `${key}="${value}"` : `${key}=${value}`)
      updatedKeys.add(key)
    } else {
      result.push(line)
    }
  }

  // Add any new keys that weren't in the original file
  for (const [key, value] of Object.entries(entries)) {
    if (!updatedKeys.has(key) && !(key in existingParsed)) {
      const needsQuotes = value.includes(' ') || value.includes('#')
      result.push(needsQuotes ? `${key}="${value}"` : `${key}=${value}`)
    }
  }

  return result.join('\n')
}

// GET /api/settings/env — Read environment variables (with masking)
export async function GET() {
  try {
    const envPath = getEnvPath()
    const existing: Record<string, string> = {}

    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8')
      const parsed = parseEnvFile(content)
      Object.assign(existing, parsed)
    }

    // Also read from process.env for runtime values
    const allKeys = Object.values(ENV_CATEGORIES).flat()
    const result: Record<string, { value: string; masked: boolean; source: 'file' | 'runtime' | 'default' }> = {}

    for (const key of allKeys) {
      const fileValue = existing[key]
      const runtimeValue = process.env[key]
      const value = fileValue || runtimeValue || ''
      const source = fileValue ? 'file' : runtimeValue ? 'runtime' : 'default'
      const masked = isSensitive(key) && value

      result[key] = {
        value: masked ? maskValue(value) : value,
        masked,
        source,
      }
    }

    // Also include any extra keys from .env that aren't in our known list
    for (const [key, value] of Object.entries(existing)) {
      if (!(key in result)) {
        const masked = isSensitive(key) && value
        result[key] = {
          value: masked ? maskValue(value) : value,
          masked,
          source: 'file',
        }
      }
    }

    return NextResponse.json({
      env: result,
      categories: ENV_CATEGORIES,
      restartRequired: false,
    })
  } catch (error) {
    console.error('Failed to read env settings:', error)
    return NextResponse.json(
      { error: 'Failed to read environment settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/env — Update environment variables in .env file
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be a JSON object with key-value pairs' },
        { status: 400 }
      )
    }

    const updates = body.updates as Record<string, string> | undefined
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
    }

    const envPath = getEnvPath()
    let existingContent = ''

    if (existsSync(envPath)) {
      existingContent = readFileSync(envPath, 'utf-8')
    }

    // Write updated content
    const newContent = serializeEnvFile(updates, existingContent)
    writeFileSync(envPath, newContent, 'utf-8')

    // Also update process.env for the current session
    for (const [key, value] of Object.entries(updates)) {
      process.env[key] = value
    }

    // Sync API keys to provider DB records so model fetching works
    // This maps env var names to provider types
    const ENV_TO_PROVIDER: Record<string, string> = {
      'ANTHROPIC_API_KEY': 'anthropic',
      'OPENAI_API_KEY': 'openai',
      'GOOGLE_API_KEY': 'gemini',
      'DEEPSEEK_API_KEY': 'deepseek',
      'OPENROUTER_API_KEY': 'openrouter',
      'HF_TOKEN': 'huggingface',
      'GLM_API_KEY': 'zai',
      'KIMI_API_KEY': 'kimi',
      'KIMI_CN_API_KEY': 'kimi-cn',
      'DASHSCOPE_API_KEY': 'alibaba',
      'MINIMAX_API_KEY': 'minimax',
      'MINIMAX_CN_API_KEY': 'minimax-cn',
      'NOVITA_API_KEY': 'novita',
      'GROQ_API_KEY': 'groq',
      'MISTRAL_API_KEY': 'mistral',
      'COHERE_API_KEY': 'cohere',
      'TOGETHER_API_KEY': 'together',
      'FIREWORKS_API_KEY': 'fireworks',
      'PERPLEXITY_API_KEY': 'perplexity',
      'XAI_API_KEY': 'xai',
      'SAMBANOVA_API_KEY': 'sambanova',
      'CEREBRAS_API_KEY': 'cerebras',
      'AI21_API_KEY': 'ai21',
      'VOYAGE_API_KEY': 'voyage',
      'ARCEEAI_API_KEY': 'arcee',
      'GMI_API_KEY': 'gmi',
      'KILOCODE_API_KEY': 'kilocode',
      'XIAOMI_API_KEY': 'xiaomi',
      'TOKENHUB_API_KEY': 'tencent-tokenhub',
      'OPENCODE_ZEN_API_KEY': 'opencode-zen',
      'OPENCODE_GO_API_KEY': 'opencode-go',
      'AI_GATEWAY_API_KEY': 'ai-gateway',
    }

    const syncedProviders: string[] = []
    for (const [key, value] of Object.entries(updates)) {
      const providerType = ENV_TO_PROVIDER[key]
      if (providerType && value) {
        try {
          const provider = await db.provider.findFirst({ where: { type: providerType } })
          if (provider) {
            await db.provider.update({
              where: { id: provider.id },
              data: { apiKey: value },
            })
            syncedProviders.push(providerType)
          }
        } catch (e) {
          console.error(`Failed to sync ${key} to provider ${providerType}:`, e)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Environment variables updated. Some changes may require a server restart to take full effect.',
      updatedKeys: Object.keys(updates),
      restartRequired: true,
    })
  } catch (error) {
    console.error('Failed to update env settings:', error)
    return NextResponse.json(
      { error: 'Failed to update environment settings' },
      { status: 500 }
    )
  }
}
