import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, provider, model, temperature = 0.7, maxTokens = 4096 } = body

    // Try to use z-ai-web-dev-sdk for streaming
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const stream = await zai.chat.completions.create({
        model: model || undefined,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        stream: true,
      })

      // If the SDK returns a ReadableStream, pipe it through SSE
      if (stream && typeof stream === 'object' && 'getReader' in stream) {
        const reader = (stream as ReadableStream<Uint8Array>).getReader()
        const decoder = new TextDecoder()

        const encoder = new TextEncoder()
        const transformStream = new TransformStream()
        const writer = transformStream.writable.getWriter()

        // Process the stream in the background
        ;(async () => {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') continue
                  try {
                    const parsed = JSON.parse(data)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`))
                    }
                  } catch {
                    // not JSON, forward raw
                  }
                }
              }
            }
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : 'Unknown error'
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`))
          } finally {
            await writer.close()
          }
        })()

        return new Response(transformStream.readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }

      // If the SDK returns a non-streaming response, wrap it as SSE
      const response = stream as { choices?: Array<{ message?: { content?: string } }> }
      if (response?.choices?.[0]?.message?.content) {
        const content = response.choices[0].message.content
        const encoder = new TextEncoder()
        const transformStream = new TransformStream()
        const writer = transformStream.writable.getWriter()

        ;(async () => {
          // Simulate streaming by sending chunks
          const words = content.split(' ')
          for (let i = 0; i < words.length; i++) {
            const chunk = i === 0 ? words[i] : ' ' + words[i]
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`))
          }
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          await writer.close()
        })()

        return new Response(transformStream.readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }

      // If nothing worked, return an error
      return new Response(
        `data: ${JSON.stringify({ type: 'error', error: 'No response from model' })}\n\n`,
        { headers: { 'Content-Type': 'text/event-stream' } }
      )
    } catch (sdkError: unknown) {
      const errMsg = sdkError instanceof Error ? sdkError.message : 'SDK error'
      console.error('[chat/stream] SDK error:', errMsg)

      // Return error as SSE
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: `Failed to connect to AI provider: ${errMsg}. Please configure a provider in Settings.` })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[chat/stream] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
