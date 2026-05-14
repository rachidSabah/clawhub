import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import os from 'os'

export async function GET() {
  try {
    // Gather comprehensive app status
    const [
      providers,
      conversations,
      memories,
      agents,
      skills,
      mcpServers,
      plugins,
    ] = await Promise.all([
      db.provider.findMany({ where: { isActive: true } }),
      db.conversation.findMany({ where: { isDeleted: false } }),
      db.memory.findMany(),
      db.agentSwarm.findMany({ where: { isActive: true } }),
      db.skill.findMany({ where: { isActive: true } }),
      db.mcpServer.findMany(),
      db.plugin.findMany({ where: { isInstalled: true } }),
    ])

    // Count active conversations (recently updated)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const activeConversations = conversations.filter(
      c => new Date(c.updatedAt) > oneHourAgo
    ).length

    // Count running agents
    const runningAgents = agents.filter(a => a.status === 'running').length

    // Count memories by type
    const memoriesByType: Record<string, number> = {}
    for (const m of memories) {
      memoriesByType[m.type] = (memoriesByType[m.type] || 0) + 1
    }

    // Count connected MCP servers
    const connectedMcpServers = mcpServers.filter(s => s.isConnected).length

    // System info
    const uptime = process.uptime()
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const cpus = os.cpus()

    return NextResponse.json({
      providers: {
        total: providers.length,
        active: providers.filter(p => p.isActive).length,
      },
      conversations: {
        total: conversations.length,
        active: activeConversations,
      },
      memory: {
        total: memories.length,
        byType: memoriesByType,
      },
      agents: {
        total: agents.length,
        running: runningAgents,
      },
      skills: {
        total: skills.length,
      },
      mcp: {
        total: mcpServers.length,
        connected: connectedMcpServers,
      },
      plugins: {
        total: plugins.length,
      },
      uptime: {
        seconds: Math.round(uptime),
        formatted: formatUptime(uptime),
      },
      version: '1.0.0',
      hardware: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpuModel: cpus[0]?.model || 'Unknown',
        cpuCores: cpus.length,
        totalMemoryGB: Number((totalMemory / (1024 ** 3)).toFixed(2)),
        usedMemoryGB: Number((usedMemory / (1024 ** 3)).toFixed(2)),
        freeMemoryGB: Number((freeMemory / (1024 ** 3)).toFixed(2)),
        memoryUsagePercent: Number(((usedMemory / totalMemory) * 100).toFixed(1)),
        loadAvg: os.loadavg().map(l => Number(l.toFixed(2))),
      },
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[status] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  parts.push(`${secs}s`)

  return parts.join(' ')
}
