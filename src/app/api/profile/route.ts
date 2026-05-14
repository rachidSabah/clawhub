import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — Return the active user profile with preferences, SOUL.md content
export async function GET() {
  try {
    let profile = await db.userProfile.findFirst({
      where: { isActive: true },
      orderBy: { lastActiveAt: 'desc' },
    })

    // Create a default profile if none exists
    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          name: 'User',
          preferences: JSON.stringify({
            theme: 'system',
            language: 'en',
            defaultModel: '',
          }),
          soulMd: null,
          contextFiles: null,
          homeDir: null,
          isActive: true,
        },
      })
    }

    // Parse JSON fields
    const result = {
      ...profile,
      preferences: profile.preferences ? JSON.parse(profile.preferences) : {},
      contextFiles: profile.contextFiles ? JSON.parse(profile.contextFiles) : [],
    }

    return NextResponse.json({ profile: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH — Update user profile: name, preferences, soulMd, homeDir
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, preferences, soulMd, homeDir, contextFiles } = body

    let profile = await db.userProfile.findFirst({
      where: { isActive: true },
    })

    if (!profile) {
      // Create if doesn't exist
      profile = await db.userProfile.create({
        data: {
          name: name ?? 'User',
          preferences: preferences ? JSON.stringify(preferences) : null,
          soulMd: soulMd ?? null,
          homeDir: homeDir ?? null,
          contextFiles: contextFiles ? JSON.stringify(contextFiles) : null,
          isActive: true,
          lastActiveAt: new Date(),
        },
      })
    } else {
      const updateData: Record<string, unknown> = {
        lastActiveAt: new Date(),
      }
      if (name !== undefined) updateData.name = name
      if (preferences !== undefined) updateData.preferences = JSON.stringify(preferences)
      if (soulMd !== undefined) updateData.soulMd = soulMd
      if (homeDir !== undefined) updateData.homeDir = homeDir
      if (contextFiles !== undefined) updateData.contextFiles = JSON.stringify(contextFiles)

      profile = await db.userProfile.update({
        where: { id: profile.id },
        data: updateData,
      })
    }

    const result = {
      ...profile,
      preferences: profile.preferences ? JSON.parse(profile.preferences) : {},
      contextFiles: profile.contextFiles ? JSON.parse(profile.contextFiles) : [],
    }

    return NextResponse.json({ profile: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
