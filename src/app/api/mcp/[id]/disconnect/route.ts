import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

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

    if (!server.isConnected) {
      return NextResponse.json(
        { error: 'Server is not connected' },
        { status: 400 }
      )
    }

    await db.mcpServer.update({
      where: { id },
      data: {
        isConnected: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Server disconnected',
    })
  } catch (error) {
    console.error('Failed to disconnect MCP server:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect MCP server' },
      { status: 500 }
    )
  }
}
