import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, size = '1024x1024' } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const validSizes = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'] as const
      const sizeValue = validSizes.includes(size as typeof validSizes[number]) ? size as typeof validSizes[number] : '1024x1024'

      const response = await zai.images.generations.create({
        prompt,
        size: sizeValue,
      })

      if (response?.data?.[0]?.base64) {
        return NextResponse.json({ image: response.data[0].base64 })
      }

      return NextResponse.json({ error: 'No image generated' }, { status: 500 })
    } catch (sdkError: unknown) {
      const errMsg = sdkError instanceof Error ? sdkError.message : 'SDK error'
      console.error('[chat/image] SDK error:', errMsg)
      return NextResponse.json({ error: `Image generation failed: ${errMsg}` }, { status: 500 })
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
