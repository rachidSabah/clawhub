import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET — list soft-deleted conversations and messages
export async function GET() {
  try {
    const deletedConversations = await db.conversation.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: 'desc' },
    })

    const deletedMessages = await db.message.findMany({
      where: { isDeleted: true },
      orderBy: { deletedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      conversations: deletedConversations,
      messages: deletedMessages,
    })
  } catch (error) {
    console.error('Failed to fetch deleted history:', error)
    return NextResponse.json({ error: 'Failed to fetch deleted history' }, { status: 500 })
  }
}
