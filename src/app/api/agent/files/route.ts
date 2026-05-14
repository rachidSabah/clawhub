import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile, unlink } from 'fs/promises'
import { dirname } from 'path'
import { mkdir } from 'fs/promises'

export async function GET(request: NextRequest) {
  try {
    const filePath = request.nextUrl.searchParams.get('path')

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    const content = await readFile(filePath, 'utf-8')

    return NextResponse.json({ path: filePath, content })
  } catch (error) {
    console.error('Failed to read file:', error)

    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    if (err.code === 'EACCES') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: filePath, content } = body

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    if (content === undefined || content === null) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Ensure the parent directory exists
    const dir = dirname(filePath)
    await mkdir(dir, { recursive: true })

    await writeFile(filePath, typeof content === 'string' ? content : JSON.stringify(content), 'utf-8')

    return NextResponse.json({ success: true, path: filePath })
  } catch (error) {
    console.error('Failed to write file:', error)

    const err = error as NodeJS.ErrnoException
    if (err.code === 'EACCES') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to write file' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const filePath = request.nextUrl.searchParams.get('path')

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    await unlink(filePath)

    return NextResponse.json({ success: true, path: filePath })
  } catch (error) {
    console.error('Failed to delete file:', error)

    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    if (err.code === 'EACCES') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
