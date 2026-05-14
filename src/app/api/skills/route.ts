import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const skills = await db.skill.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(skills)
  } catch (error) {
    console.error('Failed to fetch skills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, content, category, fileName } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const validCategories = ['coding', 'writing', 'analysis', 'general']
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    const skill = await db.skill.create({
      data: {
        name,
        description: description ?? null,
        content,
        category: category ?? 'general',
        fileName: fileName ?? null,
      },
    })

    return NextResponse.json(skill, { status: 201 })
  } catch (error) {
    console.error('Failed to create skill:', error)
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    )
  }
}
