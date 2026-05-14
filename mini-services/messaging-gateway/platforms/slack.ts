// ============================================================================
// Slack Bolt Platform Integration
// ============================================================================

import type { PlatformModule, PlatformStatus, IncomingMessage } from '../types'

let app: any = null
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

export const slackPlatform: PlatformModule = {
  name: 'Slack',

  connect: async () => {
    const botToken = getEnvVar('SLACK_BOT_TOKEN')
    const signingSecret = getEnvVar('SLACK_SIGNING_SECRET')
    if (!botToken || !signingSecret) {
      throw new Error('SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET environment variables are required')
    }

    try {
      const { App } = await import('@slack/bolt')

      app = new App({
        token: botToken,
        signingSecret,
        // Socket Mode for easier setup (no public URL needed)
        socketMode: !!getEnvVar('SLACK_APP_TOKEN'),
        appToken: getEnvVar('SLACK_APP_TOKEN'),
      })

      // Handle direct messages
      app.message(async ({ message, say }: any) => {
        // Skip bot messages and messages with subtypes
        if (message.subtype || message.bot_id) return

        if (onMessage) {
          onMessage({
            platform: 'slack',
            chatId: message.channel,
            userId: message.user,
            text: message.text,
            timestamp: parseFloat(message.ts) * 1000,
          })
        }
      })

      // Handle slash commands
      app.command('/clawhub', async ({ command, ack, respond }: any) => {
        await ack()

        const text = command.text
        if (!text || text === 'help') {
          await respond([
            '🤖 *ClawHub AI Assistant*',
            '',
            'Available commands:',
            '`/clawhub help` - Show this help',
            '`/clawhub status` - Show platform status',
            '`/clawhub agent <task>` - Run an agent task',
            '`/clawhub chat <message>` - Chat with AI',
          ].join('\n'))
          return
        }

        if (text === 'status') {
          await respond('🟢 ClawHub Slack bridge is active and running.')
          return
        }

        if (onMessage) {
          onMessage({
            platform: 'slack',
            chatId: command.channel_id,
            userId: command.user_id,
            text: text.replace(/^(agent|chat)\s+/, ''),
            timestamp: Date.now(),
          })
        }
      })

      await app.start()
      isConnected = true
      console.log('[Slack] Bolt app started')
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Slack] Connection failed:', errMsg)
      throw error
    }
  },

  disconnect: async () => {
    if (app) {
      try {
        await app.stop()
      } catch {
        // ignore
      }
      app = null
    }
    isConnected = false
    console.log('[Slack] Bolt app stopped')
  },

  sendMessage: async (chatId: string, message: string) => {
    if (!app) throw new Error('Slack app not connected')
    try {
      const { WebClient } = await import('@slack/web-api')
      const token = getEnvVar('SLACK_BOT_TOKEN')
      const web = new WebClient(token)

      // Slack has a 40000 char limit for posts, but 3000 for messages
      if (message.length > 2900) {
        const chunks = []
        for (let i = 0; i < message.length; i += 2900) {
          chunks.push(message.slice(i, i + 2900))
        }
        for (const chunk of chunks) {
          await web.chat.postMessage({
            channel: chatId,
            text: chunk,
          })
        }
      } else {
        await web.chat.postMessage({
          channel: chatId,
          text: message,
        })
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Slack] Failed to send message:', errMsg)
      throw new Error(`Slack send failed: ${errMsg}`)
    }
  },

  getStatus: (): PlatformStatus => ({
    platform: 'Slack',
    connected: isConnected,
    info: isConnected
      ? 'Bolt app is running'
      : (getEnvVar('SLACK_BOT_TOKEN') && getEnvVar('SLACK_SIGNING_SECRET'))
        ? 'Credentials configured but not connected'
        : 'Missing SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET',
  }),
}
