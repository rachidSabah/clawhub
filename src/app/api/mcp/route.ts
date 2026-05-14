import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const servers = await db.mcpServer.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(servers)
  } catch (error) {
    console.error('Failed to fetch MCP servers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MCP servers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, command, args, envVars, transportType, serverUrl, isActive } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    const validTransportTypes = ['stdio', 'sse']
    if (transportType && !validTransportTypes.includes(transportType)) {
      return NextResponse.json(
        { error: `Transport type must be one of: ${validTransportTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (transportType === 'sse' && !serverUrl) {
      return NextResponse.json(
        { error: 'Server URL is required for SSE transport' },
        { status: 400 }
      )
    }

    const server = await db.mcpServer.create({
      data: {
        name,
        command,
        args: args !== undefined
          ? typeof args === 'string'
            ? args
            : JSON.stringify(args)
          : null,
        envVars: envVars !== undefined
          ? typeof envVars === 'string'
            ? envVars
            : JSON.stringify(envVars)
          : null,
        transportType: transportType ?? 'stdio',
        serverUrl: serverUrl ?? null,
        isActive: isActive ?? false,
      },
    })

    return NextResponse.json(server, { status: 201 })
  } catch (error) {
    console.error('Failed to create MCP server:', error)
    return NextResponse.json(
      { error: 'Failed to create MCP server' },
      { status: 500 }
    )
  }
}
