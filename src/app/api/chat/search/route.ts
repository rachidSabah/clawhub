import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, num = 5 } = body

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const results = await zai.functions.invoke('web_search', {
        query,
        num,
      })

      return NextResponse.json({ results })
    } catch (sdkError: unknown) {
      const errMsg = sdkError instanceof Error ? sdkError.message : 'SDK error'
      console.error('[chat/search] SDK error:', errMsg)
      return NextResponse.json({ error: `Search failed: ${errMsg}` }, { status: 500 })
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
