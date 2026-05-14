import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [conversations, messages, providers, modelConfigs, workspaces, settings, skills, memories] = await Promise.all([
      db.conversation.findMany({ where: { isDeleted: false } }),
      db.message.findMany({ where: { isDeleted: false } }),
      db.provider.findMany(),
      db.modelConfig.findMany(),
      db.workspace.findMany(),
      db.setting.findMany(),
      db.skill.findMany(),
      db.memory.findMany(),
    ])

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      app: 'INFOHAS ClawHub',
      conversations,
      messages,
      providers,
      modelConfigs,
      workspaces,
      settings,
      skills,
      memories,
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="clawhub-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[export] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
