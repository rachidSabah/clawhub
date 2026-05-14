// ============================================================================
// ClawHub Messaging Gateway — Shared Types
// ============================================================================

export interface PlatformStatus {
  platform: string
  connected: boolean
  info: string
}

export interface PlatformModule {
  name: string
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  sendMessage: (chatId: string, message: string) => Promise<void>
  getStatus: () => PlatformStatus
}

export interface IncomingMessage {
  platform: string
  chatId: string
  userId: string
  text: string
  timestamp: number
}

export interface GatewayConfig {
  port: number
  clawhubApiUrl: string
  allowedUserIds: string[]
  requireApproval: boolean
  approvalKeywords: string[]
}

export interface SendMessageRequest {
  platform: string
  chatId: string
  message: string
}

export interface HomeAssistantWebhook {
  event_type: string
  data: Record<string, unknown>
  source: string
}
