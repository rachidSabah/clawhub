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

    if (agent.status !== 'running') {
      return NextResponse.json(
        { error: 'Agent must be running to execute a step' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { thought, action, actionInput, observation } = body

    // Validate that at least thought or action is provided
    if (!thought && !action) {
      return NextResponse.json(
        { error: 'At least thought or action is required for a step' },
        { status: 400 }
      )
    }

    const newIterationCount = agent.iterationCount + 1

    // Check if agent has reached max iterations
    const hasReachedMaxIterations = newIterationCount >= agent.maxIterations

    const updatedAgent = await db.agentSwarm.update({
      where: { id },
      data: {
        iterationCount: newIterationCount,
        status: hasReachedMaxIterations ? 'completed' : 'running',
        lastActivityAt: new Date(),
      },
    })

    return NextResponse.json({
      agent: updatedAgent,
      step: {
        iteration: newIterationCount,
        thought: thought ?? null,
        action: action ?? null,
        actionInput: actionInput ?? null,
        observation: observation ?? null,
      },
      completed: hasReachedMaxIterations,
      message: hasReachedMaxIterations
        ? `Agent completed after reaching max iterations (${agent.maxIterations})`
        : `Step ${newIterationCount} executed successfully`,
    })
  } catch (error) {
    console.error('Failed to execute agent step:', error)
    return NextResponse.json(
      { error: 'Failed to execute agent step' },
      { status: 500 }
    )
  }
}
