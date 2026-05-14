import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _request: NextRequest,
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

    if (agent.status !== 'running' && agent.status !== 'paused') {
      return NextResponse.json(
        { error: 'Agent is not running or paused' },
        { status: 400 }
      )
    }

    // Append current task to task history when stopping
    const taskHistory: string[] = agent.taskHistory
      ? (typeof agent.taskHistory === 'string' ? JSON.parse(agent.taskHistory) : agent.taskHistory)
      : []

    if (agent.currentTask) {
      taskHistory.push(agent.currentTask)
    }

    const updatedAgent = await db.agentSwarm.update({
      where: { id },
      data: {
        status: 'idle',
        currentTask: null,
        taskHistory: JSON.stringify(taskHistory),
        lastActivityAt: new Date(),
      },
    })

    return NextResponse.json(updatedAgent)
  } catch (error) {
    console.error('Failed to stop agent:', error)
    return NextResponse.json(
      { error: 'Failed to stop agent' },
      { status: 500 }
    )
  }
}
