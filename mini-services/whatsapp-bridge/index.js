const express = require('express')
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const fetch = require('node-fetch')

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.WHATSAPP_PORT || 3004
const HERMES_API = process.env.HERMES_API || 'http://localhost:3000'
const HERMES_WS = process.env.HERMES_WS || 'http://localhost:3003'
const SESSION_DIR = process.env.SESSION_DIR || './.wwebjs_auth'

// ---------------------------------------------------------------------------
// Express Server
// ---------------------------------------------------------------------------
const app = express()
app.use(express.json())

// ---------------------------------------------------------------------------
// WhatsApp Client
// ---------------------------------------------------------------------------
let client = null
let isReady = false
let qrDataUrl = null
let connectionStatus = 'disconnected' // 'disconnected', 'connecting', 'connected', 'error'

// WhatsApp chat ID → Hermes conversation ID mapping
const sessionMap = new Map()

// ---------------------------------------------------------------------------
// Helper: Call Hermes API
// ---------------------------------------------------------------------------
async function hermesAPI(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${HERMES_API}${path}`, opts)
  if (!res.ok) throw new Error(`Hermes API error: ${res.status}`)
  if (res.status === 204) return null
  return res.json()
}

// ---------------------------------------------------------------------------
// Helper: Get or create Hermes conversation for a WhatsApp chat
// ---------------------------------------------------------------------------
async function getOrCreateConversation(chatId, chatName) {
  if (sessionMap.has(chatId)) {
    return sessionMap.get(chatId)
  }

  try {
    const conv = await hermesAPI('POST', '/api/conversations', {
      title: `WhatsApp: ${chatName || chatId}`,
      mode: 'chat',
      provider: 'whatsapp',
    })
    sessionMap.set(chatId, conv.id)
    console.log(`[WhatsApp] Created Hermes conversation "${conv.id}" for chat ${chatId}`)
    return conv.id
  } catch (err) {
    console.error('[WhatsApp] Failed to create conversation:', err.message)
    return null
  }
}

// ---------------------------------------------------------------------------
// Helper: Process incoming WhatsApp message through Hermes AI
// ---------------------------------------------------------------------------
async function processMessage(chatId, chatName, messageText, senderName) {
  try {
    const conversationId = await getOrCreateConversation(chatId, chatName)
    if (!conversationId) return 'Sorry, I could not process your message. Please try again later.'

    // Create user message in Hermes
    await hermesAPI('POST', `/api/conversations/${conversationId}/messages`, {
      role: 'user',
      content: `[WhatsApp${senderName ? ` - ${senderName}` : ''}] ${messageText}`,
    })

    // Process through Hermes AI (try WebSocket first, fallback to REST)
    let aiResponse = ''

    try {
      // Use the agent WebSocket service for streaming
      const wsUrl = HERMES_WS
      aiResponse = await new Promise((resolve, reject) => {
        const { io } = require('socket.io-client')
        const socket = io(wsUrl, {
          transports: ['websocket'],
          reconnection: false,
        })

        let response = ''
        let timeout = setTimeout(() => {
          socket.disconnect()
          reject(new Error('AI response timeout'))
        }, 120000) // 2 minute timeout

        socket.on('connect', () => {
          socket.emit('chat:api', {
            message: messageText,
            conversationId,
            provider: 'default',
          })
        })

        socket.on('chat:chunk', (data) => {
          response += data.content || ''
        })

        socket.on('chat:done', () => {
          clearTimeout(timeout)
          socket.disconnect()
          resolve(response || 'I received your message but had no response.')
        })

        socket.on('chat:error', (err) => {
          clearTimeout(timeout)
          socket.disconnect()
          reject(new Error(err.message || 'Chat error'))
        })

        socket.on('connect_error', (err) => {
          clearTimeout(timeout)
          reject(new Error(`WS connect error: ${err.message}`))
        })
      })
    } catch (wsErr) {
      console.log('[WhatsApp] WS failed, trying REST fallback:', wsErr.message)

      // Fallback: use the stream API
      try {
        const res = await fetch(`${HERMES_API}/api/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            conversationId,
          }),
        })
        if (res.ok) {
          const text = await res.text()
          aiResponse = text || 'No response from AI.'
        } else {
          aiResponse = 'I\'m currently unable to connect to the AI service. Please try again later.'
        }
      } catch (restErr) {
        aiResponse = 'I\'m currently offline. Please try again later.'
      }
    }

    // Save assistant response
    if (aiResponse) {
      await hermesAPI('POST', `/api/conversations/${conversationId}/messages`, {
        role: 'assistant',
        content: aiResponse,
      })
    }

    return aiResponse
  } catch (err) {
    console.error('[WhatsApp] Error processing message:', err)
    return 'An internal error occurred. Please try again.'
  }
}

