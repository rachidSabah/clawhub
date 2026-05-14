import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { HERMES_PROVIDERS } from '@/lib/api'

// All valid provider types from the Hermes registry
const VALID_TYPES = HERMES_PROVIDERS.map(p => p.type)

export async function GET() {
  try {
    const providers = await db.provider.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Failed to fetch providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, baseUrl, apiKey, isActive, isDefault, models, envVar, authType, providerConfig } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Accept all Hermes provider types plus 'cli' for backwards compatibility
    const allValidTypes = [...VALID_TYPES, 'cli', 'openai-compatible']
    if (!type || !allValidTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type is required and must be one of: ${allValidTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // If this provider is set as default, unset any existing default
    if (isDefault) {
      await db.provider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const validAuthTypes = ['api-key', 'oauth', 'cli', 'device-code']
    if (authType && !validAuthTypes.includes(authType)) {
      return NextResponse.json(
        { error: `Auth type must be one of: ${validAuthTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Look up default base URL and env var from the Hermes registry if not provided
    const hermesDef = HERMES_PROVIDERS.find(p => p.type === type)
    const resolvedBaseUrl = baseUrl ?? hermesDef?.defaultBaseUrl ?? null
    const resolvedEnvVar = envVar ?? hermesDef?.envVar ?? null
    const resolvedAuthType = authType ?? hermesDef?.authType ?? null

    const provider = await db.provider.create({
      data: {
        name,
        type,
        baseUrl: resolvedBaseUrl,
        apiKey: apiKey ?? null,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        models: models !== undefined
          ? typeof models === 'string'
            ? models
            : JSON.stringify(models)
          : null,
        envVar: resolvedEnvVar,
        authType: resolvedAuthType,
        providerConfig: providerConfig !== undefined
          ? typeof providerConfig === 'string'
            ? providerConfig
            : JSON.stringify(providerConfig)
          : null,
      },
    })

    return NextResponse.json(provider, { status: 201 })
  } catch (error) {
    console.error('Failed to create provider:', error)
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    )
  }
}
