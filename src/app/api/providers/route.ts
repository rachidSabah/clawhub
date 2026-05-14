import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

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

    const validTypes = ['cli', 'openai-compatible', 'anthropic', 'ollama']
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type is required and must be one of: ${validTypes.join(', ')}` },
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

    const provider = await db.provider.create({
      data: {
        name,
        type,
        baseUrl: baseUrl ?? null,
        apiKey: apiKey ?? null,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        models: models !== undefined
          ? typeof models === 'string'
            ? models
            : JSON.stringify(models)
          : null,
        envVar: envVar ?? null,
        authType: authType ?? null,
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
