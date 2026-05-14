// ============================================================================
// ClawHub Messaging Gateway — Main Express Server
// ============================================================================

import express from 'express'
import type { IncomingMessage, GatewayConfig, SendMessageRequest, HomeAssistantWebhook } from './types'
import { telegramPlatform, setOnMessageHandler as setTelegramHandler } from './platforms/telegram'
import { discordPlatform, setOnMessageHandler as setDiscordHandler } from './platforms/discord'
import { slackPlatform, setOnMessageHandler as setSlackHandler } from './platforms/slack'
import { signalPlatform, setOnMessageHandler as setSignalHandler } from './platforms/signal'
import { homeassistantPlatform, setOnMessageHandler as setHAHandler, processWebhookEvent } from './platforms/homeassistant'
import type { PlatformModule } from './types'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = 3005
const CLAWHUB_API_URL = process.env.CLAWHUB_API_URL || 'http://localhost:3000'

const config: GatewayConfig = {
  port: PORT,
  clawhubApiUrl: CLAWHUB_API_URL,
  allowedUserIds: (process.env.ALLOWED_USER_IDS || '').split(',').filter(Boolean),
  requireApproval: process.env.REQUIRE_APPROVAL !== 'false',
  approvalKeywords: (process.env.APPROVAL_KEYWORDS || 'delete,remove,rm,drop,truncate,wipe').split(',').filter(Boolean),
}

// ---------------------------------------------------------------------------
// Platform Registry
// ---------------------------------------------------------------------------

const platforms: Record<string, PlatformModule> = {
  telegram: telegramPlatform,
  discord: discordPlatform,
  slack: slackPlatform,
  signal: signalPlatform,
  homeassistant: homeassistantPlatform,
}

// ---------------------------------------------------------------------------
// Message Handler — Routes incoming messages to ClawHub API
// ---------------------------------------------------------------------------

async function handleIncomingMessage(msg: IncomingMessage): Promise<void> {
  console.log(`[Gateway] Incoming message from ${msg.platform} (${msg.userId}): ${msg.text.slice(0, 100)}`)

  // Security: Check allowed user IDs if configured
  if (config.allowedUserIds.length > 0) {
    if (!config.allowedUserIds.includes(msg.userId)) {
      console.log(`[Gateway] Rejected message from unauthorized user: ${msg.userId}`)
      try {
        const platform = platforms[msg.platform]
        if (platform) {
          await platform.sendMessage(msg.chatId, '⛔ You are not authorized to use this bot.')
        }
      } catch {
        // ignore send failure
      }
      return
    }
  }

  // Security: Check for approval keywords
  if (config.requireApproval) {
    const lowerText = msg.text.toLowerCase()
    const matchedKeyword = config.approvalKeywords.find(k => lowerText.includes(k))
    if (matchedKeyword) {
      console.log(`[Gateway] Approval required for keyword: "${matchedKeyword}"`)
      try {
        const platform = platforms[msg.platform]
        if (platform) {
          await platform.sendMessage(msg.chatId, `⚠️ This action requires approval (detected: "${matchedKeyword}"). Please confirm through the ClawHub dashboard.`)
        }
      } catch {
        // ignore
      }
      return
    }
  }

  try {
    // Forward to ClawHub chat stream API
    const response = await fetch(`${CLAWHUB_API_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: msg.text }],
        provider: 'zai',
      }),
    })

    if (!response.ok) {
      throw new Error(`ClawHub API returned ${response.status}`)
    }

    // Read the full streaming response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'content') {
                fullContent += data.content
              } else if (data.type === 'error') {
                fullContent += `\n[Error: ${data.error}]`
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }
    }

    // Send the response back through the messaging platform
    const platform = platforms[msg.platform]
    if (platform && fullContent) {
      await platform.sendMessage(msg.chatId, fullContent)
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Gateway] Failed to process message:`, errMsg)

    // Send error message back
    try {
      const platform = platforms[msg.platform]
      if (platform) {
        await platform.sendMessage(msg.chatId, `❌ Error processing your message: ${errMsg}`)
      }
    } catch {
      // ignore
    }
  }
}

