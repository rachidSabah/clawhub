import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const models = await db.modelConfig.findMany({
      orderBy: { priority: 'asc' },
    })
    return NextResponse.json(models)
  } catch (error) {
    console.error('Failed to fetch model configs:', error)
    return NextResponse.json({ error: 'Failed to fetch model configs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, provider, contextWindow, auxiliaryModels, auxiliaryContext, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, priority, autoOptimize, isActive, isDefault, modelId, baseUrl, apiKey, envVar, authType, providerConfig } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    if (isDefault) {
      await db.modelConfig.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const model = await db.modelConfig.create({
      data: {
        name,
        provider: provider || 'custom',
        contextWindow: contextWindow || 128000,
        auxiliaryModels: auxiliaryModels ? (typeof auxiliaryModels === 'string' ? auxiliaryModels : JSON.stringify(auxiliaryModels)) : null,
        auxiliaryContext: auxiliaryContext ? (typeof auxiliaryContext === 'string' ? auxiliaryContext : JSON.stringify(auxiliaryContext)) : null,
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 4096,
        topP: topP ?? 1.0,
        frequencyPenalty: frequencyPenalty ?? 0.0,
        presencePenalty: presencePenalty ?? 0.0,
        priority: priority ?? 1,
        autoOptimize: autoOptimize ?? true,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
        modelId: modelId ?? null,
        baseUrl: baseUrl ?? null,
        apiKey: apiKey ?? null,
        envVar: envVar ?? null,
        authType: authType ?? null,
        providerConfig: providerConfig ? (typeof providerConfig === 'string' ? providerConfig : JSON.stringify(providerConfig)) : null,
      },
    })

    return NextResponse.json(model, { status: 201 })
  } catch (error) {
    console.error('Failed to create model config:', error)
    return NextResponse.json({ error: 'Failed to create model config' }, { status: 500 })
  }
}
