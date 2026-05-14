import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: NextRequest) {
  try {
    const { query, topK = 5 } = await req.json()
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    // Get all document chunks
    const docs = await db.memory.findMany({
      where: { key: { startsWith: 'document:' } }
    })

    // Simple keyword-based retrieval (since we don't have vector DB)
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const scored: Array<{ content: string; score: number; source: string }> = []

    for (const doc of docs) {
      let chunks: string[] = []
      try { chunks = JSON.parse(doc.embedding || '[]') } catch { chunks = [doc.content] }

      for (const chunk of chunks) {
        const lower = chunk.toLowerCase()
        let score = 0
        for (const word of queryWords) {
          if (lower.includes(word)) score += 1
        }
        if (score > 0) scored.push({ content: chunk, score, source: doc.key || '' })
      }
    }

    // Sort by score and take top K
    scored.sort((a, b) => b.score - a.score)
    const topResults = scored.slice(0, topK)

    // If we have results, use AI to generate an answer
    if (topResults.length > 0) {
      try {
        const zai = await ZAI.create()
        const context = topResults.map((r, i) => `[Document ${i + 1}]:\n${r.content}`).join('\n\n---\n\n')

        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'Answer the user question based ONLY on the provided document context. If the answer is not in the context, say so. Cite which document section you used.' },
            { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
          ],
          temperature: 0.3,
          max_tokens: 2048,
        })

        return NextResponse.json({
          answer: completion.choices[0]?.message?.content || 'No answer generated',
          sources: topResults.map(r => r.source),
          chunksUsed: topResults.length,
        })
      } catch (aiError) {
        // If AI fails, return raw chunks
        return NextResponse.json({
          answer: topResults.map(r => r.content).join('\n\n---\n\n'),
          sources: topResults.map(r => r.source),
          chunksUsed: topResults.length,
          note: 'AI synthesis failed, returning raw document chunks'
        })
      }
    }

    return NextResponse.json({
      answer: 'No relevant documents found for your query.',
      sources: [],
      chunksUsed: 0,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
