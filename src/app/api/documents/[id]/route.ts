import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { unlinkSync, existsSync } from 'fs'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const doc = await db.memory.findUnique({ where: { id } })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Delete file from disk
    if (doc.source) {
      try { if (existsSync(doc.source)) unlinkSync(doc.source) } catch { /* ignore */ }
    }

    // Delete from database
    await db.memory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
