import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const plugins = await db.plugin.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(plugins)
  } catch (error) {
    console.error('Failed to fetch plugins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugins' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, version, author, repoUrl, entryPoint, config } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const plugin = await db.plugin.create({
      data: {
        name,
        description: description ?? null,
        version: version ?? '1.0.0',
        author: author ?? null,
        repoUrl: repoUrl ?? null,
        entryPoint: entryPoint ?? null,
        config: config !== undefined
          ? typeof config === 'string'
            ? config
            : JSON.stringify(config)
          : null,
      },
    })

    return NextResponse.json(plugin, { status: 201 })
  } catch (error) {
    console.error('Failed to create plugin:', error)
    return NextResponse.json(
      { error: 'Failed to create plugin' },
      { status: 500 }
    )
  }
}
