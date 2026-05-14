import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data || !data.version) {
      return NextResponse.json({ error: 'Invalid export data format' }, { status: 400 })
    }

    const results: Record<string, { imported: number; skipped: number }> = {}

    // Import providers
    if (data.providers && Array.isArray(data.providers)) {
      let imported = 0
      let skipped = 0
      for (const p of data.providers) {
        try {
          const existing = await db.provider.findUnique({ where: { id: p.id } })
          if (existing) { skipped++; continue }
          await db.provider.create({ data: { id: p.id, name: p.name, type: p.type, baseUrl: p.baseUrl, apiKey: p.apiKey, envVar: p.envVar, isActive: p.isActive, isDefault: p.isDefault, models: p.models, authType: p.authType, providerConfig: p.providerConfig } })
          imported++
        } catch { skipped++ }
      }
      results.providers = { imported, skipped }
    }

    // Import model configs
    if (data.modelConfigs && Array.isArray(data.modelConfigs)) {
      let imported = 0
      let skipped = 0
      for (const mc of data.modelConfigs) {
        try {
          const existing = await db.modelConfig.findUnique({ where: { id: mc.id } })
          if (existing) { skipped++; continue }
          await db.modelConfig.create({ data: { id: mc.id, name: mc.name, provider: mc.provider, contextWindow: mc.contextWindow, auxiliaryModels: mc.auxiliaryModels, auxiliaryContext: mc.auxiliaryContext, temperature: mc.temperature, maxTokens: mc.maxTokens, topP: mc.topP, frequencyPenalty: mc.frequencyPenalty, presencePenalty: mc.presencePenalty, priority: mc.priority, autoOptimize: mc.autoOptimize, isActive: mc.isActive, isDefault: mc.isDefault, modelId: mc.modelId, baseUrl: mc.baseUrl, apiKey: mc.apiKey, envVar: mc.envVar, authType: mc.authType, providerConfig: mc.providerConfig } })
          imported++
        } catch { skipped++ }
      }
      results.modelConfigs = { imported, skipped }
    }

    // Import workspaces
    if (data.workspaces && Array.isArray(data.workspaces)) {
      let imported = 0
      let skipped = 0
      for (const w of data.workspaces) {
        try {
          const existing = await db.workspace.findUnique({ where: { id: w.id } })
          if (existing) { skipped++; continue }
          await db.workspace.create({ data: { id: w.id, name: w.name, description: w.description, directory: w.directory, icon: w.icon, color: w.color, isActive: w.isActive, isDefault: w.isDefault, config: w.config } })
          imported++
        } catch { skipped++ }
      }
      results.workspaces = { imported, skipped }
    }

    // Import conversations
    if (data.conversations && Array.isArray(data.conversations)) {
      let imported = 0
      let skipped = 0
      for (const c of data.conversations) {
        try {
          const existing = await db.conversation.findUnique({ where: { id: c.id } })
          if (existing) { skipped++; continue }
          await db.conversation.create({ data: { id: c.id, title: c.title, mode: c.mode, provider: c.provider, model: c.model, systemPrompt: c.systemPrompt, workspaceId: c.workspaceId, isArchived: c.isArchived, isDeleted: c.isDeleted } })
          imported++
        } catch { skipped++ }
      }
      results.conversations = { imported, skipped }
    }

    // Import messages
    if (data.messages && Array.isArray(data.messages)) {
      let imported = 0
      let skipped = 0
      for (const m of data.messages) {
        try {
          const existing = await db.message.findUnique({ where: { id: m.id } })
          if (existing) { skipped++; continue }
          await db.message.create({ data: { id: m.id, conversationId: m.conversationId, role: m.role, content: m.content, metadata: m.metadata, isStreaming: m.isStreaming, isDeleted: m.isDeleted } })
          imported++
        } catch { skipped++ }
      }
      results.messages = { imported, skipped }
    }

    // Import settings
    if (data.settings && Array.isArray(data.settings)) {
      for (const s of data.settings) {
        try {
          await db.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value } })
        } catch { /* skip */ }
      }
      results.settings = { imported: data.settings.length, skipped: 0 }
    }

    // Import skills
    if (data.skills && Array.isArray(data.skills)) {
      let imported = 0
      let skipped = 0
      for (const s of data.skills) {
        try {
          const existing = await db.skill.findUnique({ where: { id: s.id } })
          if (existing) { skipped++; continue }
          await db.skill.create({ data: { id: s.id, name: s.name, description: s.description, content: s.content, category: s.category, isBuiltin: s.isBuiltin, isActive: s.isActive, fileName: s.fileName } })
          imported++
        } catch { skipped++ }
      }
      results.skills = { imported, skipped }
    }

    // Import memories
    if (data.memories && Array.isArray(data.memories)) {
      let imported = 0
      let skipped = 0
      for (const m of data.memories) {
        try {
          const existing = await db.memory.findUnique({ where: { id: m.id } })
          if (existing) { skipped++; continue }
          await db.memory.create({ data: { id: m.id, type: m.type, key: m.key, content: m.content, source: m.source, relevance: m.relevance, accessCount: m.accessCount, tags: m.tags } })
          imported++
        } catch { skipped++ }
      }
      results.memories = { imported, skipped }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[import] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
