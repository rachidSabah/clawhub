import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const settings = await db.setting.findMany()

    // Convert to key-value object
    const result: Record<string, unknown> = {}
    for (const setting of settings) {
      try {
        result[setting.key] = JSON.parse(setting.value)
      } catch {
        result[setting.key] = setting.value
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be a JSON object with key-value pairs' },
        { status: 400 }
      )
    }

    const updates = Object.entries(body)
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No settings provided to update' },
        { status: 400 }
      )
    }

    // Use a transaction to update all settings atomically
    const operations = updates.map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      })
    )

    await db.$transaction(operations)

    // Return updated settings
    const settings = await db.setting.findMany()
    const result: Record<string, unknown> = {}
    for (const setting of settings) {
      try {
        result[setting.key] = JSON.parse(setting.value)
      } catch {
        result[setting.key] = setting.value
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
