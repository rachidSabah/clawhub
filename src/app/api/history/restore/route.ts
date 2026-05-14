import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, id } = await request.json()

    if (!type || !id) return NextResponse.json({ error: 'type and id required' }, { status: 400 })

    if (type === 'conversation') {
      const conv = await db.conversation.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null },
      })
      return NextResponse.json({ success: true, item: conv })
    }

    if (type === 'message') {
      const msg = await db.message.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null },
      })
      return NextResponse.json({ success: true, item: msg })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Failed to restore:', error)
    return NextResponse.json({ error: 'Failed to restore' }, { status: 500 })
  }
}
