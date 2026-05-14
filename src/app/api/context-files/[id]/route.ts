import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH — Update a context file
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const existing = await db.contextFile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Context file not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.path !== undefined) updateData.path = body.path
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.autoLoad !== undefined) updateData.autoLoad = body.autoLoad

    const file = await db.contextFile.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ file })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE — Delete a context file
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.contextFile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Context file not found' }, { status: 404 })
    }

    await db.contextFile.delete({ where: { id } })

    return NextResponse.json({ deleted: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
