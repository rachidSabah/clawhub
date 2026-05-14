import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const jobs = await db.cronJob.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Failed to fetch cron jobs:', error)
    return NextResponse.json({ error: 'Failed to fetch cron jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, schedule, taskType, taskData, workspaceId, modelConfigId, isActive } = body

    if (!name || !schedule || !taskType) {
      return NextResponse.json({ error: 'Name, schedule, and taskType are required' }, { status: 400 })
    }

    // Calculate next run time based on cron expression (simplified)
    const now = new Date()
    const nextRunAt = new Date(now.getTime() + 60000) // default 1 min from now

    const job = await db.cronJob.create({
      data: {
        name,
        description: description ?? null,
        schedule,
        taskType,
        taskData: typeof taskData === 'string' ? taskData : JSON.stringify(taskData),
        workspaceId: workspaceId ?? null,
        modelConfigId: modelConfigId ?? null,
        isActive: isActive ?? true,
        nextRunAt,
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Failed to create cron job:', error)
    return NextResponse.json({ error: 'Failed to create cron job' }, { status: 500 })
  }
}
