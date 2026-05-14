import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — List all context files
export async function GET() {
  try {
    const files = await db.contextFile.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ files })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST — Create a new context file
export async function POST(req: NextRequest) {
  try {
    const { name, path, content, category, autoLoad } = await req.json()

    if (!name || !path || content === undefined) {
      return NextResponse.json(
        { error: 'name, path, and content are required' },
        { status: 400 }
      )
    }

    const validCategories = ['project', 'persona', 'instructions', 'custom']
    const fileCategory = validCategories.includes(category) ? category : 'project'

    const file = await db.contextFile.create({
      data: {
        name,
        path,
        content,
        category: fileCategory,
        autoLoad: autoLoad !== undefined ? autoLoad : true,
        isActive: true,
      },
    })

    return NextResponse.json({ file })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
