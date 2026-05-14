// ============================================================================
// INFOHAS ClawHub — Auto-Update: Status & Settings
// ============================================================================
// GET /api/updates/status — Get current update status and log
// PATCH /api/updates/settings — Update auto-update settings
// ============================================================================

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// In-memory state
let autoUpdateEnabled = true
let checkIntervalMinutes = 60
let lastAutoCheckAt: string | null = null
let nextAutoCheckAt: string | null = null

// Background check interval (server-side)
let checkTimer: ReturnType<typeof setInterval> | null = null

async function loadSettingsFromDb() {
  try {
    const enabledSetting = await prisma.setting.findUnique({ where: { key: 'auto_update_enabled' } })
    const intervalSetting = await prisma.setting.findUnique({ where: { key: 'auto_update_interval_minutes' } })
    if (enabledSetting) autoUpdateEnabled = enabledSetting.value === 'true'
    if (intervalSetting) checkIntervalMinutes = parseInt(intervalSetting.value, 10) || 60
  } catch {
    // DB not ready, use defaults
  }
}

async function saveSettingsToDb() {
  try {
    await prisma.setting.upsert({
      where: { key: 'auto_update_enabled' },
      update: { value: String(autoUpdateEnabled) },
      create: { key: 'auto_update_enabled', value: String(autoUpdateEnabled) },
    })
    await prisma.setting.upsert({
      where: { key: 'auto_update_interval_minutes' },
      update: { value: String(checkIntervalMinutes) },
      create: { key: 'auto_update_interval_minutes', value: String(checkIntervalMinutes) },
    })
  } catch {
    // DB not ready, settings kept in memory
  }
}

// Perform a background check against GitHub
async function performBackgroundCheck() {
  try {
    lastAutoCheckAt = new Date().toISOString()

    const { execSync } = require('child_process')
    let currentCommit = ''
    try {
      currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
    } catch {
      // Not in a git repo (e.g., Docker standalone)
      return
    }

    const GITHUB_API = 'https://api.github.com/repos/rachidSabah/clawhub'
    const res = await fetch(`${GITHUB_API}/commits/main`, {
      headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'ClawHub-AutoUpdate' },
      next: { revalidate: 0 },
    })

    if (res.ok) {
      const data = await res.json()
      const remoteCommit = data.sha
      const updateAvailable = currentCommit !== remoteCommit

      // Store update availability in settings for the frontend to pick up
      await prisma.setting.upsert({
        where: { key: 'update_available' },
        update: { value: String(updateAvailable) },
        create: { key: 'update_available', value: String(updateAvailable) },
      })

      if (updateAvailable) {
        await prisma.setting.upsert({
          where: { key: 'update_remote_commit' },
          update: { value: remoteCommit.substring(0, 8) },
          create: { key: 'update_remote_commit', value: remoteCommit.substring(0, 8) },
        })
        await prisma.setting.upsert({
          where: { key: 'update_remote_message' },
          update: { value: (data.commit?.message || '').split('\n')[0] },
          create: { key: 'update_remote_message', value: (data.commit?.message || '').split('\n')[0] },
        })
        await prisma.setting.upsert({
          where: { key: 'update_remote_date' },
          update: { value: data.commit?.committer?.date || '' },
          create: { key: 'update_remote_date', value: data.commit?.committer?.date || '' },
        })
      }
    }

    nextAutoCheckAt = new Date(Date.now() + checkIntervalMinutes * 60000).toISOString()
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[AutoUpdate] Background check failed:', msg)
    nextAutoCheckAt = new Date(Date.now() + checkIntervalMinutes * 60000).toISOString()
  }
}

// Start the background checker
function startBackgroundChecker() {
  if (checkTimer) clearInterval(checkTimer)

  if (autoUpdateEnabled) {
    const intervalMs = Math.max(checkIntervalMinutes * 60000, 5 * 60000) // minimum 5 minutes
    checkTimer = setInterval(performBackgroundCheck, intervalMs)

    // Also check 30 seconds after server start
    setTimeout(performBackgroundCheck, 30000)

    nextAutoCheckAt = new Date(Date.now() + checkIntervalMinutes * 60000).toISOString()
    console.log(`[AutoUpdate] Background checker started, checking every ${checkIntervalMinutes} minutes`)
  } else {
    console.log('[AutoUpdate] Background checker disabled')
  }
}

// ---------------------------------------------------------------------------
// GET /api/updates/status
// ---------------------------------------------------------------------------
export async function GET() {
  await loadSettingsFromDb()

  // Get update availability from DB (set by background checker)
  let updateAvailable = false
  let remoteCommit = ''
  let remoteMessage = ''
  let remoteDate = ''

  try {
    const ua = await prisma.setting.findUnique({ where: { key: 'update_available' } })
    const rc = await prisma.setting.findUnique({ where: { key: 'update_remote_commit' } })
    const rm = await prisma.setting.findUnique({ where: { key: 'update_remote_message' } })
    const rd = await prisma.setting.findUnique({ where: { key: 'update_remote_date' } })
    updateAvailable = ua?.value === 'true'
    remoteCommit = rc?.value || ''
    remoteMessage = rm?.value || ''
    remoteDate = rd?.value || ''
  } catch {
    // DB not ready
  }

  return NextResponse.json({
    autoUpdateEnabled,
    checkIntervalMinutes,
    lastAutoCheckAt,
    nextAutoCheckAt,
    updateAvailable,
    remoteCommit,
    remoteMessage,
    remoteDate,
    backgroundCheckerRunning: checkTimer !== null,
  })
}

// ---------------------------------------------------------------------------
// PATCH /api/updates/settings
// ---------------------------------------------------------------------------
export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    if (typeof body.autoUpdateEnabled === 'boolean') {
      autoUpdateEnabled = body.autoUpdateEnabled
    }
    if (typeof body.checkIntervalMinutes === 'number' && body.checkIntervalMinutes >= 5) {
      checkIntervalMinutes = body.checkIntervalMinutes
    }

    await saveSettingsToDb()
    startBackgroundChecker() // Restart the timer with new settings

    return NextResponse.json({
      autoUpdateEnabled,
      checkIntervalMinutes,
      lastAutoCheckAt,
      nextAutoCheckAt,
      message: 'Auto-update settings saved',
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Initialize the background checker on first load
loadSettingsFromDb().then(() => {
  startBackgroundChecker()
})
