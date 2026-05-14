// ============================================================================
// INFOHAS ClawHub — Security Middleware
// ============================================================================

import { existsSync, readFileSync } from 'fs'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Rate Limiter — in-memory sliding window
// ---------------------------------------------------------------------------

const rateLimitStore = new Map<string, { timestamps: number[] }>()

export function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const windowStart = now - windowMs

  const entry = rateLimitStore.get(identifier) ?? { timestamps: [] }

  // Prune expired timestamps
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)

  if (entry.timestamps.length >= maxRequests) {
    rateLimitStore.set(identifier, entry)
    const oldestInWindow = entry.timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + windowMs,
    }
  }

  entry.timestamps.push(now)
  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetAt: now + windowMs,
  }
}

// ---------------------------------------------------------------------------
// Approval Check — determines if an action needs explicit approval
// ---------------------------------------------------------------------------

const HIGH_RISK_ACTIONS = new Set([
  'shell-execute',
  'file-delete',
  'process-kill',
  'env-set',
  'port-scan',
  'api-call',
  'webhook-trigger',
  'email-send',
])

const MEDIUM_RISK_ACTIONS = new Set([
  'file-write',
  'code-execute',
  'npm-install',
  'schedule-task',
  'message-send',
  'agent-task',
])

export function requireApproval(
  actionType: string,
  riskLevel: 'low' | 'medium' | 'high'
): boolean {
  // High risk always requires approval
  if (riskLevel === 'high') return true
  // Medium risk requires approval unless auto-approved
  if (riskLevel === 'medium') return true
  // Low risk does not require approval unless it's a known dangerous action
  if (HIGH_RISK_ACTIONS.has(actionType)) return true
  if (MEDIUM_RISK_ACTIONS.has(actionType)) return true
  return false
}

// ---------------------------------------------------------------------------
// DM Permission Check — verifies if a DM user is allowed
// ---------------------------------------------------------------------------

export async function isDmAllowed(
  platform: string,
  userId: string
): Promise<boolean> {
  const pairing = await db.dmPairing.findUnique({
    where: { platform_userId: { platform, userId } },
  })
  return pairing?.isActive ?? false
}

// ---------------------------------------------------------------------------
// Input Sanitization — basic XSS and injection prevention
// ---------------------------------------------------------------------------

const SANITIZE_PATTERNS: [RegExp, string][] = [
  [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''],
  [/<\s*\/?\s*(script|iframe|object|embed|form|input)\b[^>]*>/gi, ''],
  [/javascript\s*:/gi, ''],
  [/on\w+\s*=\s*["'][^"']*["']/gi, ''],
  [/on\w+\s*=\s*\S+/gi, ''],
]

export function sanitizeInput(input: string): string {
  let sanitized = input
  for (const [pattern, replacement] of SANITIZE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement)
  }
  // Trim and limit length
  sanitized = sanitized.trim()
  if (sanitized.length > 100000) {
    sanitized = sanitized.substring(0, 100000)
  }
  return sanitized
}

// ---------------------------------------------------------------------------
// Container Isolation Check — detects if running in Docker/container
// ---------------------------------------------------------------------------

export function isContainerIsolated(): boolean {
  // Check for common container indicators
  if (typeof process === 'undefined') return false

  // Check for Docker-specific files
  try {
    if (existsSync('/.dockerenv')) return true
    // Check cgroup for container indicators
    try {
      const cgroup = readFileSync('/proc/1/cgroup', 'utf-8')
      if (cgroup.includes('docker') || cgroup.includes('containerd') || cgroup.includes('kubepods')) {
        return true
      }
    } catch {
      // /proc/1/cgroup not available — not in container
    }
  } catch {
    // fs not available
  }

  // Check environment variables
  if (process.env.CONTAINER === 'true' || process.env.DOCKER === 'true') {
    return true
  }

  return false
}

// ---------------------------------------------------------------------------
// Create Security Approval Request
// ---------------------------------------------------------------------------

export async function createApprovalRequest(data: {
  actionType: string
  description: string
  requestedBy?: string
  riskLevel: 'low' | 'medium' | 'high'
  metadata?: Record<string, unknown>
  expiresInMs?: number
}): Promise<{ id: string; needsApproval: boolean }> {
  const needsApproval = requireApproval(data.actionType, data.riskLevel)

  if (!needsApproval) {
    return { id: '', needsApproval: false }
  }

  const expiresAt = data.expiresInMs
    ? new Date(Date.now() + data.expiresInMs)
    : new Date(Date.now() + 5 * 60 * 1000) // default 5 min

  const approval = await db.securityApproval.create({
    data: {
      actionType: data.actionType,
      description: data.description,
      requestedBy: data.requestedBy,
      riskLevel: data.riskLevel,
      status: 'pending',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      expiresAt,
    },
  })

  return { id: approval.id, needsApproval: true }
}

// ---------------------------------------------------------------------------
// Check if Approval is Granted
// ---------------------------------------------------------------------------

export async function checkApproval(
  approvalId: string
): Promise<'pending' | 'approved' | 'denied' | 'expired'> {
  const approval = await db.securityApproval.findUnique({
    where: { id: approvalId },
  })

  if (!approval) return 'expired'

  // Check expiration
  if (approval.expiresAt && new Date() > approval.expiresAt) {
    await db.securityApproval.update({
      where: { id: approvalId },
      data: { status: 'expired' },
    })
    return 'expired'
  }

  return approval.status as 'pending' | 'approved' | 'denied' | 'expired'
}
