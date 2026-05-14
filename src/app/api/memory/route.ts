import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const key = searchParams.get('key')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (key) where.key = key

    const memories = await db.memory.findMany({
      where,
      orderBy: { relevance: 'desc' },
    })

    return NextResponse.json(memories)
  } catch (error) {
    console.error('Failed to fetch memories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, key, content, source, relevance } = body

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    const validTypes = ['fact', 'preference', 'context', 'conversation-summary', 'learned-pattern']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const memory = await db.memory.create({
      data: {
        type,
        key: key ?? null,
        content,
        source: source ?? null,
        relevance: relevance ?? 1.0,
      },
    })

    return NextResponse.json(memory, { status: 201 })
  } catch (error) {
    console.error('Failed to create memory:', error)
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    )
  }
}
