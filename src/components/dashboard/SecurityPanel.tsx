'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { approveSecurityAction, pairDmUser, unpairDmUser } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, CheckCircle, XCircle, Clock, UserPlus, UserMinus, MessageSquare, AlertTriangle } from 'lucide-react'
import type { PendingApproval, DmPairing, DmPlatform } from '@/lib/types'

export function SecurityPanel() {
  const { pendingApprovals, loadPendingApprovals, dmPairings, loadDmPairings } = useAppStore()

  // DM pairing form
  const [dmPlatform, setDmPlatform] = useState<DmPlatform>('telegram')
  const [dmUserId, setDmUserId] = useState('')
  const [dmDisplayName, setDmDisplayName] = useState('')
  const [dmLoading, setDmLoading] = useState(false)

  useEffect(() => {
    loadPendingApprovals()
    loadDmPairings()
  }, [loadPendingApprovals, loadDmPairings])

  const handleApprove = async (actionId: string, approved: boolean) => {
    try {
      await approveSecurityAction(actionId, approved)
      loadPendingApprovals()
    } catch (e) {
      console.error('Approval failed:', e)
    }
  }

  const handlePairDm = async () => {
    if (!dmUserId.trim()) return
    setDmLoading(true)
    try {
      await pairDmUser(dmPlatform, dmUserId, dmDisplayName || undefined)
      setDmUserId('')
      setDmDisplayName('')
      loadDmPairings()
    } catch (e) {
      console.error('Pairing failed:', e)
    } finally {
      setDmLoading(false)
    }
  }

  const handleUnpair = async (platform: DmPlatform, userId: string) => {
    try {
      await unpairDmUser(platform, userId)
      loadDmPairings()
    } catch (e) {
      console.error('Unpairing failed:', e)
    }
  }

  const riskColors: Record<string, string> = {
    low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    high: 'bg-red-500/10 text-red-600 border-red-500/20',
  }

  const platformIcons: Record<string, string> = {
    telegram: '📨',
    discord: '🎮',
    slack: '💬',
    signal: '🔐',
    whatsapp: '📱',
  }

  return (
    <div className="p-3 space-y-4">
      {/* Pending Approvals */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <Badge variant="outline" className="text-[8px] h-4 px-1 bg-amber-500/10 text-amber-600">
                {pendingApprovals.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <ScrollArea className="max-h-48">
            {pendingApprovals.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4">
                No pending approvals
              </div>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.map((a: PendingApproval) => (
                  <div key={a.id} className="rounded-md border border-border p-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium">{a.type}</span>
                      <Badge variant="outline" className={`text-[8px] h-3.5 px-1 ${riskColors[a.riskLevel] || ''}`}>
                        {a.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{a.description}</p>
                    {a.requestedBy && (
                      <div className="text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {a.requestedBy}
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                        onClick={() => handleApprove(a.id, true)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] text-red-600 border-red-200 hover:bg-red-50 flex-1"
                        onClick={() => handleApprove(a.id, false)}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* DM Pairings */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            DM Allowed Users
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-3">
          {/* Pairing Form */}
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <select
                value={dmPlatform}
                onChange={(e) => setDmPlatform(e.target.value as DmPlatform)}
                className="h-7 text-[10px] rounded-md border border-border bg-background px-2"
              >
                <option value="telegram">Telegram</option>
                <option value="discord">Discord</option>
                <option value="slack">Slack</option>
                <option value="signal">Signal</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
              <Input
                placeholder="User ID"
                value={dmUserId}
                onChange={(e) => setDmUserId(e.target.value)}
                className="h-7 text-[10px] flex-1"
              />
            </div>
            <div className="flex gap-1.5">
              <Input
                placeholder="Display Name (optional)"
                value={dmDisplayName}
                onChange={(e) => setDmDisplayName(e.target.value)}
                className="h-7 text-[10px] flex-1"
              />
              <Button
                size="sm"
                className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handlePairDm}
                disabled={!dmUserId.trim() || dmLoading}
              >
                <UserPlus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Paired Users List */}
          <ScrollArea className="max-h-40">
            {dmPairings.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-3">
                No DM users paired yet
              </div>
            ) : (
              <div className="space-y-1">
                {dmPairings.map((p: DmPairing) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{platformIcons[p.platform] || '📡'}</span>
                      <div>
                        <div className="text-[10px] font-medium">{p.displayName || p.userId}</div>
                        <div className="text-[9px] text-muted-foreground">{p.platform} · {p.userId}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-red-500 hover:text-red-600"
                      onClick={() => handleUnpair(p.platform, p.userId)}
                    >
                      <UserMinus className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-muted/30 p-2 text-center">
              <div className="text-lg font-bold text-emerald-600">{pendingApprovals.length}</div>
              <div className="text-[9px] text-muted-foreground">Pending</div>
            </div>
            <div className="rounded-md bg-muted/30 p-2 text-center">
              <div className="text-lg font-bold text-emerald-600">{dmPairings.length}</div>
              <div className="text-[9px] text-muted-foreground">DM Users</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
