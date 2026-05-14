// ============================================================================
// Home Assistant Webhook Integration
// ============================================================================

import type { PlatformModule, PlatformStatus, IncomingMessage, HomeAssistantWebhook } from '../types'

let isConnected = false
let onMessage: ((msg: IncomingMessage) => void) | null = null

function getEnvVar(name: string): string | undefined {
  try {
    return process.env[name]
  } catch {
    return undefined
  }
}

export function setOnMessageHandler(handler: (msg: IncomingMessage) => void) {
  onMessage = handler
}

/**
 * Process a webhook event from Home Assistant
 */
export function processWebhookEvent(webhookData: HomeAssistantWebhook): string | null {
  const haUrl = getEnvVar('HA_URL')
  const haToken = getEnvVar('HA_TOKEN')

  if (!haUrl || !haToken) {
    console.warn('[HomeAssistant] Webhook received but HA_URL/HA_TOKEN not configured')
    return 'Home Assistant not configured'
  }

  const eventType = webhookData.event_type
  const data = webhookData.data

  // Convert HA webhook to an incoming message
  if (onMessage) {
    let text = ''
    if (eventType === 'automation_triggered') {
      text = `[HA Automation] ${data.name || 'Unknown automation'} triggered`
    } else if (eventType === 'state_changed') {
      const entityId = (data.entity_id as string) || 'unknown'
      const newState = (data.new_state as Record<string, unknown>)?.state || 'unknown'
      text = `[HA State] ${entityId} → ${newState}`
    } else if (eventType === 'device_action') {
      text = `[HA Action] ${data.action || 'Unknown action'} from ${data.device_id || 'unknown device'}`
    } else {
      text = `[HA Event] ${eventType}: ${JSON.stringify(data).slice(0, 200)}`
    }

    onMessage({
      platform: 'homeassistant',
      chatId: `ha-${webhookData.source || 'default'}`,
      userId: 'homeassistant',
      text,
      timestamp: Date.now(),
    })
  }

  return `Processed: ${eventType}`
}

export const homeassistantPlatform: PlatformModule = {
  name: 'Home Assistant',

  connect: async () => {
    const haUrl = getEnvVar('HA_URL')
    const haToken = getEnvVar('HA_TOKEN')

    if (!haUrl || !haToken) {
      throw new Error('HA_URL and HA_TOKEN environment variables are required')
    }

    try {
      // Verify Home Assistant is reachable
      const response = await fetch(`${haUrl}/api/`, {
        headers: {
          'Authorization': `Bearer ${haToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.warn('[HomeAssistant] API returned', response.status)
        // Still mark as "connected" since we're in webhook mode
      }

      isConnected = true
      console.log('[HomeAssistant] Connected, ready for webhook events')
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.warn('[HomeAssistant] Could not reach HA API:', errMsg)
      // In webhook mode, we can still function even if we can't reach HA
      isConnected = true
      console.log('[HomeAssistant] Running in webhook-only mode')
    }
  },

  disconnect: async () => {
    isConnected = false
    console.log('[HomeAssistant] Disconnected')
  },

  sendMessage: async (chatId: string, message: string) => {
    const haUrl = getEnvVar('HA_URL')
    const haToken = getEnvVar('HA_TOKEN')
    if (!haUrl || !haToken) throw new Error('Home Assistant not configured')

    try {
      // Send a notification to Home Assistant
      // This creates a persistent notification in HA
      const response = await fetch(`${haUrl}/api/services/persistent_notification/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${haToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'ClawHub AI',
          message,
        }),
      })

      if (!response.ok) {
        throw new Error(`HA API returned ${response.status}`)
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[HomeAssistant] Failed to send notification:', errMsg)
      throw new Error(`HomeAssistant send failed: ${errMsg}`)
    }
  },

  getStatus: (): PlatformStatus => ({
    platform: 'Home Assistant',
    connected: isConnected,
    info: isConnected
      ? `Webhook mode active (${getEnvVar('HA_URL') || 'no URL'})`
      : (getEnvVar('HA_URL') && getEnvVar('HA_TOKEN'))
        ? 'Credentials configured but not connected'
        : 'Missing HA_URL or HA_TOKEN',
  }),
}