// ---------------------------------------------------------------------------
// Command handler
// ---------------------------------------------------------------------------
function handleCommand(text, chatId) {
  const parts = text.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()

  switch (cmd) {
    case '/help':
      return `🤖 *Hermes AI Agent* - WhatsApp Bridge

Commands:
/help - Show this help
/agent - Switch to Agent mode (full system access)
/chat - Switch to Chat mode
/model <name> - Change AI model
/clear - Clear conversation history
/status - Show system status
/providers - List available providers

Just type a message to chat with Hermes AI!`

    case '/status':
      return `🟢 *Hermes AI Status*\n\nWhatsApp: ${isReady ? 'Connected' : 'Disconnected'}\nActive Sessions: ${sessionMap.size}\nProvider: Default`

    case '/clear': {
      // Clear the session mapping for this chat (will create new conversation on next message)
      sessionMap.delete(chatId)
      return '🗑️ Conversation cleared. Next message will start a new chat.'
    }

    case '/agent':
      return '🤖 Agent mode activated. I now have full system access with shell commands, file operations, and more. Type /chat to return to chat mode.'

    case '/chat':
      return '💬 Chat mode activated. I\'m in conversation mode. Type /agent for full system access.'

    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Initialize WhatsApp Client
// ---------------------------------------------------------------------------
function initWhatsApp() {
  connectionStatus = 'connecting'

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: SESSION_DIR,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    },
  })

  client.on('qr', (qr) => {
    console.log('\n[WhatsApp] Scan this QR code with your WhatsApp:')
    qrcode.generate(qr, { small: true })
    // Store QR for HTTP endpoint
    qrDataUrl = qr
  })

  client.on('ready', () => {
    console.log('[WhatsApp] Client is ready!')
    isReady = true
    connectionStatus = 'connected'
    qrDataUrl = null
  })

  client.on('message', async (msg) => {
    try {
      // Skip group messages by default (can be configured)
      if (msg.from.includes('@g.us')) {
        // Only respond if mentioned in group
        if (!msg.mentionedIds?.length) return
      }

      const chatId = msg.from
      const chatName = msg._data?.notifyName || msg.from
      const senderName = msg._data?.notifyName || ''
      const messageText = msg.body || ''

      if (!messageText.trim()) return

      console.log(`[WhatsApp] Message from ${chatName}: ${messageText.substring(0, 100)}`)

      // Check for commands first
      if (messageText.startsWith('/')) {
        const cmdResponse = handleCommand(messageText, chatId)
        if (cmdResponse) {
          await msg.reply(cmdResponse)
          return
        }
      }

      // Show "typing" indicator
      const chat = await msg.getChat()
      await chat.sendStateTyping()

      // Process through Hermes AI
      const aiResponse = await processMessage(chatId, chatName, messageText, senderName)

      // Clear typing indicator and send response
      await chat.clearState()

      // Split long messages (WhatsApp has ~65536 char limit, but we'll chunk at 4000 for readability)
      if (aiResponse.length > 4000) {
        const chunks = []
        for (let i = 0; i < aiResponse.length; i += 4000) {
          chunks.push(aiResponse.substring(i, i + 4000))
        }
        for (const chunk of chunks) {
          await msg.reply(chunk)
          await new Promise(r => setTimeout(r, 500)) // Rate limit
        }
      } else {
        await msg.reply(aiResponse)
      }

    } catch (err) {
      console.error('[WhatsApp] Error handling message:', err)
      try {
        await msg.reply('Sorry, an error occurred while processing your message.')
      } catch {}
    }
  })

  client.on('message_create', async (msg) => {
    // Handle messages sent by us (from other devices) - optional echo handling
    if (msg.fromMe) return
  })

  client.on('disconnected', (reason) => {
    console.log('[WhatsApp] Client disconnected:', reason)
    isReady = false
    connectionStatus = 'disconnected'
    // Auto-reconnect after 5 seconds
    setTimeout(() => {
      console.log('[WhatsApp] Attempting reconnect...')
      initWhatsApp()
    }, 5000)
  })

  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Auth failure:', msg)
    connectionStatus = 'error'
  })

  client.initialize()
}

// ---------------------------------------------------------------------------
// Express Routes
// ---------------------------------------------------------------------------
app.get('/status', (req, res) => {
  res.json({
    connected: isReady,
    status: connectionStatus,
    sessions: sessionMap.size,
    sessionList: Array.from(sessionMap.entries()).map(([chatId, convId]) => ({
      chatId,
      conversationId: convId,
    })),
  })
})

app.get('/qr', (req, res) => {
  if (isReady) {
    return res.json({ status: 'connected', message: 'Already connected. No QR needed.' })
  }
  if (qrDataUrl) {
    return res.json({ status: 'waiting_scan', qr: qrDataUrl })
  }
  return res.json({ status: connectionStatus, message: 'QR code not yet generated' })
})

app.post('/send', async (req, res) => {
  try {
    if (!isReady) return res.status(503).json({ error: 'WhatsApp not connected' })
    const { chatId, message } = req.body
    if (!chatId || !message) return res.status(400).json({ error: 'chatId and message required' })

    // Format chatId if needed (add @c.us suffix)
    const formattedId = chatId.includes('@') ? chatId : `${chatId}@c.us`
    await client.sendMessage(formattedId, message)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/disconnect', async (req, res) => {
  try {
    if (client) {
      await client.destroy()
      isReady = false
      connectionStatus = 'disconnected'
      client = null
    }
    res.json({ success: true, message: 'Disconnected' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/connect', (req, res) => {
  if (isReady) return res.json({ status: 'already_connected' })
  if (connectionStatus === 'connecting') return res.json({ status: 'connecting' })
  initWhatsApp()
  res.json({ status: 'initiating' })
})

app.delete('/sessions/:chatId', (req, res) => {
  const { chatId } = req.params
  const existed = sessionMap.delete(chatId)
  res.json({ success: true, existed })
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[WhatsApp Bridge] HTTP server running on port ${PORT}`)
  console.log(`[WhatsApp Bridge] Hermes API: ${HERMES_API}`)
  console.log(`[WhatsApp Bridge] Hermes WS: ${HERMES_WS}`)

  // Auto-initialize WhatsApp client
  initWhatsApp()
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[WhatsApp Bridge] Shutting down...')
  if (client) await client.destroy().catch(() => {})
  process.exit(0)
})
