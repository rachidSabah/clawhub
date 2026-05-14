import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — Returns all autoLoad=true context files concatenated as system context for AI
export async function GET() {
  try {
    const files = await db.contextFile.findMany({
      where: {
        autoLoad: true,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (files.length === 0) {
      return NextResponse.json({
        context: '',
        fileCount: 0,
        files: [],
      })
    }

    // Concatenate all files with clear delimiters
    const sections = files.map((f) => {
      return `--- ${f.name} (${f.category}) ---\n${f.content}`
    })

    const context = sections.join('\n\n')

    return NextResponse.json({
      context,
      fileCount: files.length,
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path,
        category: f.category,
      })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
