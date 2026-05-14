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
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Failed to fetch conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
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

    const existing = await db.conversation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title, mode, provider, model, systemPrompt, isArchived } = body

    const validModes = ['chat', 'agent']
    if (mode !== undefined && !validModes.includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be "chat" or "agent"' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (mode !== undefined) data.mode = mode
    if (provider !== undefined) data.provider = provider
    if (model !== undefined) data.model = model
    if (systemPrompt !== undefined) data.systemPrompt = systemPrompt
    if (isArchived !== undefined) data.isArchived = isArchived

    const conversation = await db.conversation.update({
      where: { id },
      data,
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Failed to update conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
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

    const existing = await db.conversation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    await db.conversation.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
