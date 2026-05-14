import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agent = await db.agentSwarm.findUnique({
      where: { id },
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Failed to fetch agent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.agentSwarm.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

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
      isActive,
      status,
      currentTask,
      iterationCount,
      taskHistory,
    } = body

    const validStatuses = ['idle', 'running', 'paused', 'error', 'completed']
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (role !== undefined) data.role = role
    if (systemPrompt !== undefined) data.systemPrompt = systemPrompt
    if (providerId !== undefined) data.providerId = providerId
    if (model !== undefined) data.model = model
    if (workspaceDir !== undefined) data.workspaceDir = workspaceDir
    if (autoApprove !== undefined) data.autoApprove = autoApprove
    if (maxIterations !== undefined) data.maxIterations = maxIterations
    if (isDaemon !== undefined) data.isDaemon = isDaemon
    if (isActive !== undefined) data.isActive = isActive
    if (status !== undefined) data.status = status
    if (currentTask !== undefined) data.currentTask = currentTask
    if (iterationCount !== undefined) data.iterationCount = iterationCount
    if (taskHistory !== undefined) {
      data.taskHistory = typeof taskHistory === 'string' ? taskHistory : JSON.stringify(taskHistory)
    }

    // Update lastActivityAt when status changes or task changes
    if (status !== undefined || currentTask !== undefined) {
      data.lastActivityAt = new Date()
    }

    const agent = await db.agentSwarm.update({
      where: { id },
      data,
    })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Failed to update agent:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.agentSwarm.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    await db.agentSwarm.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete agent:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}
