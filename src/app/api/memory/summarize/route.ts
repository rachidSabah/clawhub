import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId } = body

    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Fetch the conversation and its messages
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (conversation.messages.length === 0) {
      return NextResponse.json(
        { error: 'Conversation has no messages to summarize' },
        { status: 400 }
      )
    }

    const createdMemories = []

    // Build a text summary of the conversation
    const messageLines = conversation.messages.map(
      (msg) => `${msg.role}: ${msg.content}`
    )
    const conversationText = messageLines.join('\n')

    // Create a conversation-summary memory entry
    const summaryContent = `Summary of conversation "${conversation.title}":\n${conversationText.slice(0, 2000)}${conversationText.length > 2000 ? '...' : ''}`

    const summaryMemory = await db.memory.create({
      data: {
        type: 'conversation-summary',
        key: `conversation:${conversationId}`,
        content: summaryContent,
        source: conversationId,
        relevance: 0.8,
      },
    })
    createdMemories.push(summaryMemory)

    // Extract simple facts and preferences from the conversation
    // Look for user messages that indicate preferences or factual statements
    const userMessages = conversation.messages.filter(
      (msg) => msg.role === 'user'
    )

    for (const msg of userMessages) {
      const text = msg.content.toLowerCase()

      // Detect preference patterns
      if (
        text.includes('i prefer') ||
        text.includes('i like') ||
        text.includes('i always') ||
        text.includes('i usually') ||
        text.includes('my favorite') ||
        text.includes('i want') ||
        text.includes("don't like") ||
        text.includes('i hate')
      ) {
        const prefMemory = await db.memory.create({
          data: {
            type: 'preference',
            content: msg.content.slice(0, 500),
            source: conversationId,
            relevance: 0.9,
          },
        })
        createdMemories.push(prefMemory)
      }

      // Detect fact patterns
      if (
        text.includes('my name is') ||
        text.includes('i am a') ||
        text.includes('i work at') ||
        text.includes('i live in') ||
        text.includes('my project') ||
        text.includes('i use') ||
        text.includes('my team')
      ) {
        const factMemory = await db.memory.create({
          data: {
            type: 'fact',
            content: msg.content.slice(0, 500),
            source: conversationId,
            relevance: 0.9,
          },
        })
        createdMemories.push(factMemory)
      }
    }

    return NextResponse.json({ memories: createdMemories }, { status: 201 })
  } catch (error) {
    console.error('Failed to summarize conversation:', error)
    return NextResponse.json(
      { error: 'Failed to summarize conversation' },
      { status: 500 }
    )
  }
}
