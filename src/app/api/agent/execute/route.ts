import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command, workingDir, timeout } = body

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Command is required and must be a string' },
        { status: 400 }
      )
    }

    const maxTimeout = 60000 // 60 seconds max
    const effectiveTimeout = Math.min(
      typeof timeout === 'number' && timeout > 0 ? timeout : 30000,
      maxTimeout
    )

    const result = await new Promise<{
      exitCode: number
      stdout: string
      stderr: string
    }>((resolve) => {
      exec(
        command,
        {
          cwd: workingDir || undefined,
          timeout: effectiveTimeout,
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        },
        (error, stdout, stderr) => {
          resolve({
            exitCode: error ? error.code ?? 1 : 0,
            stdout: stdout || '',
            stderr: stderr || '',
          })
        }
      )
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to execute command:', error)
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    )
  }
}
