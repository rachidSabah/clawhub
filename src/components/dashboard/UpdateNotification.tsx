'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Download, RefreshCw, CheckCircle, AlertTriangle, Clock, Settings, ArrowUpCircle, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UpdateInfo {
  updateAvailable: boolean
  remoteCommit?: string
  remoteMessage?: string
  remoteDate?: string
  currentVersion?: string
  currentCommit?: string
  lastCheckedAt?: string
  nextAutoCheckAt?: string
  autoUpdateEnabled: boolean
  checkIntervalMinutes: number
  backgroundCheckerRunning: boolean
}

interface UpdateStatus {
  isUpdating: boolean
  updateLog: string[]
}

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [updateLog, setUpdateLog] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Check for updates on mount and periodically
  const checkForUpdates = useCallback(async () => {
    setIsChecking(true)
    try {
      const res = await fetch('/api/updates/check')
      if (res.ok) {
        const data = await res.json()
        setUpdateInfo(prev => ({
          ...prev,
          updateAvailable: data.updateAvailable,
          remoteCommit: data.remoteCommit,
          remoteMessage: data.remoteMessage,
          remoteDate: data.remoteDate,
          currentVersion: data.currentVersion,
          currentCommit: data.currentCommit,
          lastCheckedAt: data.lastCheckedAt,
        }))
      }
    } catch {
      // ignore
    }
    setIsChecking(false)
  }, [])

  // Load settings on mount
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch('/api/updates/status')
        if (res.ok) {
          const data = await res.json()
          setUpdateInfo(data)
        }
      } catch {
        // ignore
      }
    }
    loadStatus()
    checkForUpdates()

    // Poll for update status every 5 minutes in the frontend
    const interval = setInterval(() => {
      loadStatus()
    }, 5 * 60000)

    return () => clearInterval(interval)
  }, [checkForUpdates])

  // Apply update
  const applyUpdate = async () => {
    setIsApplying(true)
    setUpdateLog(['Starting update...'])

    try {
      const res = await fetch('/api/updates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRestart: true }),
      })

      if (res.ok) {
        setUpdateLog(prev => [...prev, 'Update process initiated...'])
      } else {
        const data = await res.json()
        setUpdateLog(prev => [...prev, `Error: ${data.error || 'Unknown error'}`])
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      setUpdateLog(prev => [...prev, `Error: ${msg}`])
    }

    // Poll for update progress
    const progressInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/updates/status')
        if (res.ok) {
          const data = await res.json()
          if (!data.isUpdating) {
            setIsApplying(false)
            setUpdateLog(prev => [...prev, 'Update process complete. Restarting...'])
            clearInterval(progressInterval)
          }
        }
      } catch {
        // Server might be restarting
        setIsApplying(false)
        setUpdateLog(prev => [...prev, 'Server restarting...'])
        clearInterval(progressInterval)
      }
    }, 3000)
  }

  // Update settings
  const updateSettings = async (key: string, value: boolean | number) => {
    try {
      await fetch('/api/updates/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      setUpdateInfo(prev => prev ? { ...prev, [key]: value } : prev)
    } catch {
      // ignore
    }
  }

  if (!updateInfo) return null

  return (
    <AnimatePresence>
      {/* Update available banner */}
      {updateInfo.updateAvailable && !isApplying && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 pointer-events-none"
        >
          <Card className="pointer-events-auto border-emerald-500/50 bg-emerald-950/90 backdrop-blur shadow-lg shadow-emerald-500/20 max-w-lg">
            <CardContent className="p-3 flex items-center gap-3">
              <ArrowUpCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-100">
                  Update Available
                </p>
                <p className="text-xs text-emerald-300/70 truncate">
                  {updateInfo.remoteMessage || `Commit ${updateInfo.remoteCommit}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline"
                  className="h-7 text-xs border-emerald-500/50 text-emerald-300 hover:bg-emerald-800"
                  onClick={() => setShowDetails(!showDetails)}>
                  Details
                </Button>
                <Button size="sm"
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                  onClick={applyUpdate}>
                  <Download className="w-3 h-3 mr-1" />
                  Update Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Updating progress overlay */}
      {isApplying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        >
          <Card className="w-96 border-blue-500/50 bg-slate-950/95 shadow-lg shadow-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                Updating ClawHub...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 w-full rounded bg-black/40 p-2">
                {updateLog.map((log, i) => (
                  <p key={i} className="text-xs font-mono text-slate-300">{log}</p>
                ))}
              </ScrollArea>
              <p className="text-xs text-slate-500 mt-2">
                The application will restart automatically after the update completes.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Details panel */}
      {showDetails && !isApplying && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-16 right-4 z-50 w-80"
        >
          <Card className="border-border bg-card shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Update Settings</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                  onClick={() => setShowDetails(false)}>x</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current status */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {updateInfo.updateAvailable ? (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-400 text-[10px]">
                      Update Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-500 text-slate-400 text-[10px]">
                      Up to Date
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    v{updateInfo.currentVersion || '?'}
                  </Badge>
                </div>
                {updateInfo.lastCheckedAt && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last checked: {new Date(updateInfo.lastCheckedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Auto-update toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-update" className="text-xs">Auto-check for updates</Label>
                <Switch id="auto-update"
                  checked={updateInfo.autoUpdateEnabled}
                  onCheckedChange={(v) => updateSettings('autoUpdateEnabled', v)} />
              </div>

              {/* Check interval */}
              <div className="space-y-1">
                <Label className="text-xs">Check interval (minutes)</Label>
                <Input type="number" min={5} max={1440}
                  value={updateInfo.checkIntervalMinutes}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (v >= 5) updateSettings('checkIntervalMinutes', v)
                  }}
                  className="h-7 text-xs" />
              </div>

              {/* Check now button */}
              <Button variant="outline" size="sm" className="w-full h-7 text-xs"
                onClick={checkForUpdates} disabled={isChecking}>
                {isChecking ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Check Now
              </Button>

              {/* Update info */}
              {updateInfo.updateAvailable && (
                <div className="rounded bg-emerald-950/50 p-2 space-y-1">
                  <p className="text-xs font-medium text-emerald-400">New version available:</p>
                  <p className="text-[10px] text-emerald-300">
                    {updateInfo.remoteMessage || `Commit ${updateInfo.remoteCommit}`}
                  </p>
                  {updateInfo.remoteDate && (
                    <p className="text-[10px] text-emerald-300/50">
                      {new Date(updateInfo.remoteDate).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Background checker status */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {updateInfo.backgroundCheckerRunning ? (
                  <><CheckCircle className="w-3 h-3 text-emerald-400" /> Background checker running</>
                ) : (
                  <><AlertTriangle className="w-3 h-3 text-yellow-400" /> Background checker not running</>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
