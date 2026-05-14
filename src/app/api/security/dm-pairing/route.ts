import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — Return all paired DM users
export async function GET() {
  try {
    const pairings = await db.dmPairing.findMany({
      where: { isActive: true },
      orderBy: { addedAt: 'desc' },
    })

    return NextResponse.json({ pairings })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST — Pair a DM user
export async function POST(req: NextRequest) {
  try {
    const { platform, userId, displayName } = await req.json()

    if (!platform || !userId) {
      return NextResponse.json(
        { error: 'platform and userId are required' },
        { status: 400 }
      )
    }

    const validPlatforms = ['telegram', 'discord', 'slack', 'signal', 'whatsapp']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await db.dmPairing.findUnique({
      where: { platform_userId: { platform, userId } },
    })

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        await db.dmPairing.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            displayName: displayName ?? existing.displayName,
          },
        })
      }
      return NextResponse.json({ paired: true, userId })
    }

    await db.dmPairing.create({
      data: {
        platform,
        userId,
        displayName: displayName ?? null,
        isActive: true,
      },
    })

    // Also update the settings key 'dm_allowed_users'
    const existingSetting = await db.setting.findUnique({
      where: { key: 'dm_allowed_users' },
    })

    const users = existingSetting ? JSON.parse(existingSetting.value) as Array<{ platform: string; userId: string }> : []
    users.push({ platform, userId })

    if (existingSetting) {
      await db.setting.update({
        where: { key: 'dm_allowed_users' },
        data: { value: JSON.stringify(users) },
      })
    } else {
      await db.setting.create({
        data: {
          key: 'dm_allowed_users',
          value: JSON.stringify(users),
        },
      })
    }

    return NextResponse.json({ paired: true, userId })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE — Remove a DM user from allowed list
export async function DELETE(req: NextRequest) {
  try {
    const { platform, userId } = await req.json()

    if (!platform || !userId) {
      return NextResponse.json(
        { error: 'platform and userId are required' },
        { status: 400 }
      )
    }

    const existing = await db.dmPairing.findUnique({
      where: { platform_userId: { platform, userId } },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Pairing not found' },
        { status: 404 }
      )
    }

    await db.dmPairing.update({
      where: { id: existing.id },
      data: { isActive: false },
    })

    // Update settings
    const existingSetting = await db.setting.findUnique({
      where: { key: 'dm_allowed_users' },
    })

    if (existingSetting) {
      const users = JSON.parse(existingSetting.value) as Array<{ platform: string; userId: string }>
      const filtered = users.filter((u) => !(u.platform === platform && u.userId === userId))
      await db.setting.update({
        where: { key: 'dm_allowed_users' },
        data: { value: JSON.stringify(filtered) },
      })
    }

    return NextResponse.json({ removed: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
