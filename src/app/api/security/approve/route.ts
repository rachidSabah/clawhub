import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { actionId, approved } = await req.json()

    if (!actionId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'actionId and approved (boolean) are required' },
        { status: 400 }
      )
    }

    const approval = await db.securityApproval.findUnique({
      where: { id: actionId },
    })

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval request not found' },
        { status: 404 }
      )
    }

    if (approval.status !== 'pending') {
      return NextResponse.json(
        { error: `Approval already ${approval.status}` },
        { status: 409 }
      )
    }

    // Check if expired
    if (approval.expiresAt && new Date() > approval.expiresAt) {
      await db.securityApproval.update({
        where: { id: actionId },
        data: { status: 'expired', reviewedAt: new Date() },
      })
      return NextResponse.json({ status: 'expired' })
    }

    const newStatus = approved ? 'approved' : 'denied'

    await db.securityApproval.update({
      where: { id: actionId },
      data: {
        status: newStatus,
        reviewedBy: 'user',
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ status: newStatus })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
