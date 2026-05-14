import { createServer } from 'http'
import { Server } from 'socket.io'
import { spawn, ChildProcess } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Track running processes per socket
const activeProcesses = new Map<string, ChildProcess[]>()

// Helper to detect OS/shell
function getShell(): { shell: string; args: string[] } {
  const isWin = process.platform === 'win32'
  if (isWin) {
    return { shell: 'cmd.exe', args: ['/c'] }
  }
  return { shell: '/bin/bash', args: ['-c'] }
}

// Execute a shell command and stream output back via socket
function executeCommand(
  socketId: string,
  command: string,
  workingDir?: string,
  timeout: number = 120000
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const { shell, args } = getShell()
    const fullArgs = [...args, command]

    const proc = spawn(shell, fullArgs, {
      cwd: workingDir || process.cwd(),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // Track the process
    if (!activeProcesses.has(socketId)) {
      activeProcesses.set(socketId, [])
    }
    activeProcesses.get(socketId)!.push(proc)

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString()
      stdout += text
      io.to(socketId).emit('agent:stream', {
        type: 'stdout',
        data: text,
        timestamp: new Date().toISOString()
      })
    })

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      stderr += text
      io.to(socketId).emit('agent:stream', {
        type: 'stderr',
        data: text,
        timestamp: new Date().toISOString()
      })
    })

    proc.on('close', (code) => {
      const processes = activeProcesses.get(socketId)
      if (processes) {
        const idx = processes.indexOf(proc)
        if (idx > -1) processes.splice(idx, 1)
      }
      resolve({ exitCode: code || 0, stdout, stderr })
    })

    proc.on('error', (err) => {
      reject(err)
    })

    // Timeout
    setTimeout(() => {
      proc.kill('SIGTERM')
      resolve({ exitCode: -1, stdout, stderr: 'Command timed out' })
    }, timeout)
  })
}

// Execute Gemini CLI command
function executeGemini(
  socketId: string,
  prompt: string,
  model: string = 'gemini-2.0-flash',
  systemPrompt?: string,
  files: string[] = []
): Promise<{ exitCode: number; fullOutput: string }> {
  return new Promise((resolve, reject) => {
    // Build the gemini command
    let command = `gemini --model ${model}`

    if (systemPrompt) {
      command += ` --system "${systemPrompt.replace(/"/g, '\\"')}"`
    }

    // Add files if any
    for (const file of files) {
      command += ` --file "${file}"`
    }

    command += ` --prompt "${prompt.replace(/"/g, '\\"')}"`

    const { shell, args } = getShell()
    const fullArgs = [...args, command]

    const proc = spawn(shell, fullArgs, {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    if (!activeProcesses.has(socketId)) {
      activeProcesses.set(socketId, [])
    }
    activeProcesses.get(socketId)!.push(proc)

    let fullOutput = ''

    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString()
      fullOutput += text
      io.to(socketId).emit('chat:stream', {
        type: 'content',
        data: text,
        timestamp: new Date().toISOString()
      })
    })

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString()
      fullOutput += text
      io.to(socketId).emit('chat:stream', {
        type: 'error',
        data: text,
        timestamp: new Date().toISOString()
      })
    })

    proc.on('close', (code) => {
      const processes = activeProcesses.get(socketId)
      if (processes) {
        const idx = processes.indexOf(proc)
        if (idx > -1) processes.splice(idx, 1)
      }
      io.to(socketId).emit('chat:stream', {
        type: 'done',
        data: '',
        exitCode: code || 0,
        timestamp: new Date().toISOString()
      })
      resolve({ exitCode: code || 0, fullOutput })
    })

    proc.on('error', (err) => {
      io.to(socketId).emit('chat:stream', {
        type: 'error',
        data: err.message,
        timestamp: new Date().toISOString()
      })
      reject(err)
    })
  })
}

