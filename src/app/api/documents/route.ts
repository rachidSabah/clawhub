import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const DOCS_DIR = join(process.cwd(), 'uploads', 'documents')

function ensureDir() {
  if (!existsSync(DOCS_DIR)) mkdirSync(DOCS_DIR, { recursive: true })
}

export async function POST(req: NextRequest) {
  try {
    ensureDir()
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(DOCS_DIR, `${Date.now()}-${file.name}`)
    writeFileSync(filePath, buffer)

    // Read text content for indexing (simple approach - supports .txt, .md, .json, .csv)
    let textContent = ''
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (['txt', 'md', 'json', 'csv', 'ts', 'js', 'py', 'html', 'css', 'yaml', 'yml', 'xml'].includes(ext || '')) {
      textContent = buffer.toString('utf-8')
    }

    // Chunk the text for retrieval (simple chunking by paragraphs/512 chars)
    const chunks: string[] = []
    if (textContent) {
      const paragraphs = textContent.split(/\n\n+/)
      let current = ''
      for (const p of paragraphs) {
        if ((current + p).length > 512) {
          if (current) chunks.push(current.trim())
          current = p
        } else {
          current += '\n\n' + p
        }
      }
      if (current.trim()) chunks.push(current.trim())
    }

    // Store document metadata in database using Memory model as document store
    const doc = await db.memory.create({
      data: {
        type: 'context',
        key: `document:${file.name}`,
        content: textContent || `[Binary file: ${file.name}]`,
        source: filePath,
        relevance: 1.0,
        tags: JSON.stringify({ type: 'document', fileName: file.name, fileSize: file.size, chunks: chunks.length, ext }),
        embedding: JSON.stringify(chunks),
      }
    })

    return NextResponse.json({
      id: doc.id,
      fileName: file.name,
      fileSize: file.size,
      chunks: chunks.length,
      uploadedAt: doc.createdAt
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const docs = await db.memory.findMany({
      where: { key: { startsWith: 'document:' } },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(docs.map(d => {
      let tags: Record<string, unknown> = {}
      try { tags = JSON.parse(d.tags || '{}') } catch { /* keep default empty */ }
      return {
        id: d.id,
        fileName: (tags.fileName as string) || d.key.replace('document:', ''),
        fileSize: (tags.fileSize as number) || 0,
        chunks: (tags.chunks as number) || 0,
        ext: (tags.ext as string) || '',
        uploadedAt: d.createdAt,
      }
    }))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
