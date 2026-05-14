import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const server = await db.mcpServer.findUnique({ where: { id } })
    if (!server) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      )
    }

    if (server.isConnected) {
      return NextResponse.json(
        { error: 'Server is already connected' },
        { status: 400 }
      )
    }

    if (server.transportType === 'stdio') {
      // For stdio transport: spawn the command and keep a reference
      const args: string[] = server.args
        ? (typeof server.args === 'string' ? JSON.parse(server.args) : server.args)
        : []
      const envVars: Record<string, string> = server.envVars
        ? (typeof server.envVars === 'string' ? JSON.parse(server.envVars) : server.envVars)
        : {}

      const childEnv = {
        ...process.env,
        ...envVars,
      } as Record<string, string>

      try {
        const child = spawn(server.command, args, {
          env: childEnv,
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false,
        })

        // Handle process errors gracefully
        child.on('error', (err) => {
          console.error(`MCP server process error for ${server.name}:`, err.message)
        })

        child.stderr?.on('data', (data: Buffer) => {
          console.error(`MCP server stderr [${server.name}]:`, data.toString())
        })

        // Give the process a brief moment to start up, then check if it's still running
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 500)
        })

        if (child.killed || child.exitCode !== null) {
          return NextResponse.json(
            { error: 'Server process failed to start. Check the command and arguments.' },
            { status: 500 }
          )
        }

        // Process started successfully — update the DB
        await db.mcpServer.update({
          where: { id },
          data: {
            isConnected: true,
            lastConnectedAt: new Date(),
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Server process started',
          pid: child.pid,
        })
      } catch (spawnError) {
        console.error('Failed to spawn MCP server process:', spawnError)
        return NextResponse.json(
          { error: `Failed to start server process: ${spawnError instanceof Error ? spawnError.message : 'Unknown error'}` },
          { status: 500 }
        )
      }
    } else if (server.transportType === 'sse') {
      // For SSE transport: just verify the URL is reachable with a fetch
      if (!server.serverUrl) {
        return NextResponse.json(
          { error: 'Server URL is required for SSE transport' },
          { status: 400 }
        )
      }

      try {
        const response = await fetch(server.serverUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })

        if (!response.ok && response.status !== 405) {
          // 405 is acceptable — the server may not support GET but is still reachable
          return NextResponse.json(
            { error: `Server returned status ${response.status}` },
            { status: 502 }
          )
        }
      } catch (fetchError) {
        console.error('Failed to reach SSE server:', fetchError)
        return NextResponse.json(
          { error: `Failed to reach server at ${server.serverUrl}: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
          { status: 502 }
        )
      }

      await db.mcpServer.update({
        where: { id },
        data: {
          isConnected: true,
          lastConnectedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'SSE server connection verified',
      })
    } else {
      return NextResponse.json(
        { error: `Unsupported transport type: ${server.transportType}` },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to connect to MCP server:', error)
    return NextResponse.json(
      { error: 'Failed to connect to MCP server' },
      { status: 500 }
    )
  }
}
