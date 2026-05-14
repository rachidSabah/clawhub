import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAILLM from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, maxMessages = 20 } = body

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    }

    // Fetch conversation with messages
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messages = conversation.messages

    if (messages.length <= maxMessages) {
      return NextResponse.json({
        compressed: false,
        message: 'Conversation is within limits, no compression needed',
        totalMessages: messages.length,
        maxMessages,
      })
    }

    // Get older messages to compress
    const olderMessages = messages.slice(0, messages.length - maxMessages)
    const recentMessages = messages.slice(messages.length - maxMessages)

    // Build summary text from older messages
    const conversationText = olderMessages
      .map(m => `[${m.role}]: ${m.content}`)
      .join('\n\n')

    // Generate summary using z-ai-web-dev-sdk
    let summary = ''
    try {
      const ai = new ZAILLM()
      const completion = await ai.chat.completions.create({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a conversation summarizer. Summarize the following conversation concisely, preserving key facts, decisions, and context that would be needed for future reference. Be thorough but concise.',
          },
          {
            role: 'user',
            content: `Summarize this conversation:\n\n${conversationText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      })
      summary = completion.choices?.[0]?.message?.content || 'Summary unavailable'
    } catch {
      // Fallback: create a basic summary
      summary = `[Context Summary] ${olderMessages.length} messages compressed. Topics discussed: ` +
        olderMessages
          .filter(m => m.role === 'user')
          .slice(0, 5)
          .map(m => m.content.slice(0, 100))
          .join('; ')
    }

    // Create a context-summary message
    const summaryMessage = await db.message.create({
      data: {
        conversationId,
        role: 'system',
        content: `📋 **Context Summary** (${olderMessages.length} messages compressed)\n\n${summary}`,
        metadata: JSON.stringify({
          type: 'context-summary',
          compressedCount: olderMessages.length,
          compressedAt: new Date().toISOString(),
        }),
      },
    })

    // Soft-delete the older messages
    await db.message.updateMany({
      where: {
        id: { in: olderMessages.map(m => m.id) },
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({
      compressed: true,
      compressedCount: olderMessages.length,
      remainingCount: recentMessages.length + 1, // +1 for the summary message
      summaryMessageId: summaryMessage.id,
      totalMessages: messages.length,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[context/compress] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
