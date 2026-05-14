// ============================================================================
// Telegram Bot Platform Integration
// ============================================================================

import type { PlatformModule, PlatformStatus, IncomingMessage } from '../types'

let bot: any = null
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

export const telegramPlatform: PlatformModule = {
  name: 'Telegram',

  connect: async () => {
    const token = getEnvVar('TELEGRAM_BOT_TOKEN')
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set')
    }

    try {
      const TelegramBot = (await import('node-telegram-bot-api')).default
      bot = new TelegramBot(token, { polling: true })

      bot.on('message', (msg: any) => {
        if (!msg.text) return
        if (msg.text.startsWith('/')) {
          // Handle Telegram commands
          handleTelegramCommand(msg)
          return
        }

        if (onMessage) {
          onMessage({
            platform: 'telegram',
            chatId: String(msg.chat.id),
            userId: String(msg.from?.id),
            text: msg.text,
            timestamp: msg.date * 1000,
          })
        }
      })

      bot.on('polling_error', (error: Error) => {
        console.error('[Telegram] Polling error:', error.message)
      })

      isConnected = true
      console.log('[Telegram] Bot connected and polling')
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Telegram] Connection failed:', errMsg)
      throw error
    }
  },

  disconnect: async () => {
    if (bot) {
      try {
        await bot.stopPolling()
      } catch {
        // ignore
      }
      bot = null
    }
    isConnected = false
    console.log('[Telegram] Bot disconnected')
  },

  sendMessage: async (chatId: string, message: string) => {
    if (!bot) throw new Error('Telegram bot not connected')
    try {
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      // Fallback: send without markdown
      try {
        await bot.sendMessage(chatId, message)
      } catch {
        console.error('[Telegram] Failed to send message:', errMsg)
        throw new Error(`Telegram send failed: ${errMsg}`)
      }
    }
  },

  getStatus: (): PlatformStatus => ({
    platform: 'Telegram',
    connected: isConnected,
    info: isConnected
      ? 'Bot is polling for messages'
      : getEnvVar('TELEGRAM_BOT_TOKEN')
        ? 'Token configured but not connected'
        : 'No TELEGRAM_BOT_TOKEN set',
  }),
}

function handleTelegramCommand(msg: any) {
  if (!bot || !onMessage) return
  const chatId = String(msg.chat.id)
  const command = msg.text?.split(' ')[0] || ''
  const args = msg.text?.split(' ').slice(1).join(' ') || ''

  switch (command) {
    case '/start':
    case '/help':
      bot.sendMessage(chatId, [
        '🤖 *ClawHub AI Assistant*',
        '',
        'Available commands:',
        '/help - Show this help',
        '/status - Show platform status',
        '/agent <task> - Run an agent task',
        '/chat <message> - Chat with AI',
        '/clear - Clear conversation',
      ].join('\n'), { parse_mode: 'Markdown' })
      break
    case '/status':
      bot.sendMessage(chatId, '🟢 ClawHub Telegram bridge is active and running.')
      break
    case '/agent':
    case '/chat':
      onMessage({
        platform: 'telegram',
        chatId,
        userId: String(msg.from?.id),
        text: args || 'Hello',
        timestamp: msg.date * 1000,
      })
      break
    case '/clear':
      bot.sendMessage(chatId, '🗑️ Conversation cleared.')
      break
    default:
      bot.sendMessage(chatId, `Unknown command: ${command}. Type /help for available commands.`)
  }
}
