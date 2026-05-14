import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const plugin = await db.plugin.findUnique({
      where: { id },
    })

    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(plugin)
  } catch (error) {
    console.error('Failed to fetch plugin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugin' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.plugin.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, version, author, repoUrl, entryPoint, isActive, isInstalled, config } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (version !== undefined) data.version = version
    if (author !== undefined) data.author = author
    if (repoUrl !== undefined) data.repoUrl = repoUrl
    if (entryPoint !== undefined) data.entryPoint = entryPoint
    if (isActive !== undefined) data.isActive = isActive
    if (isInstalled !== undefined) data.isInstalled = isInstalled
    if (config !== undefined) {
      data.config = typeof config === 'string' ? config : JSON.stringify(config)
    }

    const plugin = await db.plugin.update({
      where: { id },
      data,
    })

    return NextResponse.json(plugin)
  } catch (error) {
    console.error('Failed to update plugin:', error)
    return NextResponse.json(
      { error: 'Failed to update plugin' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.plugin.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      )
    }

    await db.plugin.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete plugin:', error)
    return NextResponse.json(
      { error: 'Failed to delete plugin' },
      { status: 500 }
    )
  }
}
