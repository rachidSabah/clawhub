// ============================================================================
// Signal CLI Platform Integration
// ============================================================================

import type { PlatformModule, PlatformStatus, IncomingMessage } from '../types'

let isPolling = false
let pollingInterval: ReturnType<typeof setInterval> | null = null
let isConnected = false
let onMessage: ((msg: IncomingMessage) => void) | null = null

function getEnvVar(name: string): string | undefined {
  try {
    return process.env[name]
  } catch {
    return undefined
  }
}

// Signal CLI REST API base URL
const SIGNAL_CLI_API = getEnvVar('SIGNAL_CLI_API_URL') || 'http://localhost:8080'

export function setOnMessageHandler(handler: (msg: IncomingMessage) => void) {
  onMessage = handler
}

async function pollSignalMessages() {
  const phoneNumber = getEnvVar('SIGNAL_PHONE_NUMBER')
  if (!phoneNumber) return

  try {
    const response = await fetch(`${SIGNAL_CLI_API}/v1/receive/${phoneNumber}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) return

    const messages = await response.json() as any[]
    if (!Array.isArray(messages)) return

    for (const msg of messages) {
      if (msg.envelope && msg.envelope.dataMessage) {
        const data = msg.envelope.dataMessage
        if (data.message && onMessage) {
          onMessage({
            platform: 'signal',
            chatId: data.groupInfo?.groupId || data.source,
            userId: data.source,
            text: data.message,
            timestamp: data.timestamp,
          })
        }
      }
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Signal] Polling error:', errMsg)
  }
}

export const signalPlatform: PlatformModule = {
  name: 'Signal',

  connect: async () => {
    const phoneNumber = getEnvVar('SIGNAL_PHONE_NUMBER')
    if (!phoneNumber) {
      throw new Error('SIGNAL_PHONE_NUMBER environment variable is not set')
    }

    try {
      // Check if signal-cli REST API is reachable
      const response = await fetch(`${SIGNAL_CLI_API}/v1/about`).catch(() => null)
      if (!response?.ok) {
        console.warn('[Signal] signal-cli REST API not reachable at', SIGNAL_CLI_API)
        console.warn('[Signal] Make sure signal-cli is running: signal-cli -u NUMBER restapi')
      }

      // Start polling for messages
      isPolling = true
      pollingInterval = setInterval(pollSignalMessages, 3000) // Poll every 3 seconds

      isConnected = true
      console.log('[Signal] Connected, polling for messages')
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Signal] Connection failed:', errMsg)
      throw error
    }
  },

  disconnect: async () => {
    isPolling = false
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    isConnected = false
    console.log('[Signal] Disconnected')
  },

  sendMessage: async (chatId: string, message: string) => {
    const phoneNumber = getEnvVar('SIGNAL_PHONE_NUMBER')
    if (!phoneNumber) throw new Error('SIGNAL_PHONE_NUMBER not set')

    try {
      // Determine if it's a group or individual message
      const isGroup = chatId.length > 20 // Signal group IDs are longer

      const body: Record<string, unknown> = {
        message,
        account: phoneNumber,
      }

      if (isGroup) {
        body.groupId = chatId
      } else {
        body.recipient = chatId
      }

      const response = await fetch(`${SIGNAL_CLI_API}/v1/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Signal API error: ${response.status} - ${errorText}`)
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Signal] Failed to send message:', errMsg)
      throw new Error(`Signal send failed: ${errMsg}`)
    }
  },

  getStatus: (): PlatformStatus => ({
    platform: 'Signal',
    connected: isConnected,
    info: isConnected
      ? `Polling messages for ${getEnvVar('SIGNAL_PHONE_NUMBER')}`
      : getEnvVar('SIGNAL_PHONE_NUMBER')
        ? 'Phone number configured, signal-cli REST API required'
        : 'No SIGNAL_PHONE_NUMBER set',
  }),
}
