import { NextRequest, NextResponse } from 'next/server'

const WHATSAPP_BRIDGE_URL = process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:3004'

export async function GET() {
  try {
    const res = await fetch(`${WHATSAPP_BRIDGE_URL}/status`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { connected: false, status: 'offline', error: 'WhatsApp bridge service not running' },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'connect') {
      const res = await fetch(`${WHATSAPP_BRIDGE_URL}/connect`, { method: 'POST' })
      return NextResponse.json(await res.json())
    }

    if (action === 'disconnect') {
      const res = await fetch(`${WHATSAPP_BRIDGE_URL}/disconnect`, { method: 'POST' })
      return NextResponse.json(await res.json())
    }

    if (action === 'send') {
      const res = await fetch(`${WHATSAPP_BRIDGE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return NextResponse.json(await res.json())
    }

    if (action === 'qr') {
      const res = await fetch(`${WHATSAPP_BRIDGE_URL}/qr`)
      return NextResponse.json(await res.json())
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: 'WhatsApp bridge service not running' },
      { status: 503 }
    )
  }
}
