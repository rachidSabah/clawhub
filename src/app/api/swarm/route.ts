import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const agents = await db.agentSwarm.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      role,
      systemPrompt,
      providerId,
      model,
      workspaceDir,
      autoApprove,
      maxIterations,
      isDaemon,
    } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!role || typeof role !== 'string') {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['idle', 'running', 'paused', 'error', 'completed']
    const defaultStatus = 'idle'

    const agent = await db.agentSwarm.create({
      data: {
        name,
        role,
        systemPrompt: systemPrompt ?? null,
        providerId: providerId ?? null,
        model: model ?? null,
        workspaceDir: workspaceDir ?? null,
        autoApprove: autoApprove ?? false,
        maxIterations: maxIterations ?? 50,
        isDaemon: isDaemon ?? false,
        status: defaultStatus,
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
