import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const memory = await db.memory.findUnique({
      where: { id },
    })

    if (!memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      )
    }

    // Increment accessCount on read
    const updated = await db.memory.update({
      where: { id },
      data: { accessCount: { increment: 1 } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to fetch memory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memory' },
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

    const existing = await db.memory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { content, relevance } = body

    const data: Record<string, unknown> = {}
    if (content !== undefined) data.content = content
    if (relevance !== undefined) {
      if (typeof relevance !== 'number' || relevance < 0) {
        return NextResponse.json(
          { error: 'Relevance must be a non-negative number' },
          { status: 400 }
        )
      }
      data.relevance = relevance
    }

    const memory = await db.memory.update({
      where: { id },
      data,
    })

    return NextResponse.json(memory)
  } catch (error) {
    console.error('Failed to update memory:', error)
    return NextResponse.json(
      { error: 'Failed to update memory' },
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

    const existing = await db.memory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      )
    }

    await db.memory.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete memory:', error)
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    )
  }
}
