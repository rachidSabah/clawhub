import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, type, limit } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const take = typeof limit === 'number' && limit > 0 ? limit : 20

    const where: Record<string, unknown> = {
      content: { contains: query },
    }
    if (type) where.type = type

    const memories = await db.memory.findMany({
      where,
      orderBy: { relevance: 'desc' },
      take,
    })

    return NextResponse.json(memories)
  } catch (error) {
    console.error('Failed to search memories:', error)
    return NextResponse.json(
      { error: 'Failed to search memories' },
      { status: 500 }
    )
  }
}
