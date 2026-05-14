import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      where: { isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { where: { isDeleted: false }, orderBy: { createdAt: 'asc' } } },
    })
    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Failed to fetch conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, mode, provider, model, systemPrompt, workspaceId } = body

    const conversation = await db.conversation.create({
      data: {
        title: title || 'New Chat',
        mode: mode || 'chat',
        provider: provider ?? null,
        model: model ?? null,
        systemPrompt: systemPrompt ?? null,
        workspaceId: workspaceId ?? null,
      },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Failed to create conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
