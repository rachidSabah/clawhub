// ============================================================================
// INFOHAS ClawHub — Auto-Update: Apply Updates
// ============================================================================
// POST /api/updates/apply — Pull latest from GitHub, rebuild, restart
// ============================================================================

import { NextResponse } from 'next/server'

// In-memory update state
const updateLog: string[] = []
let isUpdating = false

function log(msg: string) {
  const ts = new Date().toISOString().substring(11, 19)
  updateLog.push(`[${ts}] ${msg}`)
  if (updateLog.length > 100) updateLog.shift()
}

// ---------------------------------------------------------------------------
// POST /api/updates/apply
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  if (isUpdating) {
    return NextResponse.json({ error: 'Update already in progress', updateLog }, { status: 409 })
  }

  const body = await request.json().catch(() => ({}))
  const { autoRestart = true } = body

  isUpdating = true
  log('Starting update process...')

  // Run update asynchronously
  ;(async () => {
    const { execSync } = require('child_process')

    try {
      // Step 1: Stash any local changes
      log('Stashing local changes...')
      try {
        execSync('git stash', { encoding: 'utf-8', timeout: 30000 })
        log('Local changes stashed')
      } catch {
        log('No local changes to stash')
      }

      // Step 2: Fetch latest from GitHub
      log('Fetching latest from GitHub...')
      execSync('git fetch origin main', { encoding: 'utf-8', timeout: 60000 })
      log('Fetch complete')

      // Step 3: Pull and merge
      log('Pulling latest changes...')
      execSync('git reset --hard origin/main', { encoding: 'utf-8', timeout: 60000 })
      log('Code updated successfully')

      // Step 4: Pop stash if any
      try {
        execSync('git stash pop', { encoding: 'utf-8', timeout: 30000 })
        log('Restored local changes')
      } catch {
        log('No stashed changes to restore')
      }

      // Step 5: Install dependencies
      log('Installing dependencies...')
      execSync('npm install --legacy-peer-deps', { encoding: 'utf-8', timeout: 180000 })
      log('Dependencies installed')

      // Step 6: Install mini-service dependencies
      const services = ['agent-ws', 'whatsapp-bridge', 'messaging-gateway']
      for (const svc of services) {
        try {
          log(`Installing deps for ${svc}...`)
          execSync(`cd mini-services/${svc} && npm install --legacy-peer-deps`, { encoding: 'utf-8', timeout: 120000 })
        } catch {
          log(`Warning: Could not install deps for ${svc}`)
        }
      }

      // Step 7: Generate Prisma client
      log('Generating Prisma client...')
      execSync('npx prisma generate', { encoding: 'utf-8', timeout: 60000 })
      log('Prisma client generated')

      // Step 8: Push database schema
      log('Updating database schema...')
      execSync('npx prisma db push', { encoding: 'utf-8', timeout: 60000 })
      log('Database schema updated')

      // Step 9: Build production app
      log('Building production application...')
      execSync('npm run build', { encoding: 'utf-8', timeout: 300000 })
      log('Build complete!')

      // Step 10: Restart (if auto-restart enabled)
      if (autoRestart) {
        log('Scheduling restart in 3 seconds...')
        setTimeout(() => {
          try {
            if (process.env.NODE_ENV === 'production') {
              process.exit(0) // Container/PM2 will auto-restart
            } else {
              log('Dev mode: please restart manually with npm run dev')
            }
          } catch {
            // ignore
          }
        }, 3000)
      }

      log('Update completed successfully!')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      log(`Update FAILED: ${msg}`)
    } finally {
      isUpdating = false
    }
  })()

  return NextResponse.json({
    status: 'updating',
    message: 'Update process started. Check /api/updates/status for progress.',
    updateLog: updateLog.slice(-10),
  })
}
