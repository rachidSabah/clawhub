import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Expire any pending approvals past their expiration
    const now = new Date()
    await db.securityApproval.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: now },
      },
      data: { status: 'expired' },
    })

    const pending = await db.securityApproval.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    })

    const result = pending.map((a) => ({
      id: a.id,
      type: a.actionType,
      description: a.description,
      requestedBy: a.requestedBy,
      requestedAt: a.createdAt,
      riskLevel: a.riskLevel,
      expiresAt: a.expiresAt,
    }))

    return NextResponse.json({ pending: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
