import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Find all active agents
    const agents = await db.agentSwarm.findMany({
      where: { isActive: true },
    })

    if (agents.length === 0) {
      return NextResponse.json({
        message: 'No active agents found for daily reflection',
        reflections: [],
      })
    }

    const reflections = []

    for (const agent of agents) {
      // Build a summary based on the agent's recent activity
      const taskHistory: string[] = agent.taskHistory
        ? (typeof agent.taskHistory === 'string' ? JSON.parse(agent.taskHistory) : agent.taskHistory)
        : []

      const recentTasks = taskHistory.slice(-5)
      const tasksCompleted = taskHistory.length
      const isRunning = agent.status === 'running'
      const isIdle = agent.status === 'idle'
      const iterationsUsed = agent.iterationCount
      const maxIterations = agent.maxIterations
      const iterationRatio = maxIterations > 0 ? iterationsUsed / maxIterations : 0

      // Determine success rate based on agent state
      let successRate = 0.5
      if (agent.status === 'completed') successRate = 0.9
      else if (agent.status === 'error') successRate = 0.2
      else if (agent.status === 'idle' && tasksCompleted > 0) successRate = 0.75
      else if (isRunning) successRate = 0.6

      // Generate insights based on agent state
      const insights: string[] = []
      const actionItems: string[] = []

      if (tasksCompleted > 0) {
        insights.push(`Completed ${tasksCompleted} task(s) in recent history`)
      }

      if (isRunning) {
        insights.push(`Currently running with ${iterationsUsed}/${maxIterations} iterations used`)
        if (iterationRatio > 0.8) {
          actionItems.push('Review if the agent is stuck in a loop — approaching max iterations')
        }
      }

      if (agent.status === 'error') {
        insights.push('Agent is in error state')
        actionItems.push('Investigate and resolve the error condition')
        actionItems.push('Consider resetting the agent to idle state')
      }

      if (isIdle && tasksCompleted === 0) {
        insights.push('Agent has been idle with no completed tasks')
        actionItems.push('Consider assigning a task to this agent')
      }

      if (agent.isDaemon) {
        insights.push('Agent is running in daemon mode (continuous background operation)')
      }

      if (recentTasks.length > 0) {
        insights.push(`Most recent tasks: ${recentTasks.join(', ')}`)
      }

      // Build the summary
      const summaryParts: string[] = []
      summaryParts.push(`Daily reflection for agent "${agent.name}" (${agent.role})`)

      if (isRunning && agent.currentTask) {
        summaryParts.push(`Currently working on: ${agent.currentTask}`)
      } else if (isIdle) {
        summaryParts.push('Status: idle, awaiting task assignment')
      } else if (agent.status === 'completed') {
        summaryParts.push('Status: task completed successfully')
      } else if (agent.status === 'error') {
        summaryParts.push('Status: in error state, needs attention')
      }

      summaryParts.push(`Total tasks in history: ${tasksCompleted}`)
      summaryParts.push(`Iteration usage: ${iterationsUsed}/${maxIterations}`)

      const summary = summaryParts.join('. ') + '.'

      // Default insights/actionItems if none generated
      if (insights.length === 0) {
        insights.push('No significant activity to reflect on')
      }
      if (actionItems.length === 0) {
        actionItems.push('Continue monitoring agent performance')
      }

      // Create the reflection log entry
      const reflection = await db.reflectionLog.create({
        data: {
          agentId: agent.id,
          type: 'daily',
          summary,
          insights: JSON.stringify(insights),
          actionItems: JSON.stringify(actionItems),
          successRate,
        },
      })

      reflections.push(reflection)
    }

    return NextResponse.json({
      message: `Daily reflection generated for ${reflections.length} agent(s)`,
      reflections,
    })
  } catch (error) {
    console.error('Failed to trigger daily reflection:', error)
    return NextResponse.json(
      { error: 'Failed to trigger daily reflection' },
      { status: 500 }
    )
  }
}
