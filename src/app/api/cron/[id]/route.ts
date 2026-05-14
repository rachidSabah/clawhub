import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.taskData && typeof body.taskData !== 'string') {
      body.taskData = JSON.stringify(body.taskData)
    }

    const job = await db.cronJob.update({ where: { id }, data: body })
    return NextResponse.json(job)
  } catch (error) {
    console.error('Failed to update cron job:', error)
    return NextResponse.json({ error: 'Failed to update cron job' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.cronJob.delete({ where: { id } })
    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    console.error('Failed to delete cron job:', error)
    return NextResponse.json({ error: 'Failed to delete cron job' }, { status: 500 })
  }
}
