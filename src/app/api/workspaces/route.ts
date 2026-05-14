import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const workspaces = await db.workspace.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Failed to fetch workspaces:', error)
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, directory, icon, color, isDefault, config } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    if (isDefault) {
      await db.workspace.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const workspace = await db.workspace.create({
      data: {
        name,
        description: description ?? null,
        directory: directory ?? null,
        icon: icon ?? null,
        color: color ?? null,
        isDefault: isDefault ?? false,
        config: config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null,
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Failed to create workspace:', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}
