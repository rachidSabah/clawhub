import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (agentId) where.agentId = agentId
    if (type) where.type = type

    const reflections = await db.reflectionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reflections)
  } catch (error) {
    console.error('Failed to fetch reflection logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reflection logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentId, type, summary, insights, actionItems, successRate } = body

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }

    const validTypes = ['daily', 'task-complete', 'error-recovery', 'learning']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!summary || typeof summary !== 'string') {
      return NextResponse.json(
        { error: 'Summary is required' },
        { status: 400 }
      )
    }

    // If agentId is provided, verify the agent exists
    if (agentId) {
      const agent = await db.agentSwarm.findUnique({ where: { id: agentId } })
      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        )
      }
    }

    const reflection = await db.reflectionLog.create({
      data: {
        agentId: agentId ?? null,
        type,
        summary,
        insights: insights !== undefined
          ? typeof insights === 'string'
            ? insights
            : JSON.stringify(insights)
          : null,
        actionItems: actionItems !== undefined
          ? typeof actionItems === 'string'
            ? actionItems
            : JSON.stringify(actionItems)
          : null,
        successRate: successRate !== undefined ? successRate : null,
      },
    })

    return NextResponse.json(reflection, { status: 201 })
  } catch (error) {
    console.error('Failed to create reflection log:', error)
    return NextResponse.json(
      { error: 'Failed to create reflection log' },
      { status: 500 }
    )
  }
}
