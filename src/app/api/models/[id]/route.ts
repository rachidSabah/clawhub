import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.isDefault) {
      await db.modelConfig.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const model = await db.modelConfig.update({ where: { id }, data: body })
    return NextResponse.json(model)
  } catch (error) {
    console.error('Failed to update model config:', error)
    return NextResponse.json({ error: 'Failed to update model config' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.modelConfig.delete({ where: { id } })
    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    console.error('Failed to delete model config:', error)
    return NextResponse.json({ error: 'Failed to delete model config' }, { status: 500 })
  }
}
