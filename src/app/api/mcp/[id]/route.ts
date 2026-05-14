import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const server = await db.mcpServer.findUnique({
      where: { id },
    })

    if (!server) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(server)
  } catch (error) {
    console.error('Failed to fetch MCP server:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MCP server' },
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

    const existing = await db.mcpServer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, command, args, envVars, transportType, serverUrl, isActive, isConnected } = body

    const validTransportTypes = ['stdio', 'sse']
    if (transportType !== undefined && !validTransportTypes.includes(transportType)) {
      return NextResponse.json(
        { error: `Transport type must be one of: ${validTransportTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (transportType === 'sse' && serverUrl !== undefined && !serverUrl) {
      return NextResponse.json(
        { error: 'Server URL is required for SSE transport' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (command !== undefined) data.command = command
    if (args !== undefined) {
      data.args = typeof args === 'string' ? args : JSON.stringify(args)
    }
    if (envVars !== undefined) {
      data.envVars = typeof envVars === 'string' ? envVars : JSON.stringify(envVars)
    }
    if (transportType !== undefined) data.transportType = transportType
    if (serverUrl !== undefined) data.serverUrl = serverUrl
    if (isActive !== undefined) data.isActive = isActive
    if (isConnected !== undefined) data.isConnected = isConnected

    const server = await db.mcpServer.update({
      where: { id },
      data,
    })

    return NextResponse.json(server)
  } catch (error) {
    console.error('Failed to update MCP server:', error)
    return NextResponse.json(
      { error: 'Failed to update MCP server' },
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

    const existing = await db.mcpServer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      )
    }

    await db.mcpServer.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete MCP server:', error)
    return NextResponse.json(
      { error: 'Failed to delete MCP server' },
      { status: 500 }
    )
  }
}
