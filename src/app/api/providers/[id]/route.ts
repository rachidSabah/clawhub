import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const provider = await db.provider.findUnique({
      where: { id },
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(provider)
  } catch (error) {
    console.error('Failed to fetch provider:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.provider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, type, baseUrl, apiKey, isActive, isDefault, models } = body

    const validTypes = ['cli', 'openai-compatible', 'anthropic', 'ollama']
    if (type !== undefined && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // If this provider is being set as default, unset any existing default
    if (isDefault) {
      await db.provider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (type !== undefined) data.type = type
    if (baseUrl !== undefined) data.baseUrl = baseUrl
    if (apiKey !== undefined) data.apiKey = apiKey
    if (isActive !== undefined) data.isActive = isActive
    if (isDefault !== undefined) data.isDefault = isDefault
    if (models !== undefined) {
      data.models = typeof models === 'string' ? models : JSON.stringify(models)
    }

    const provider = await db.provider.update({
      where: { id },
      data,
    })

    return NextResponse.json(provider)
  } catch (error) {
    console.error('Failed to update provider:', error)
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.provider.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    await db.provider.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete provider:', error)
    return NextResponse.json(
      { error: 'Failed to delete provider' },
      { status: 500 }
    )
  }
}
