import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exec } from 'child_process'
import { promisify } from 'util'
import ZAI from 'z-ai-web-dev-sdk'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const { tool, parameters, workspaceId } = await req.json()
    
    let result: Record<string, unknown> = {}
    
    switch (tool) {
      case 'web_search': {
        const zai = await ZAI.create()
        const searchResults = await zai.functions.invoke('web_search', {
          query: parameters.query,
          num: parameters.num || 5,
        })
        result = { success: true, data: searchResults }
        break
      }
      
      case 'code_execute': {
        // Sandbox execution: write to temp file and run
        const tmpDir = join(process.cwd(), 'tmp')
        if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
        
        const extMap: Record<string, string> = { python: 'py', javascript: 'js', typescript: 'ts' }
        const ext = extMap[parameters.language] || 'txt'
        const tmpFile = join(tmpDir, `exec-${Date.now()}.${ext}`)
        writeFileSync(tmpFile, parameters.code)
        
        try {
          const cmdMap: Record<string, string> = {
            python: `python3 ${tmpFile}`,
            javascript: `node ${tmpFile}`,
            typescript: `npx tsx ${tmpFile}`,
          }
          const { stdout, stderr } = await execAsync(cmdMap[parameters.language] || `cat ${tmpFile}`, { timeout: 30000 })
          result = { success: true, data: { stdout, stderr } }
        } catch (err: unknown) {
          const error = err as { message: string; stdout?: string; stderr?: string }
          result = { success: false, error: error.message, data: { stdout: error.stdout || '', stderr: error.stderr || '' } }
        }
        break
      }
      
      case 'file_read': {
        const ws = workspaceId ? await db.workspace.findUnique({ where: { id: workspaceId } }) : null
        const basePath = ws?.directory || process.cwd()
        const filePath = join(basePath, parameters.path)
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8')
          result = { success: true, data: { content } }
        } else {
          result = { success: false, error: 'File not found' }
        }
        break
      }
      
      case 'file_write': {
        const ws2 = workspaceId ? await db.workspace.findUnique({ where: { id: workspaceId } }) : null
        const basePath2 = ws2?.directory || process.cwd()
        const filePath2 = join(basePath2, parameters.path)
        const dir = join(filePath2, '..')
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        writeFileSync(filePath2, parameters.content)
        result = { success: true, data: { path: filePath2 } }
        break
      }
      
      case 'image_generate': {
        const zai = await ZAI.create()
        const response = await zai.images.generations.create({
          prompt: parameters.prompt,
          size: parameters.size || '1024x1024',
        })
        result = { success: true, data: { image: response.data[0]?.base64 } }
        break
      }
      
      case 'memory_store': {
        const memory = await db.memory.create({
          data: {
            type: parameters.type || 'fact',
            content: parameters.content,
            tags: parameters.tags || null,
            relevance: 1.0,
          }
        })
        result = { success: true, data: { id: memory.id } }
        break
      }
      
      case 'memory_search': {
        const memories = await db.memory.findMany({
          where: {
            OR: [
              { content: { contains: parameters.query } },
              { key: { contains: parameters.query } },
            ]
          },
          take: parameters.limit || 5,
          orderBy: { relevance: 'desc' },
        })
        result = { success: true, data: memories }
        break
      }
      
      case 'document_query': {
        const docs = await db.memory.findMany({
          where: { key: { startsWith: 'document:' } }
        })
        const queryWords = parameters.query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2)
        const scored: { content: string; score: number; source: string | null }[] = []
        for (const doc of docs) {
          let chunks: string[] = []
          try { chunks = JSON.parse(doc.embedding || '[]') } catch { chunks = [doc.content] }
          for (const chunk of chunks) {
            const lower = chunk.toLowerCase()
            let score = 0
            for (const word of queryWords) { if (lower.includes(word)) score++ }
            if (score > 0) scored.push({ content: chunk, score, source: doc.key })
          }
        }
        scored.sort((a, b) => b.score - a.score)
        result = { success: true, data: scored.slice(0, 3) }
        break
      }
      
      case 'shell_execute': {
        try {
          const { stdout, stderr } = await execAsync(parameters.command, { timeout: 30000 })
          result = { success: true, data: { stdout, stderr } }
        } catch (err: unknown) {
          const error = err as { message: string; stdout?: string; stderr?: string }
          result = { success: false, error: error.message, data: { stdout: error.stdout || '', stderr: error.stderr || '' } }
        }
        break
      }
      
      case 'schedule_task': {
        const job = await db.cronJob.create({
          data: {
            name: parameters.name,
            schedule: parameters.schedule,
            taskType: 'shell',
            taskData: JSON.stringify({ command: parameters.command }),
            isActive: true,
          }
        })
        result = { success: true, data: { id: job.id } }
        break
      }
      
      default:
        result = { success: false, error: `Unknown tool: ${tool}` }
    }
    
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