// Set message handlers for each platform
setTelegramHandler(handleIncomingMessage)
setDiscordHandler(handleIncomingMessage)
setSlackHandler(handleIncomingMessage)
setSignalHandler(handleIncomingMessage)
setHAHandler(handleIncomingMessage)

// ---------------------------------------------------------------------------
// Express Server
// ---------------------------------------------------------------------------

const app = express()
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// GET /status — All platform connection statuses
app.get('/status', (_req, res) => {
  const statuses = Object.values(platforms).map(p => p.getStatus())
  const connected = statuses.filter(s => s.connected).length
  res.json({
    platforms: statuses,
    summary: {
      total: statuses.length,
      connected,
      disconnected: statuses.length - connected,
    },
  })
})

// POST /connect/:platform — Connect a specific platform
app.post('/connect/:platform', async (req, res) => {
  const platformName = req.params.platform.toLowerCase()
  const platform = platforms[platformName]

  if (!platform) {
    res.status(404).json({ error: `Unknown platform: ${platformName}. Available: ${Object.keys(platforms).join(', ')}` })
    return
  }

  try {
    await platform.connect()
    res.json({ success: true, platform: platformName, status: platform.getStatus() })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: `Failed to connect ${platformName}: ${errMsg}` })
  }
})

// POST /disconnect/:platform — Disconnect a specific platform
app.post('/disconnect/:platform', async (req, res) => {
  const platformName = req.params.platform.toLowerCase()
  const platform = platforms[platformName]

  if (!platform) {
    res.status(404).json({ error: `Unknown platform: ${platformName}` })
    return
  }

  try {
    await platform.disconnect()
    res.json({ success: true, platform: platformName, status: platform.getStatus() })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: `Failed to disconnect ${platformName}: ${errMsg}` })
  }
})

// POST /send — Send message to a platform
app.post('/send', async (req, res) => {
  const { platform: platformName, chatId, message } = req.body as SendMessageRequest

  if (!platformName || !chatId || !message) {
    res.status(400).json({ error: 'platform, chatId, and message are required' })
    return
  }

  const platform = platforms[platformName.toLowerCase()]
  if (!platform) {
    res.status(404).json({ error: `Unknown platform: ${platformName}` })
    return
  }

  try {
    await platform.sendMessage(chatId, message)
    res.json({ success: true, platform: platformName, chatId })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: `Failed to send message: ${errMsg}` })
  }
})

// POST /webhook/homeassistant — Receive HA webhook events
app.post('/webhook/homeassistant', async (req, res) => {
  try {
    const webhookData = req.body as HomeAssistantWebhook

    if (!webhookData.event_type) {
      res.status(400).json({ error: 'event_type is required' })
      return
    }

    const result = processWebhookEvent(webhookData)
    res.json({ received: true, result })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: errMsg })
  }
})

// ---------------------------------------------------------------------------
// Start Server & Auto-Connect Platforms
// ---------------------------------------------------------------------------

async function startServer() {
  // Start Express server
  app.listen(PORT, () => {
    console.log(`[Gateway] ClawHub Messaging Gateway running on port ${PORT}`)
    console.log(`[Gateway] ClawHub API URL: ${CLAWHUB_API_URL}`)
    console.log(`[Gateway] Allowed user IDs: ${config.allowedUserIds.length || 'all (no restrictions)'}`)
  })

  // Auto-connect platforms that have env vars configured
  for (const [name, platform] of Object.entries(platforms)) {
    try {
      await platform.connect()
      console.log(`[Gateway] Auto-connected: ${name}`)
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.log(`[Gateway] Skipping ${name}: ${errMsg}`)
    }
  }
}

startServer().catch(err => {
  console.error('[Gateway] Fatal error:', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Gateway] Shutting down...')
  for (const [name, platform] of Object.entries(platforms)) {
    try {
      await platform.disconnect()
      console.log(`[Gateway] Disconnected: ${name}`)
    } catch {
      // ignore
    }
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n[Gateway] Received SIGTERM...')
  for (const [name, platform] of Object.entries(platforms)) {
    try {
      await platform.disconnect()
    } catch {
      // ignore
    }
  }
  process.exit(0)
})
