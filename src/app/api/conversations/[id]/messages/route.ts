import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const conversation = await db.conversation.findUnique({
      where: { id },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const messages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const conversation = await db.conversation.findUnique({
      where: { id },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { role, content, metadata, isStreaming } = body

    const validRoles = [
      'user',
      'assistant',
      'system',
      'agent-thought',
      'agent-action',
      'agent-observation',
    ]

    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Role is required and must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    const message = await db.message.create({
      data: {
        conversationId: id,
        role,
        content,
        metadata: metadata !== undefined
          ? typeof metadata === 'string'
            ? metadata
            : JSON.stringify(metadata)
          : null,
        isStreaming: isStreaming ?? false,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Failed to create message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
