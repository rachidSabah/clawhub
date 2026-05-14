import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Skill id is required' },
        { status: 400 }
      )
    }

    const skill = await db.skill.findUnique({
      where: { id },
    })

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    const fileName = skill.fileName ?? `${skill.name.toLowerCase().replace(/\s+/g, '-')}.md`

    return new NextResponse(skill.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Failed to export skill:', error)
    return NextResponse.json(
      { error: 'Failed to export skill' },
      { status: 500 }
    )
  }
}
