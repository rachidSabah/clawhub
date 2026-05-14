// ============================================================================
// Discord Bot Platform Integration
// ============================================================================

import type { PlatformModule, PlatformStatus, IncomingMessage } from '../types'

let client: any = null
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

export const discordPlatform: PlatformModule = {
  name: 'Discord',

  connect: async () => {
    const token = getEnvVar('DISCORD_BOT_TOKEN')
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN environment variable is not set')
    }

    try {
      const { Client, GatewayIntentBits } = await import('discord.js')
      client = new Client({
        intents: [
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMessages,
        ],
      })

      client.on('ready', () => {
        isConnected = true
        console.log(`[Discord] Bot logged in as ${client.user?.tag}`)
      })

      client.on('messageCreate', (message: any) => {
        // Ignore bot messages
        if (message.author.bot) return

        // Only respond to DMs or @mentions
        const isDM = !message.guild
        const isMention = message.mentions.has(client.user?.id)

        if (!isDM && !isMention) return

        // Clean the message text (remove bot mention)
        let text = message.content
        if (isMention) {
          text = text.replace(/<@!?\d+>/g, '').trim()
        }

        // Handle Discord commands
        if (text.startsWith('/')) {
          handleDiscordCommand(message, text)
          return
        }

        if (onMessage && text) {
          onMessage({
            platform: 'discord',
            chatId: message.channelId,
            userId: message.author.id,
            text,
            timestamp: message.createdTimestamp,
          })
        }
      })

      client.on('error', (error: Error) => {
        console.error('[Discord] Client error:', error.message)
      })

      await client.login(token)
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Discord] Connection failed:', errMsg)
      throw error
    }
  },

  disconnect: async () => {
    if (client) {
      try {
        client.destroy()
      } catch {
        // ignore
      }
      client = null
    }
    isConnected = false
    console.log('[Discord] Bot disconnected')
  },

  sendMessage: async (chatId: string, message: string) => {
    if (!client) throw new Error('Discord bot not connected')
    try {
      const channel = await client.channels.fetch(chatId)
      if (channel && channel.isTextBased()) {
        // Discord has a 2000 char limit
        if (message.length > 1900) {
          const chunks = []
          for (let i = 0; i < message.length; i += 1900) {
            chunks.push(message.slice(i, i + 1900))
          }
          for (const chunk of chunks) {
            await channel.send(chunk)
          }
        } else {
          await channel.send(message)
        }
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Discord] Failed to send message:', errMsg)
      throw new Error(`Discord send failed: ${errMsg}`)
    }
  },

  getStatus: (): PlatformStatus => ({
    platform: 'Discord',
    connected: isConnected,
    info: isConnected
      ? `Logged in as ${client?.user?.tag || 'Unknown'}`
      : getEnvVar('DISCORD_BOT_TOKEN')
        ? 'Token configured but not connected'
        : 'No DISCORD_BOT_TOKEN set',
  }),
}

function handleDiscordCommand(message: any, text: string) {
  const parts = text.split(' ')
  const command = parts[0]
  const args = parts.slice(1).join(' ')

  switch (command) {
    case '/help':
      message.reply([
        '🤖 **ClawHub AI Assistant**',
        '',
        'Available commands:',
        '/help - Show this help',
        '/status - Show platform status',
        '/agent <task> - Run an agent task',
        '/chat <message> - Chat with AI',
      ].join('\n'))
      break
    case '/status':
      message.reply('🟢 ClawHub Discord bridge is active and running.')
      break
    case '/agent':
    case '/chat':
      if (onMessage) {
        onMessage({
          platform: 'discord',
          chatId: message.channelId,
          userId: message.author.id,
          text: args || 'Hello',
          timestamp: message.createdTimestamp,
        })
      }
      break
    default:
      message.reply(`Unknown command: ${command}. Type /help for available commands.`)
  }
}
