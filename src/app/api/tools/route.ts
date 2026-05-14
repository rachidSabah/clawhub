import { NextResponse } from 'next/server'

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, { type: string; description: string; required?: boolean }>
  category: string
}

const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'web_search',
    description: 'Search the web for real-time information',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      num: { type: 'number', description: 'Number of results (default: 5)' },
    },
    category: 'search',
  },
  {
    name: 'code_execute',
    description: 'Execute code in a sandboxed environment',
    parameters: {
      language: { type: 'string', description: 'Programming language (python, javascript, typescript)', required: true },
      code: { type: 'string', description: 'Code to execute', required: true },
    },
    category: 'code',
  },
  {
    name: 'file_read',
    description: 'Read file contents from the workspace',
    parameters: {
      path: { type: 'string', description: 'File path relative to workspace', required: true },
    },
    category: 'file',
  },
  {
    name: 'file_write',
    description: 'Write content to a file in the workspace',
    parameters: {
      path: { type: 'string', description: 'File path relative to workspace', required: true },
      content: { type: 'string', description: 'File content', required: true },
    },
    category: 'file',
  },
  {
    name: 'image_generate',
    description: 'Generate an image from a text description',
    parameters: {
      prompt: { type: 'string', description: 'Image description', required: true },
      size: { type: 'string', description: 'Image size (1024x1024, 1344x768, etc.)' },
    },
    category: 'media',
  },
  {
    name: 'memory_store',
    description: 'Store information in long-term memory',
    parameters: {
      content: { type: 'string', description: 'Information to store', required: true },
      type: { type: 'string', description: 'Memory type (fact, preference, context, learned-pattern)' },
      tags: { type: 'string', description: 'Comma-separated tags' },
    },
    category: 'memory',
  },
  {
    name: 'memory_search',
    description: 'Search long-term memory for relevant information',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
      limit: { type: 'number', description: 'Max results (default: 5)' },
    },
    category: 'memory',
  },
  {
    name: 'document_query',
    description: 'Query uploaded documents using RAG',
    parameters: {
      query: { type: 'string', description: 'Question about documents', required: true },
    },
    category: 'search',
  },
  {
    name: 'shell_execute',
    description: 'Execute a shell command (requires approval in safe mode)',
    parameters: {
      command: { type: 'string', description: 'Shell command to execute', required: true },
    },
    category: 'system',
  },
  {
    name: 'schedule_task',
    description: 'Schedule a task to run at a specific time using cron',
    parameters: {
      name: { type: 'string', description: 'Task name', required: true },
      schedule: { type: 'string', description: 'Cron schedule expression', required: true },
      command: { type: 'string', description: 'Command to run', required: true },
    },
    category: 'system',
  },
]

export async function GET() {
  return NextResponse.json({ tools: AVAILABLE_TOOLS })
}
