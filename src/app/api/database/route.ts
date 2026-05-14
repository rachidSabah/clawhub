import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

// ---------------------------------------------------------------------------
// Database Management API — Run Prisma operations from Dashboard
// ---------------------------------------------------------------------------

const execAsync = promisify(exec)

type DbOperation = 'push' | 'generate' | 'migrate' | 'reset' | 'seed' | 'studio' | 'setup'

interface DbOperationDef {
  id: DbOperation
  name: string
  description: string
  command: string
  confirmRequired: boolean
  category: 'schema' | 'data' | 'tools'
}

const DB_OPERATIONS: DbOperationDef[] = [
  {
    id: 'generate',
    name: 'Generate Client',
    description: 'Regenerate the Prisma client from the current schema. Run this after any schema change.',
    command: 'npx prisma generate',
    confirmRequired: false,
    category: 'schema',
  },
  {
    id: 'push',
    name: 'Push Schema',
    description: 'Push schema changes to the database without creating a migration. Good for development.',
    command: 'npx prisma db push',
    confirmRequired: false,
    category: 'schema',
  },
  {
    id: 'migrate',
    name: 'Create Migration',
    description: 'Create a new migration from schema changes and apply it.',
    command: 'npx prisma migrate dev --name auto',
    confirmRequired: false,
    category: 'schema',
  },
  {
    id: 'seed',
    name: 'Seed Database',
    description: 'Re-seed providers, agents, and default settings. Existing data is preserved (upsert).',
    command: 'npx tsx prisma/seed.ts',
    confirmRequired: false,
    category: 'data',
  },
  {
    id: 'setup',
    name: 'Full Setup',
    description: 'Generate + Push + Seed — complete database setup in one step.',
    command: 'npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts',
    confirmRequired: false,
    category: 'data',
  },
  {
    id: 'reset',
    name: 'Reset Database',
    description: 'Reset the database and apply all migrations from scratch. ALL DATA WILL BE LOST!',
    command: 'npx prisma migrate reset --force',
    confirmRequired: true,
    category: 'data',
  },
  {
    id: 'studio',
    name: 'Open Prisma Studio',
    description: 'Launch Prisma Studio — a visual database browser at http://localhost:5555',
    command: 'npx prisma studio',
    confirmRequired: false,
    category: 'tools',
  },
]

// GET /api/database — List available database operations
export async function GET() {
  try {
    return NextResponse.json({
      operations: DB_OPS.map(op => ({
        id: op.id,
        name: op.name,
        description: op.description,
        command: op.command,
        confirmRequired: op.confirmRequired,
        category: op.category,
      })),
      database: {
        url: process.env.DATABASE_URL || 'file:./db/custom.db',
        provider: 'SQLite',
      },
    })
  } catch (error) {
    console.error('Failed to list database operations:', error)
    return NextResponse.json(
      { error: 'Failed to list database operations' },
      { status: 500 }
    )
  }
}

// POST /api/database — Execute a database operation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, confirm } = body as { operation: string; confirm?: boolean }

    const op = DB_OPERATIONS.find(o => o.id === operation)
    if (!op) {
      return NextResponse.json(
        { error: `Unknown operation: ${operation}. Available: ${DB_OPERATIONS.map(o => o.id).join(', ')}` },
        { status: 400 }
      )
    }

    if (op.confirmRequired && !confirm) {
      return NextResponse.json(
        { error: `Operation "${op.name}" requires confirmation. Set confirm: true in the request body.` },
        { status: 400 }
      )
    }

    const cwd = process.cwd()
    const timeout = 60000 // 60 seconds timeout for most operations

    try {
      const { stdout, stderr } = await execAsync(op.command, {
        cwd,
        timeout,
        env: { ...process.env },
      })

      return NextResponse.json({
        success: true,
        operation: op.id,
        name: op.name,
        command: op.command,
        stdout: stdout.slice(-3000), // Last 3000 chars to avoid huge payloads
        stderr: stderr.slice(-3000),
      })
    } catch (execError: any) {
      // Command failed but we can still return the output
      return NextResponse.json({
        success: false,
        operation: op.id,
        name: op.name,
        command: op.command,
        stdout: (execError.stdout || '').slice(-3000),
        stderr: (execError.stderr || execError.message || '').slice(-3000),
        exitCode: execError.code,
      })
    }
  } catch (error) {
    console.error('Failed to execute database operation:', error)
    return NextResponse.json(
      { error: 'Failed to execute database operation' },
      { status: 500 }
    )
  }
}

// Alias for the DB operations list
const DB_OPS = DB_OPERATIONS
