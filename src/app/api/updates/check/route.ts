// ============================================================================
// INFOHAS ClawHub — Auto-Update: Check for Updates
// ============================================================================
// GET /api/updates/check — Check GitHub for new commits
// ============================================================================

import { NextResponse } from 'next/server'

const GITHUB_REPO = 'rachidSabah/clawhub'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`

// In-memory update state
let updateState: {
  lastCheckedAt: string | null
  currentCommit: string | null
  remoteCommit: string | null
  remoteVersion: string | null
  updateAvailable: boolean
} = {
  lastCheckedAt: null,
  currentCommit: null,
  remoteCommit: null,
  remoteVersion: null,
  updateAvailable: false,
}

// Read current local commit
async function getCurrentCommit(): Promise<string | null> {
  try {
    const { execSync } = require('child_process')
    const hash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
    return hash
  } catch {
    return null
  }
}

// Read current version from package.json
function getCurrentVersion(): string {
  try {
    const pkg = require('../../../../../package.json')
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

// Fetch latest commit from GitHub API
async function fetchRemoteCommit(): Promise<{ sha: string; version: string; message: string; date: string } | null> {
  try {
    const res = await fetch(`${GITHUB_API}/commits/main`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ClawHub-AutoUpdate',
      },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const message: string = data.commit?.message || ''
    const versionMatch = message.match(/v?(\d+\.\d+\.\d+)/)
    return {
      sha: data.sha,
      version: versionMatch ? versionMatch[1] : getCurrentVersion(),
      message: message.split('\n')[0],
      date: data.commit?.committer?.date || new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// Fetch latest release from GitHub
async function fetchLatestRelease(): Promise<{ tag: string; name: string; url: string; publishedAt: string } | null> {
  try {
    const res = await fetch(`${GITHUB_API}/releases/latest`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ClawHub-AutoUpdate',
      },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      tag: data.tag_name,
      name: data.name,
      url: data.html_url,
      publishedAt: data.published_at,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// GET /api/updates/check
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const currentCommit = await getCurrentCommit()
    const currentVersion = getCurrentVersion()

    if (!updateState.currentCommit) {
      updateState.currentCommit = currentCommit
    }

    const remoteInfo = await fetchRemoteCommit()
    const releaseInfo = await fetchLatestRelease()

    if (remoteInfo) {
      updateState.remoteCommit = remoteInfo.sha
      updateState.remoteVersion = remoteInfo.version
      updateState.updateAvailable = currentCommit !== remoteInfo.sha
    }

    updateState.lastCheckedAt = new Date().toISOString()

    return NextResponse.json({
      currentVersion,
      currentCommit: currentCommit?.substring(0, 8),
      remoteCommit: remoteInfo?.sha?.substring(0, 8),
      remoteVersion: remoteInfo?.version,
      remoteMessage: remoteInfo?.message,
      remoteDate: remoteInfo?.date,
      updateAvailable: updateState.updateAvailable,
      latestRelease: releaseInfo,
      lastCheckedAt: updateState.lastCheckedAt,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
