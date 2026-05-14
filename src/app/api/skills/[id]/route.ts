import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const skill = await db.skill.findUnique({
      where: { id },
    })

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(skill)
  } catch (error) {
    console.error('Failed to fetch skill:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skill' },
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

    const existing = await db.skill.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, content, category, isActive } = body

    const validCategories = ['coding', 'writing', 'analysis', 'general']
    if (category !== undefined && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (content !== undefined) data.content = content
    if (category !== undefined) data.category = category
    if (isActive !== undefined) data.isActive = isActive

    const skill = await db.skill.update({
      where: { id },
      data,
    })

    return NextResponse.json(skill)
  } catch (error) {
    console.error('Failed to update skill:', error)
    return NextResponse.json(
      { error: 'Failed to update skill' },
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

    const existing = await db.skill.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    if (existing.isBuiltin) {
      return NextResponse.json(
        { error: 'Cannot delete built-in skills' },
        { status: 403 }
      )
    }

    await db.skill.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete skill:', error)
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    )
  }
}
