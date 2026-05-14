'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  MessageCircle,
  QrCode,
  RefreshCw,
  Send,
  Unplug,
  Phone,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
} from 'lucide-react'

interface WhatsAppStatus {
  connected: boolean
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'offline'
  sessions: number
  sessionList: Array<{ chatId: string; conversationId: string }>
  error?: string
}

interface QRData {
  status: string
  qr?: string
  message?: string
}

export function WhatsAppPanel() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    status: 'offline',
    sessions: 0,
    sessionList: [],
  })
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [loading, setLoading] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('')

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      } else {
        setStatus({ connected: false, status: 'offline', sessions: 0, sessionList: [] })
      }
    } catch {
      setStatus({ connected: false, status: 'offline', sessions: 0, sessionList: [] })
    }
  }, [])

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qr' }),
      })
      if (res.ok) {
        const data = await res.json()
        setQrData(data)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  // When connecting, poll QR code
  useEffect(() => {
    if (status.status === 'connecting') {
      fetchQR()
      const interval = setInterval(fetchQR, 3000)
      return () => clearInterval(interval)
    }
  }, [status.status, fetchQR])

  const handleConnect = async () => {
    setLoading(true)
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      })
      // Wait a bit then refresh status
      setTimeout(() => {
        fetchStatus()
        fetchQR()
        setLoading(false)
      }, 2000)
    } catch {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      await fetchStatus()
      setQrData(null)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleSendTest = async () => {
    if (!testPhone || !testMessage) return
    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          chatId: testPhone,
          message: testMessage,
        }),
      })
      setTestMessage('')
    } catch {
      // ignore
    }
  }

  const statusIcon = () => {
    switch (status.status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      case 'connecting':
        return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />
      default:
        return <XCircle className="w-5 h-5 text-muted-foreground" />
    }
  }

  const statusLabel = () => {
    switch (status.status) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Error'
      case 'offline': return 'Bridge Offline'
      default: return 'Disconnected'
    }
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">WhatsApp Bridge</span>
          </div>
          <div className="flex items-center gap-2">
            {statusIcon()}
            <Badge
              variant={status.connected ? 'default' : 'outline'}
              className={cn(
                'text-[10px] h-5',
                status.connected && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              )}
            >
              {statusLabel()}
            </Badge>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Connect your WhatsApp account to chat with Hermes AI from your phone. No Meta Business API required — uses WhatsApp Web protocol.
        </p>

        {status.status === 'offline' && (
          <div className="rounded-lg bg-amber-500/10 text-amber-600 text-xs p-3">
            WhatsApp bridge service is not running. Start it with: <code className="bg-background/50 px-1.5 py-0.5 rounded text-[11px]">cd mini-services/whatsapp-bridge && npm start</code>
          </div>
        )}

        {/* QR Code Section */}
        {status.status === 'connecting' && qrData?.qr && (
          <div className="flex flex-col items-center gap-3 py-3">
            <div className="bg-white p-4 rounded-xl">
              <QrCode className="w-48 h-48 text-black" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!status.connected && status.status !== 'connecting' && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConnect}
              disabled={loading || status.status === 'offline'}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
              Connect WhatsApp
            </Button>
          )}
          {status.connected && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unplug className="w-3.5 h-3.5" />}
              Disconnect
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => { fetchStatus(); fetchQR(); }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      {status.connected && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium">Active Sessions</span>
            <Badge variant="outline" className="text-[10px] h-5">
              {status.sessions}
            </Badge>
          </div>

          {status.sessionList?.length > 0 ? (
            <div className="space-y-1.5">
              {status.sessionList.map((session, i) => (
                <div key={session.chatId} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
                  <span className="truncate flex-1">{session.chatId}</span>
                  <Badge variant="outline" className="text-[9px] h-4 ml-2">
                    {session.conversationId.substring(0, 8)}...
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No active WhatsApp sessions yet. Send a message to Hermes AI on WhatsApp to start.
            </p>
          )}
        </div>
      )}

      {/* Send Test Message */}
      {status.connected && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Send Test Message</span>
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+1234567890"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message</Label>
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Hello from Hermes!"
                className="h-8 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleSendTest()}
              />
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleSendTest}
              disabled={!testPhone || !testMessage}
            >
              <Send className="w-3 h-3" />
              Send
            </Button>
          </div>
        </div>
      )}

      {/* Quick Commands Reference */}
      <div className="rounded-xl border border-border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-cyan-500" />
          <span className="text-sm font-medium">WhatsApp Commands</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Send these commands from WhatsApp to control the agent:
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            ['/help', 'Show all commands'],
            ['/agent', 'Switch to Agent mode'],
            ['/chat', 'Switch to Chat mode'],
            ['/model name', 'Change AI model'],
            ['/clear', 'Clear conversation'],
            ['/status', 'System status'],
            ['/providers', 'List providers'],
          ].map(([cmd, desc]) => (
            <div key={cmd} className="flex items-center gap-1.5">
              <code className="bg-muted/50 px-1.5 py-0.5 rounded text-[11px] font-mono">{cmd}</code>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
