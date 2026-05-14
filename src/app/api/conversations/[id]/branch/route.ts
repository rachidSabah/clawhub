import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { messageId } = await req.json()

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
    }

    const original = await db.conversation.findUnique({
      where: { id },
      include: { messages: { where: { isDeleted: false }, orderBy: { createdAt: 'asc' } } },
    })

    if (!original || original.isDeleted) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const branchPoint = original.messages.find(m => m.id === messageId)
    if (!branchPoint) {
      return NextResponse.json({ error: 'Message not found in conversation' }, { status: 404 })
    }

    // Get messages up to and including the branch point
    const messagesToCopy = original.messages.filter(
      m => new Date(m.createdAt) <= new Date(branchPoint.createdAt)
    )

    // Create new conversation (branch)
    const newConv = await db.conversation.create({
      data: {
        title: `Branch: ${original.title}`,
        mode: original.mode,
        provider: original.provider,
        model: original.model,
        systemPrompt: original.systemPrompt,
        workspaceId: original.workspaceId,
      },
    })

    // Copy messages into the branch
    for (const msg of messagesToCopy) {
      await db.message.create({
        data: {
          conversationId: newConv.id,
          role: msg.role,
          content: msg.content,
          metadata: msg.metadata,
          isStreaming: false,
          isDeleted: false,
        },
      })
    }

    const result = await db.conversation.findUnique({
      where: { id: newConv.id },
      include: { messages: { where: { isDeleted: false }, orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[branch] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
