import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, mode, provider, model, systemPrompt } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const validModes = ['chat', 'agent']
    if (mode && !validModes.includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be "chat" or "agent"' },
        { status: 400 }
      )
    }

    const conversation = await db.conversation.create({
      data: {
        title,
        mode: mode ?? 'chat',
        provider: provider ?? null,
        model: model ?? null,
        systemPrompt: systemPrompt ?? null,
      },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