// Execute API-based chat (OpenAI-compatible)
function executeApiChat(
  socketId: string,
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{role: string; content: string}>,
  stream: boolean = true
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          stream,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        io.to(socketId).emit('chat:stream', {
          type: 'error',
          data: `API Error ${response.status}: ${errorText}`,
          timestamp: new Date().toISOString()
        })
        reject(new Error(`API Error ${response.status}`))
        return
      }

      if (stream && response.body) {
        let fullContent = ''
        // @ts-ignore - Node.js ReadableStream
        for await (const chunk of response.body) {
          const text = chunk.toString()
          const lines = text.split('\n').filter((line: string) => line.startsWith('data: '))

          for (const line of lines) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              io.to(socketId).emit('chat:stream', {
                type: 'done',
                data: '',
                timestamp: new Date().toISOString()
              })
              resolve(fullContent)
              return
            }
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content || ''
              if (delta) {
                fullContent += delta
                io.to(socketId).emit('chat:stream', {
                  type: 'content',
                  data: delta,
                  timestamp: new Date().toISOString()
                })
              }
            } catch {}
          }
        }
        resolve(fullContent)
      } else {
        const data = await response.json() as any
        const content = data.choices?.[0]?.message?.content || ''
        io.to(socketId).emit('chat:stream', {
          type: 'content',
          data: content,
          timestamp: new Date().toISOString()
        })
        io.to(socketId).emit('chat:stream', {
          type: 'done',
          data: '',
          timestamp: new Date().toISOString()
        })
        resolve(content)
      }
    } catch (err: any) {
      io.to(socketId).emit('chat:stream', {
        type: 'error',
        data: err.message,
        timestamp: new Date().toISOString()
      })
      reject(err)
    }
  })
}

// File system operations
function fileRead(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (err: any) {
    return `Error reading file: ${err.message}`
  }
}

function fileWrite(filePath: string, content: string): string {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, content, 'utf-8')
    return `File written successfully: ${filePath}`
  } catch (err: any) {
    return `Error writing file: ${err.message}`
  }
}

function fileDelete(filePath: string): string {
  try {
    fs.unlinkSync(filePath)
    return `File deleted: ${filePath}`
  } catch (err: any) {
    return `Error deleting file: ${err.message}`
  }
}

function fileList(dirPath: string): string {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries.map(e => {
      const prefix = e.isDirectory() ? '📁 ' : '📄 '
      return prefix + e.name
    }).join('\n')
  } catch (err: any) {
    return `Error listing directory: ${err.message}`
  }
}

