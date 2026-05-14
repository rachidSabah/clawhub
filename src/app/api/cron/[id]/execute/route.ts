import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const job = await db.cronJob.findUnique({ where: { id } })
    if (!job) return NextResponse.json({ error: 'Cron job not found' }, { status: 404 })

    const taskData = JSON.parse(job.taskData || '{}')
    let result: Record<string, unknown> = { success: false, output: '' }

    const startTime = Date.now()

    switch (job.taskType) {
      case 'shell': {
        try {
          const output = await new Promise<string>((resolve, reject) => {
            exec(taskData.command || 'echo "No command"', {
              timeout: taskData.timeout || 60000,
              cwd: taskData.workingDir || undefined,
            }, (err, stdout, stderr) => {
              if (err) reject(err)
              else resolve(stdout + (stderr ? '\n' + stderr : ''))
            })
          })
          result = { success: true, output, duration: Date.now() - startTime }
        } catch (err: any) {
          result = { success: false, output: err.message, duration: Date.now() - startTime }
        }
        break
      }
      case 'agent-task': {
        result = { success: true, output: 'Agent task queued', task: taskData.prompt }
        break
      }
      case 'model-prompt': {
        result = { success: true, output: 'Model prompt queued', prompt: taskData.prompt }
        break
      }
      default: {
        result = { success: false, output: `Unknown task type: ${job.taskType}` }
      }
    }

    const updatedJob = await db.cronJob.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        runCount: { increment: 1 },
        lastResult: JSON.stringify(result),
        nextRunAt: new Date(Date.now() + 60000),
        ...(result.success ? {} : { failCount: { increment: 1 } }),
      },
    })

    return NextResponse.json({ job: updatedJob, result })
  } catch (error) {
    console.error('Failed to execute cron job:', error)
    return NextResponse.json({ error: 'Failed to execute cron job' }, { status: 500 })
  }
}
