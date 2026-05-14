import { NextRequest, NextResponse } from 'next/server'
import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'

// ---------------------------------------------------------------------------
// Service Manager API — Start/Stop/Status for all mini-services
// ---------------------------------------------------------------------------

interface ServiceDef {
  id: string
  name: string
  description: string
  port: number
  directory: string
  startCommand: string   // e.g. "npm" | "bun"
  startArgs: string[]    // e.g. ["start"] | ["index.ts"]
  healthUrl: string
  optional: boolean
}

const SERVICES: ServiceDef[] = [
  {
    id: 'main',
    name: 'ClawHub Dashboard',
    description: 'Next.js main web application',
    port: 3000,
    directory: '',
    startCommand: 'npm',
    startArgs: ['run', 'dev'],
    healthUrl: 'http://localhost:3000/api/status',
    optional: false,
  },
  {
    id: 'agent-ws',
    name: 'Agent WebSocket',
    description: 'Real-time agent streaming via Socket.IO',
    port: 3003,
    directory: 'mini-services/agent-ws',
    startCommand: 'npx',
    startArgs: ['tsx', 'index.ts'],
    healthUrl: 'http://localhost:3003',
    optional: true,
  },
  {
    id: 'whatsapp-bridge',
    name: 'WhatsApp Bridge',
    description: 'WhatsApp Web integration — chat from WhatsApp',
    port: 3004,
    directory: 'mini-services/whatsapp-bridge',
    startCommand: 'node',
    startArgs: ['index.js'],
    healthUrl: 'http://localhost:3004/status',
    optional: true,
  },
  {
    id: 'messaging-gateway',
    name: 'Messaging Gateway',
    description: 'Telegram, Discord, Slack, Signal, Home Assistant',
    port: 3005,
    directory: 'mini-services/messaging-gateway',
    startCommand: 'npx',
    startArgs: ['tsx', 'index.ts'],
    healthUrl: 'http://localhost:3005/health',
    optional: true,
  },
]

// In-memory process tracking (resets on server restart)
const runningProcesses: Map<string, ChildProcess> = new Map()

function getProjectRoot(): string {
  return process.cwd()
}

// Check if a service port is responding
async function checkPortHealth(url: string, timeout = 2000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

// GET /api/services — Get status of all services
export async function GET() {
  try {
    const root = getProjectRoot()
    const results = await Promise.all(
      SERVICES.map(async (svc) => {
        const isRunning = await checkPortHealth(svc.healthUrl)
        const hasProcess = runningProcesses.has(svc.id)
        const dirPath = svc.directory ? join(root, svc.directory) : root
        const dirExists = existsSync(dirPath)

        return {
          id: svc.id,
          name: svc.name,
          description: svc.description,
          port: svc.port,
          optional: svc.optional,
          status: isRunning ? 'running' as const : (hasProcess ? 'starting' as const : 'stopped' as const),
          pid: hasProcess ? runningProcesses.get(svc.id)?.pid : null,
          directory: svc.directory || './',
          startCommand: `${svc.startCommand} ${svc.startArgs.join(' ')}`,
          dirExists,
        }
      })
    )

    const runningCount = results.filter(s => s.status === 'running').length

    return NextResponse.json({
      services: results,
      total: results.length,
      running: runningCount,
      stopped: results.length - runningCount,
    })
  } catch (error) {
    console.error('Failed to get service status:', error)
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    )
  }
}

// POST /api/services — Start or stop a service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, action } = body as { serviceId: string; action: 'start' | 'stop' | 'restart' | 'start-all' | 'stop-all' }

    // Start all optional services
    if (action === 'start-all') {
      const results: Record<string, string> = {}
      for (const svc of SERVICES) {
        if (svc.optional) {
          const result = await startService(svc)
          results[svc.id] = result
        }
      }
      return NextResponse.json({ action: 'start-all', results })
    }

    // Stop all optional services
    if (action === 'stop-all') {
      const results: Record<string, string> = {}
      for (const svc of SERVICES) {
        if (svc.optional) {
          const result = stopService(svc)
          results[svc.id] = result
        }
      }
      return NextResponse.json({ action: 'stop-all', results })
    }

    // Single service action
    const svc = SERVICES.find(s => s.id === serviceId)
    if (!svc) {
      return NextResponse.json({ error: `Unknown service: ${serviceId}` }, { status: 404 })
    }

    if (action === 'start') {
      const result = await startService(svc)
      return NextResponse.json({ action: 'start', serviceId, result })
    }

    if (action === 'stop') {
      const result = stopService(svc)
      return NextResponse.json({ action: 'stop', serviceId, result })
    }

    if (action === 'restart') {
      stopService(svc)
      await new Promise(r => setTimeout(r, 1000))
      const result = await startService(svc)
      return NextResponse.json({ action: 'restart', serviceId, result })
    }

    return NextResponse.json({ error: 'Invalid action. Use start, stop, restart, start-all, or stop-all.' }, { status: 400 })
  } catch (error) {
    console.error('Failed to manage service:', error)
    return NextResponse.json(
      { error: 'Failed to manage service' },
      { status: 500 }
    )
  }
}

async function startService(svc: ServiceDef): Promise<string> {
  // Check if already running
  const isRunning = await checkPortHealth(svc.healthUrl)
  if (isRunning) {
    return `Already running on port ${svc.port}`
  }

  // Check if process already spawned
  if (runningProcesses.has(svc.id)) {
    return 'Process already spawned (starting up...)'
  }

  const root = getProjectRoot()
  const cwd = svc.directory ? join(root, svc.directory) : root

  if (!existsSync(cwd)) {
    return `Directory not found: ${cwd}`
  }

  try {
    const proc = spawn(svc.startCommand, svc.startArgs, {
      cwd,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
    })

    proc.unref() // Don't wait for the child process

    runningProcesses.set(svc.id, proc)

    proc.on('exit', () => {
      runningProcesses.delete(svc.id)
    })

    proc.on('error', (err) => {
      console.error(`Service ${svc.id} error:`, err.message)
      runningProcesses.delete(svc.id)
    })

    return `Started on port ${svc.port} (PID: ${proc.pid})`
  } catch (err: any) {
    return `Failed to start: ${err.message}`
  }
}

function stopService(svc: ServiceDef): string {
  const proc = runningProcesses.get(svc.id)
  if (!proc) {
    return 'Not running (no process tracked)'
  }

  try {
    proc.kill('SIGTERM')
    runningProcesses.delete(svc.id)
    return `Stopped (killed PID: ${proc.pid})`
  } catch (err: any) {
    return `Failed to stop: ${err.message}`
  }
}