// Agent tools registry
const agentTools: Record<string, any> = {
  shell: {
    description: 'Execute a shell command',
    execute: (socketId: string, params: { command: string; workingDir?: string }) =>
      executeCommand(socketId, params.command, params.workingDir)
  },
  file_read: {
    description: 'Read a file from disk',
    execute: (_socketId: string, params: { path: string }) =>
      Promise.resolve({ output: fileRead(params.path) })
  },
  file_write: {
    description: 'Write content to a file',
    execute: (_socketId: string, params: { path: string; content: string }) =>
      Promise.resolve({ output: fileWrite(params.path, params.content) })
  },
  file_delete: {
    description: 'Delete a file',
    execute: (_socketId: string, params: { path: string }) =>
      Promise.resolve({ output: fileDelete(params.path) })
  },
  file_list: {
    description: 'List directory contents',
    execute: (_socketId: string, params: { path: string }) =>
      Promise.resolve({ output: fileList(params.path) })
  },
}

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)

  // Chat with Gemini CLI
  socket.on('chat:gemini', async (data: {
    prompt: string
    model?: string
    systemPrompt?: string
    files?: string[]
  }) => {
    try {
      io.to(socket.id).emit('chat:stream', {
        type: 'start',
        data: '',
        timestamp: new Date().toISOString()
      })
      await executeGemini(
        socket.id,
        data.prompt,
        data.model || 'gemini-2.0-flash',
        data.systemPrompt,
        data.files || []
      )
    } catch (err: any) {
      io.to(socket.id).emit('chat:stream', {
        type: 'error',
        data: err.message,
        timestamp: new Date().toISOString()
      })
    }
  })

  // Chat with API provider
  socket.on('chat:api', async (data: {
    baseUrl: string
    apiKey: string
    model: string
    messages: Array<{role: string; content: string}>
    stream?: boolean
  }) => {
    try {
      io.to(socket.id).emit('chat:stream', {
        type: 'start',
        data: '',
        timestamp: new Date().toISOString()
      })
      await executeApiChat(
        socket.id,
        data.baseUrl,
        data.apiKey,
        data.model,
        data.messages,
        data.stream !== false
      )
    } catch (err: any) {
      io.to(socket.id).emit('chat:stream', {
        type: 'error',
        data: err.message,
        timestamp: new Date().toISOString()
      })
    }
  })

  // Agent: Execute shell command
  socket.on('agent:execute', async (data: {
    command: string
    workingDir?: string
    timeout?: number
  }, callback?: (result: any) => void) => {
    try {
      const result = await executeCommand(
        socket.id,
        data.command,
        data.workingDir,
        data.timeout
      )
      callback?.({ success: true, ...result })
    } catch (err: any) {
      callback?.({ success: false, error: err.message })
    }
  })

  // Agent: File operations
  socket.on('agent:file:read', (data: { path: string }, callback?: (result: any) => void) => {
    const output = fileRead(data.path)
    callback?.({ success: true, output })
  })

  socket.on('agent:file:write', (data: { path: string; content: string }, callback?: (result: any) => void) => {
    const output = fileWrite(data.path, data.content)
    callback?.({ success: true, output })
  })

  socket.on('agent:file:delete', (data: { path: string }, callback?: (result: any) => void) => {
    const output = fileDelete(data.path)
    callback?.({ success: true, output })
  })

  socket.on('agent:file:list', (data: { path: string }, callback?: (result: any) => void) => {
    const output = fileList(data.path)
    callback?.({ success: true, output })
  })

  // Agent: Run agentic loop step
  socket.on('agent:step', async (data: {
    thought: string
    action: string
    actionInput: Record<string, any>
  }, callback?: (result: any) => void) => {
    try {
      io.to(socket.id).emit('agent:stream', {
        type: 'thought',
        data: data.thought,
        timestamp: new Date().toISOString()
      })

      io.to(socket.id).emit('agent:stream', {
        type: 'action',
        data: `Executing: ${data.action}`,
        actionInput: data.actionInput,
        timestamp: new Date().toISOString()
      })

      // Find and execute the tool
      const tool = agentTools[data.action]
      if (tool) {
        const result = await tool.execute(socket.id, data.actionInput)
        io.to(socket.id).emit('agent:stream', {
          type: 'observation',
          data: JSON.stringify(result),
          timestamp: new Date().toISOString()
        })
        callback?.({ success: true, observation: result })
      } else {
        const errorMsg = `Unknown tool: ${data.action}`
        io.to(socket.id).emit('agent:stream', {
          type: 'observation',
          data: errorMsg,
          timestamp: new Date().toISOString()
        })
        callback?.({ success: false, error: errorMsg })
      }
    } catch (err: any) {
      callback?.({ success: false, error: err.message })
    }
  })

  // Stop all running processes for a socket
  socket.on('agent:stop', () => {
    const processes = activeProcesses.get(socket.id)
    if (processes) {
      processes.forEach(proc => {
        try { proc.kill('SIGTERM') } catch {}
      })
      activeProcesses.delete(socket.id)
    }
    io.to(socket.id).emit('agent:stream', {
      type: 'stopped',
      data: 'All processes stopped',
      timestamp: new Date().toISOString()
    })
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    // Kill all processes for this socket
    const processes = activeProcesses.get(socket.id)
    if (processes) {
      processes.forEach(proc => {
        try { proc.kill('SIGTERM') } catch {}
      })
      activeProcesses.delete(socket.id)
    }
  })

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`Agent WebSocket server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...')
  httpServer.close(() => {
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...')
  httpServer.close(() => {
    process.exit(0)
  })
})
