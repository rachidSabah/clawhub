import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface PlatformStatus {
  platform: string
  connected: boolean
  info: string
}

export async function GET() {
  try {
    // Check messaging platform connection statuses
    const platforms: PlatformStatus[] = []

    // Read messaging-related settings from DB
    const settings = await db.setting.findMany()
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }

    // Check Telegram
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN || settingsMap['telegramBotToken']
    platforms.push({
      platform: 'Telegram',
      connected: !!telegramToken,
      info: telegramToken ? 'Bot token configured' : 'No bot token found. Set TELEGRAM_BOT_TOKEN env var.',
    })

    // Check Discord
    const discordToken = process.env.DISCORD_BOT_TOKEN || settingsMap['discordBotToken']
    platforms.push({
      platform: 'Discord',
      connected: !!discordToken,
      info: discordToken ? 'Bot token configured' : 'No bot token found. Set DISCORD_BOT_TOKEN env var.',
    })

    // Check Slack
    const slackBotToken = process.env.SLACK_BOT_TOKEN || settingsMap['slackBotToken']
    const slackSigningSecret = process.env.SLACK_SIGNING_SECRET || settingsMap['slackSigningSecret']
    platforms.push({
      platform: 'Slack',
      connected: !!(slackBotToken && slackSigningSecret),
      info: (slackBotToken && slackSigningSecret)
        ? 'Bot token and signing secret configured'
        : 'Missing SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET env var.',
    })

    // Check Signal
    const signalPhone = process.env.SIGNAL_PHONE_NUMBER || settingsMap['signalPhoneNumber']
    platforms.push({
      platform: 'Signal',
      connected: !!signalPhone,
      info: signalPhone
        ? 'Phone number configured'
        : 'No phone number found. Set SIGNAL_PHONE_NUMBER env var. Requires signal-cli REST API.',
    })

    // Check WhatsApp
    const whatsappEnabled = settingsMap['whatsappEnabled'] === 'true'
    platforms.push({
      platform: 'WhatsApp',
      connected: whatsappEnabled,
      info: whatsappEnabled
        ? 'WhatsApp bridge enabled (Web.js)'
        : 'WhatsApp bridge not enabled. Enable in Settings > WhatsApp.',
    })

    // Check Home Assistant
    const haUrl = process.env.HA_URL || settingsMap['homeAssistantUrl']
    const haToken = process.env.HA_TOKEN || settingsMap['homeAssistantToken']
    platforms.push({
      platform: 'Home Assistant',
      connected: !!(haUrl && haToken),
      info: (haUrl && haToken)
        ? `Connected to ${haUrl}`
        : 'Missing HA_URL or HA_TOKEN env var.',
    })

    const connectedCount = platforms.filter(p => p.connected).length

    return NextResponse.json({
      platforms,
      summary: {
        total: platforms.length,
        connected: connectedCount,
        disconnected: platforms.length - connectedCount,
      },
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[messaging/status] Error:', errMsg)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
