import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agent = await db.agentSwarm.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    if (agent.status === 'running') {
      return NextResponse.json(
        { error: 'Agent is already running' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { task } = body

    if (!task || typeof task !== 'string') {
      return NextResponse.json(
        { error: 'Task is required' },
        { status: 400 }
      )
    }

    // Append current task to task history before starting new one
    const taskHistory: string[] = agent.taskHistory
      ? (typeof agent.taskHistory === 'string' ? JSON.parse(agent.taskHistory) : agent.taskHistory)
      : []

    if (agent.currentTask) {
      taskHistory.push(agent.currentTask)
    }

    const updatedAgent = await db.agentSwarm.update({
      where: { id },
      data: {
        status: 'running',
        currentTask: task,
        iterationCount: 0,
        lastActivityAt: new Date(),
        taskHistory: JSON.stringify(taskHistory),
      },
    })

    return NextResponse.json(updatedAgent)
  } catch (error) {
    console.error('Failed to start agent:', error)
    return NextResponse.json(
      { error: 'Failed to start agent' },
      { status: 500 }
    )
  }
}
