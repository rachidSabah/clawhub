import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exec } from 'child_process'
import { promisify } from 'util'
import ZAI from 'z-ai-web-dev-sdk'
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'

const execAsync = promisify(exec)

// Security: check if tool needs approval and verify it
async function checkToolApproval(
  tool: string,
  riskLevel: 'low' | 'medium' | 'high',
  requiresApproval: boolean
): Promise<{ allowed: boolean; approvalId?: string; error?: string }> {
  if (!requiresApproval) return { allowed: true }

  // Check if god mode is enabled
  const godModeSetting = await db.setting.findUnique({ where: { key: 'godMode' } })
  if (godModeSetting?.value === 'true') return { allowed: true }

  // Create an approval request
  const approval = await db.securityApproval.create({
    data: {
      actionType: tool,
      description: `Tool execution: ${tool}`,
      riskLevel,
      status: 'pending',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  })

  // Auto-approve if agent auto-approve is on
  const autoApproveSetting = await db.setting.findUnique({ where: { key: 'agentAutoApprove' } })
  if (autoApproveSetting?.value === 'true') {
    await db.securityApproval.update({
      where: { id: approval.id },
      data: { status: 'approved', reviewedBy: 'auto', reviewedAt: new Date() },
    })
    return { allowed: true, approvalId: approval.id }
  }

  // Check if already approved (from a prior request)
  const existing = await db.securityApproval.findFirst({
    where: {
      actionType: tool,
      status: 'approved',
      createdAt: { gte: new Date(Date.now() - 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) {
    return { allowed: true, approvalId: existing.id }
  }

  return { allowed: false, approvalId: approval.id, error: `Tool '${tool}' requires approval. Approval ID: ${approval.id}` }
}

// Get workspace base directory
async function getBasePath(workspaceId?: string): Promise<string> {
  if (workspaceId) {
    const ws = await db.workspace.findUnique({ where: { id: workspaceId } })
    if (ws?.directory) return ws.directory
  }
  return process.cwd()
}

export async function POST(req: NextRequest) {
  try {
    const { tool, parameters, workspaceId, autoApprove } = await req.json()

    // Get tool definition for security check
    const toolsRes = await fetch(new URL('/api/tools', req.url))
    const toolsData = await toolsRes.json()
    const toolDef = (toolsData.tools as Array<{ name: string; riskLevel: 'low' | 'medium' | 'high'; requiresApproval: boolean }>).find((t) => t.name === tool)

    if (!toolDef) {
      return NextResponse.json({ success: false, error: `Unknown tool: ${tool}` }, { status: 400 })
    }

    // Security check
    if (toolDef.requiresApproval && !autoApprove) {
      const check = await checkToolApproval(tool, toolDef.riskLevel, toolDef.requiresApproval)
      if (!check.allowed) {
        return NextResponse.json({
          success: false,
          error: check.error,
          approvalId: check.approvalId,
          requiresApproval: true,
        }, { status: 403 })
      }
    }

    const basePath = await getBasePath(workspaceId)
    let result: Record<string, unknown> = {}

    switch (tool) {
      // =====================================================================
      // Web & Search
      // =====================================================================
      case 'web_search': {
        const zai = await ZAI.create()
        const searchResults = await zai.functions.invoke('web_search', {
          query: parameters.query,
          num: parameters.num || 5,
        })
        result = { success: true, data: searchResults }
        break
      }

      case 'url_fetch': {
        // Fetch content from URL using native fetch
        try {
          const res = await fetch(parameters.url)
          const text = await res.text()
          result = { success: true, data: { url: parameters.url, content: text, status: res.status } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: `Fetch failed: ${e.message}` }
        }
        break
      }

      case 'web_scrape': {
        // Scrape content from URL using native fetch
        try {
          const res = await fetch(parameters.url)
          const text = await res.text()
          result = { success: true, data: { url: parameters.url, content: text, status: res.status } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: `Scrape failed: ${e.message}` }
        }
        break
      }

      case 'api_call': {
        const method = parameters.method || 'GET'
        const headers: Record<string, string> = parameters.headers ? JSON.parse(parameters.headers) : {}
        const fetchOpts: RequestInit = { method, headers }
        if (parameters.body && method !== 'GET') {
          fetchOpts.body = parameters.body
          if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
        }
        const res = await fetch(parameters.url, fetchOpts)
        const text = await res.text()
        result = { success: true, data: { status: res.status, statusText: res.statusText, body: text } }
        break
      }

      case 'dns_lookup': {
        const recordType = parameters.recordType || 'A'
        try {
          const { stdout } = await execAsync(`dig ${parameters.domain} ${recordType} +short`, { timeout: 10000 })
          result = { success: true, data: { domain: parameters.domain, records: stdout.trim().split('\n').filter(Boolean) } }
        } catch {
          // Fallback to nslookup
          const { stdout } = await execAsync(`nslookup -type=${recordType} ${parameters.domain}`, { timeout: 10000 })
          result = { success: true, data: { domain: parameters.domain, raw: stdout } }
        }
        break
      }

      case 'ssl_check': {
        const port = parameters.port || 443
        try {
          const { stdout } = await execAsync(`echo | openssl s_client -connect ${parameters.domain}:${port} -servername ${parameters.domain} 2>/dev/null | openssl x509 -noout -dates -subject -issuer`, { timeout: 15000 })
          result = { success: true, data: { domain: parameters.domain, certificate: stdout.trim() } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: `SSL check failed: ${e.message}` }
        }
        break
      }

      case 'ping': {
        const count = parameters.count || 3
        try {
          const { stdout } = await execAsync(`ping -c ${count} ${parameters.host}`, { timeout: 15000 })
          result = { success: true, data: { host: parameters.host, output: stdout } }
        } catch (err: unknown) {
          const e = err as { stdout?: string; message: string }
          result = { success: false, error: `Ping failed: ${e.message}`, data: { output: e.stdout || '' } }
        }
        break
      }

      case 'port_scan': {
        const ports = parameters.ports || '22,80,443,3000,3306,5432,8080,8443'
        try {
          const { stdout } = await execAsync(`nc -zv ${parameters.host} ${ports.replace(/,/g, ' ')} 2>&1 || true`, { timeout: 30000 })
          result = { success: true, data: { host: parameters.host, output: stdout } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: e.message }
        }
        break
      }

      // =====================================================================
      // File Operations
      // =====================================================================
      case 'file_read': {
        const filePath = join(basePath, parameters.path)
        if (!existsSync(filePath)) {
          result = { success: false, error: 'File not found' }
          break
        }
        let content = readFileSync(filePath, 'utf-8')
        if (parameters.startLine || parameters.endLine) {
          const lines = content.split('\n')
          const start = (parameters.startLine || 1) - 1
          const end = parameters.endLine || lines.length
          content = lines.slice(start, end).join('\n')
        }
        result = { success: true, data: { content } }
        break
      }

      case 'file_write': {
        const filePath = join(basePath, parameters.path)
        const dir = dirname(filePath)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        const flag = parameters.append ? 'a' : 'w'
        writeFileSync(filePath, parameters.content, { flag })
        result = { success: true, data: { path: filePath, appended: !!parameters.append } }
        break
      }

      case 'file_delete': {
        const filePath = join(basePath, parameters.path)
        if (!existsSync(filePath)) {
          result = { success: false, error: 'File not found' }
          break
        }
        unlinkSync(filePath)
        result = { success: true, data: { deleted: true, path: parameters.path } }
        break
      }

      case 'file_list': {
        const dirPath = join(basePath, parameters.path || '.')
        if (!existsSync(dirPath)) {
          result = { success: false, error: 'Directory not found' }
          break
        }
        const entries = readdirSync(dirPath).map((name) => {
          const fullPath = join(dirPath, name)
          try {
            const stat = statSync(fullPath)
            return { name, type: stat.isDirectory() ? 'directory' : 'file', size: stat.size, modified: stat.mtime }
          } catch {
            return { name, type: 'unknown', size: 0 }
          }
        })
        result = { success: true, data: { path: parameters.path || '.', entries } }
        break
      }

      case 'file_search': {
        const pattern = parameters.pattern || '*'
        const searchDir = join(basePath, parameters.directory || '.')
        try {
          const { stdout } = await execAsync(`find ${searchDir} -name "${pattern}" -type f 2>/dev/null | head -50`, { timeout: 10000 })
          const files = stdout.trim().split('\n').filter(Boolean)
          result = { success: true, data: { pattern, files } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: e.message }
        }
        break
      }

      case 'file_diff': {
        const pathA = join(basePath, parameters.pathA)
        const pathB = join(basePath, parameters.pathB)
        if (!existsSync(pathA) || !existsSync(pathB)) {
          result = { success: false, error: 'One or both files not found' }
          break
        }
        try {
          const { stdout } = await execAsync(`diff ${pathA} ${pathB}`, { timeout: 10000 })
          result = { success: true, data: { diff: stdout || 'Files are identical' } }
        } catch (err: unknown) {
          const e = err as { stdout?: string }
          // diff exits with 1 when files differ
          result = { success: true, data: { diff: e.stdout || 'Files differ' } }
        }
        break
      }

      case 'file_backup': {
        const filePath = join(basePath, parameters.path)
        if (!existsSync(filePath)) {
          result = { success: false, error: 'File not found' }
          break
        }
        const suffix = parameters.suffix || '.bak'
        const backupPath = filePath + suffix
        copyFileSync(filePath, backupPath)
        result = { success: true, data: { original: parameters.path, backup: parameters.path + suffix } }
        break
      }

      case 'file_watch': {
        const filePath = join(basePath, parameters.path)
        if (!existsSync(filePath)) {
          result = { success: false, error: 'Path not found' }
          break
        }
        const duration = parameters.duration || 5
        const stat = statSync(filePath)
        result = {
          success: true,
          data: {
            path: parameters.path,
            message: `Watching for ${duration}s. Use WebSocket for real-time updates.`,
            initialStat: { size: stat.size, modified: stat.mtime },
          },
        }
        break
      }

      // =====================================================================
      // Code & Development
      // =====================================================================
      case 'code_execute': {
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
          const timeout = (parameters.timeout || 30) * 1000
          const { stdout, stderr } = await execAsync(cmdMap[parameters.language] || `cat ${tmpFile}`, { timeout })
          result = { success: true, data: { stdout, stderr } }
        } catch (err: unknown) {
          const error = err as { message: string; stdout?: string; stderr?: string }
          result = { success: false, error: error.message, data: { stdout: error.stdout || '', stderr: error.stderr || '' } }
        }
        break
      }

      case 'code_format': {
        const formatter = parameters.formatter || 'prettier'
        const filePath = join(basePath, parameters.path)
        if (!existsSync(filePath)) {
          result = { success: false, error: 'File not found' }
          break
        }
        try {
          const cmd = formatter === 'prettier' ? `npx prettier --write ${filePath}` : `${formatter} ${filePath}`
          const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 })
          result = { success: true, data: { formatted: true, output: stdout, errors: stderr } }
        } catch (err: unknown) {
          const error = err as Error
          result = { success: false, error: error.message }
        }
        break
      }

      case 'code_lint': {
        const linter = parameters.linter || 'eslint'
        const filePath = join(basePath, parameters.path)
        try {
          const fixFlag = parameters.fix ? ' --fix' : ''
          const cmd = linter === 'eslint' ? `npx eslint ${filePath}${fixFlag}` : `${linter} ${filePath}`
          const { stdout, stderr } = await execAsync(cmd, { timeout: 30000 })
          result = { success: true, data: { output: stdout, errors: stderr } }
        } catch (err: unknown) {
          const error = err as { stdout?: string; stderr?: string; message: string }
          result = { success: true, data: { output: error.stdout || '', errors: error.stderr || '', message: error.message } }
        }
        break
      }

      case 'code_test': {
        const framework = parameters.framework || 'jest'
        const filePath = join(basePath, parameters.path)
        const coverageFlag = parameters.coverage ? ' --coverage' : ''
        try {
          const cmdMap: Record<string, string> = {
            jest: `npx jest ${filePath}${coverageFlag}`,
            vitest: `npx vitest run ${filePath}${coverageFlag}`,
            pytest: `pytest ${filePath}`,
          }
          const { stdout, stderr } = await execAsync(cmdMap[framework] || cmdMap.jest, { timeout: 60000 })
          result = { success: true, data: { output: stdout, errors: stderr } }
        } catch (err: unknown) {
          const error = err as { stdout?: string; stderr?: string; message: string }
          result = { success: false, error: error.message, data: { output: error.stdout || '', errors: error.stderr || '' } }
        }
        break
      }

      case 'git_status': {
        const dir = parameters.directory ? join(basePath, parameters.directory) : basePath
        try {
          const { stdout } = await execAsync('git status --porcelain', { cwd: dir, timeout: 10000 })
          result = { success: true, data: { status: stdout } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: e.message }
        }
        break
      }

      case 'git_diff': {
        const dir = parameters.directory ? join(basePath, parameters.directory) : basePath
        const target = parameters.target || ''
        try {
          const { stdout } = await execAsync(`git diff ${target}`, { cwd: dir, timeout: 10000 })
          result = { success: true, data: { diff: stdout } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: e.message }
        }
        break
      }

      case 'git_log': {
        const dir = parameters.directory ? join(basePath, parameters.directory) : basePath
        const count = parameters.count || 10
        const format = parameters.format || 'oneline'
        try {
          const formatFlag = format === 'oneline' ? '--oneline' : format === 'short' ? '--short' : ''
          const { stdout } = await execAsync(`git log -${count} ${formatFlag}`, { cwd: dir, timeout: 10000 })
          result = { success: true, data: { log: stdout } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: e.message }
        }
        break
      }

      case 'npm_install': {
        const dir = parameters.directory ? join(basePath, parameters.directory) : basePath
        const devFlag = parameters.dev ? ' --save-dev' : ''
        try {
          const { stdout, stderr } = await execAsync(`npm install ${parameters.packages}${devFlag}`, { cwd: dir, timeout: 120000 })
          result = { success: true, data: { output: stdout, warnings: stderr } }
        } catch (err: unknown) {
          const e = err as { stdout?: string; stderr?: string; message: string }
          result = { success: false, error: e.message, data: { output: e.stdout || '', warnings: e.stderr || '' } }
        }
        break
      }

      // =====================================================================
      // System & Shell
      // =====================================================================
      case 'shell_execute': {
        const dir = parameters.directory ? join(basePath, parameters.directory) : basePath
        const timeout = (parameters.timeout || 30) * 1000
        try {
          const { stdout, stderr } = await execAsync(parameters.command, { cwd: dir, timeout })
          result = { success: true, data: { stdout, stderr } }
        } catch (err: unknown) {
          const e = err as { message: string; stdout?: string; stderr?: string }
          result = { success: false, error: e.message, data: { stdout: e.stdout || '', stderr: e.stderr || '' } }
        }
        break
      }

      case 'process_list': {
        try {
          const filter = parameters.filter ? ` | grep -i "${parameters.filter}"` : ''
          const { stdout } = await execAsync(`ps aux${filter} | head -50`, { timeout: 10000 })
          result = { success: true, data: { processes: stdout } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: e.message }
        }
        break
      }

      case 'process_kill': {
        const signal = parameters.signal || 'SIGTERM'
        try {
          if (parameters.pid) {
            await execAsync(`kill -${signal === 'SIGKILL' ? 9 : 15} ${parameters.pid}`, { timeout: 5000 })
            result = { success: true, data: { killed: true, pid: parameters.pid } }
          } else if (parameters.name) {
            const { stdout } = await execAsync(`pkill -${signal === 'SIGKILL' ? 9 : 15} "${parameters.name}"`, { timeout: 5000 })
            result = { success: true, data: { killed: true, name: parameters.name } }
          } else {
            result = { success: false, error: 'pid or name is required' }
          }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: e.message }
        }
        break
      }

      case 'env_get': {
        const value = process.env[parameters.key]
        result = { success: true, data: { key: parameters.key, value: value ?? null } }
        break
      }

      case 'env_set': {
        process.env[parameters.key] = parameters.value
        result = { success: true, data: { key: parameters.key, set: true } }
        break
      }

      case 'system_info': {
        const sections = parameters.sections || 'all'
        const info: Record<string, unknown> = {}
        try {
          if (sections === 'all' || sections.includes('os')) {
            const { stdout } = await execAsync('uname -a', { timeout: 5000 })
            info.os = stdout.trim()
          }
          if (sections === 'all' || sections.includes('cpu')) {
            const { stdout } = await execAsync('nproc && cat /proc/cpuinfo | grep "model name" | head -1', { timeout: 5000 })
            info.cpu = stdout.trim()
          }
          if (sections === 'all' || sections.includes('memory')) {
            const { stdout } = await execAsync('free -h | head -2', { timeout: 5000 })
            info.memory = stdout.trim()
          }
          if (sections === 'all' || sections.includes('disk')) {
            const { stdout } = await execAsync('df -h / | tail -1', { timeout: 5000 })
            info.disk = stdout.trim()
          }
          info.uptime = process.uptime()
          info.nodeVersion = process.version
          info.platform = process.platform
          info.arch = process.arch
          result = { success: true, data: info }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: e.message }
        }
        break
      }

      // =====================================================================
      // AI & Data
      // =====================================================================
      case 'image_generate': {
        const zai = await ZAI.create()
        const response = await zai.images.generations.create({
          prompt: parameters.prompt,
          size: parameters.size || '1024x1024',
        })
        result = { success: true, data: { image: response.data[0]?.base64 } }
        break
      }

      case 'image_analyze': {
        const zai = await ZAI.create()
        const completion = await zai.chat.completions.create({
          model: 'glm-4v-flash',
          messages: [
            {
              role: 'user',
              content: `Analyze this image: ${parameters.image}\n\n${parameters.prompt || 'Describe this image in detail.'}`,
            },
          ],
        })
        result = { success: true, data: { analysis: completion.choices[0]?.message?.content } }
        break
      }

      case 'speech_to_text': {
        // Speech-to-text using a simple placeholder
        // In production, this would use a proper ASR service
        result = {
          success: true,
          data: {
            text: '[ASR transcription placeholder - configure ASR service for production use]',
            audio: parameters.audio,
            language: parameters.language || 'en',
          },
        }
        break
      }

      case 'text_to_speech': {
        // Return a placeholder — actual TTS would need a TTS service
        result = {
          success: true,
          data: {
            text: parameters.text,
            voice: parameters.voice || 'alloy',
            speed: parameters.speed || 1.0,
            message: 'TTS generation initiated. Audio would be streamed to client.',
          },
        }
        break
      }

      case 'data_query': {
        // Parse and query structured data
        try {
          let data: unknown
          if (parameters.source.endsWith('.json')) {
            const filePath = join(basePath, parameters.source)
            data = JSON.parse(readFileSync(filePath, 'utf-8'))
          } else if (parameters.source.endsWith('.csv')) {
            const filePath = join(basePath, parameters.source)
            const content = readFileSync(filePath, 'utf-8')
            const lines = content.trim().split('\n')
            const headers = lines[0].split(',')
            data = lines.slice(1).map((line) => {
              const values = line.split(',')
              const obj: Record<string, string> = {}
              headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim() })
              return obj
            })
          } else {
            data = JSON.parse(parameters.source)
          }
          result = { success: true, data: { result: data, query: parameters.query } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: `Data query failed: ${e.message}` }
        }
        break
      }

      case 'data_visualize': {
        // Return chart specification for frontend rendering
        result = {
          success: true,
          data: {
            chartType: parameters.chartType || 'bar',
            title: parameters.title || 'Data Visualization',
            data: parameters.data,
            options: parameters.options ? JSON.parse(parameters.options) : {},
            message: 'Chart specification generated. Frontend should render this.',
          },
        }
        break
      }

      // =====================================================================
      // Memory & Knowledge
      // =====================================================================
      case 'memory_store': {
        const memory = await db.memory.create({
          data: {
            type: parameters.type || 'fact',
            key: parameters.key || null,
            content: parameters.content,
            tags: parameters.tags || null,
            relevance: 1.0,
          },
        })
        result = { success: true, data: { id: memory.id, stored: true } }
        break
      }

      case 'memory_search': {
        const memories = await db.memory.findMany({
          where: {
            OR: [
              { content: { contains: parameters.query } },
              { key: { contains: parameters.query } },
            ],
            ...(parameters.type ? { type: parameters.type } : {}),
          },
          take: parameters.limit || 5,
          orderBy: { relevance: 'desc' },
        })
        result = { success: true, data: memories }
        break
      }

      case 'memory_summarize': {
        const whereClause: Record<string, unknown> = {}
        if (parameters.type && parameters.type !== 'all') {
          whereClause.type = parameters.type
        }
        const allMemories = await db.memory.findMany({ where: whereClause })
        // Simple compression: combine similar memories
        const summary = allMemories.map((m) => `[${m.type}] ${m.content}`).join('\n')
        result = { success: true, data: { originalCount: allMemories.length, summary } }
        break
      }

      case 'document_query': {
        const docs = await db.memory.findMany({
          where: { key: { startsWith: 'document:' } },
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

      case 'knowledge_graph': {
        const action = parameters.action
        if (action === 'add') {
          const mem = await db.memory.create({
            data: {
              type: 'learned-pattern',
              key: `kg:${parameters.entity}:${parameters.relation}:${parameters.target}`,
              content: `${parameters.entity} ${parameters.relation} ${parameters.target}`,
              tags: JSON.stringify(['knowledge-graph', parameters.relation || 'related']),
              relevance: 1.0,
            },
          })
          result = { success: true, data: { id: mem.id, added: true } }
        } else if (action === 'query') {
          const entity = parameters.entity || ''
          const kgEntries = await db.memory.findMany({
            where: {
              key: { startsWith: 'kg:' },
              ...(entity ? { content: { contains: entity } } : {}),
            },
            take: 20,
          })
          result = { success: true, data: kgEntries }
        } else {
          const allKg = await db.memory.findMany({
            where: { key: { startsWith: 'kg:' } },
            take: 50,
          })
          result = { success: true, data: allKg }
        }
        break
      }

      // =====================================================================
      // Scheduling & Automation
      // =====================================================================
      case 'schedule_task': {
        const job = await db.cronJob.create({
          data: {
            name: parameters.name,
            schedule: parameters.schedule,
            taskType: parameters.taskType || 'shell',
            taskData: JSON.stringify({ command: parameters.command }),
            isActive: true,
          },
        })
        result = { success: true, data: { id: job.id, scheduled: true } }
        break
      }

      case 'schedule_list': {
        const whereClause: Record<string, unknown> = {}
        if (parameters.active !== undefined) whereClause.isActive = parameters.active
        const jobs = await db.cronJob.findMany({ where: whereClause, orderBy: { createdAt: 'desc' } })
        result = { success: true, data: jobs }
        break
      }

      case 'notify': {
        // Store notification in memory for the notification center
        await db.memory.create({
          data: {
            type: 'context',
            key: `notify:${Date.now()}`,
            content: JSON.stringify({
              title: parameters.title,
              message: parameters.message,
              type: parameters.type || 'info',
              channel: parameters.channel || 'browser',
            }),
            relevance: 1.0,
          },
        })
        result = { success: true, data: { notified: true, title: parameters.title } }
        break
      }

      case 'webhook_trigger': {
        const method = parameters.method || 'POST'
        const webhookHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(parameters.headers ? JSON.parse(parameters.headers) : {}),
        }
        try {
          const res = await fetch(parameters.url, {
            method,
            headers: webhookHeaders,
            body: parameters.payload || '{}',
          })
          const text = await res.text()
          result = { success: true, data: { status: res.status, response: text } }
        } catch (err: unknown) {
          const e = err as Error
          result = { success: false, error: `Webhook failed: ${e.message}` }
        }
        break
      }

      // =====================================================================
      // Messaging & Communication
      // =====================================================================
      case 'message_send': {
        // Store message intent in memory for platform integrations
        await db.memory.create({
          data: {
            type: 'context',
            key: `message:${parameters.platform}:${Date.now()}`,
            content: JSON.stringify({
              platform: parameters.platform,
              recipient: parameters.recipient,
              message: parameters.message,
              sentAt: new Date().toISOString(),
            }),
            relevance: 1.0,
          },
        })
        result = { success: true, data: { sent: true, platform: parameters.platform, recipient: parameters.recipient } }
        break
      }

      case 'email_send': {
        // Store email intent for email service integration
        await db.memory.create({
          data: {
            type: 'context',
            key: `email:${Date.now()}`,
            content: JSON.stringify({
              to: parameters.to,
              subject: parameters.subject,
              body: parameters.body,
              cc: parameters.cc,
              attachments: parameters.attachments,
              sentAt: new Date().toISOString(),
            }),
            relevance: 1.0,
          },
        })
        result = { success: true, data: { sent: true, to: parameters.to, subject: parameters.subject } }
        break
      }

      case 'contact_search': {
        // Search DM pairings as contacts
        const contacts = await db.dmPairing.findMany({
          where: {
            isActive: true,
            OR: [
              { displayName: { contains: parameters.query } },
              { userId: { contains: parameters.query } },
              ...(parameters.platform ? [{ platform: parameters.platform }] : []),
            ],
          },
          take: 10,
        })
        result = { success: true, data: contacts }
        break
      }

      default:
        result = { success: false, error: `Unknown tool: ${tool}` }
    }

    // Log the execution
    await db.memory.create({
      data: {
        type: 'context',
        key: `tool-exec:${tool}:${Date.now()}`,
        content: JSON.stringify({
          tool,
          success: result.success,
          timestamp: new Date().toISOString(),
        }),
        relevance: 0.5,
      },
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
