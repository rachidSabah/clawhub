import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

interface ResourceDefinition {
  uri: string
  name: string
  description: string
  mimeType?: string
}

function getGitHubTools(): ToolDefinition[] {
  return [
    {
      name: 'create_issue',
      description: 'Create a new issue in a GitHub repository',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          title: { type: 'string', description: 'Issue title' },
          body: { type: 'string', description: 'Issue body' },
          labels: { type: 'array', items: { type: 'string' }, description: 'Labels to apply' },
        },
        required: ['owner', 'repo', 'title'],
      },
    },
    {
      name: 'list_issues',
      description: 'List issues in a GitHub repository',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Issue state filter' },
          per_page: { type: 'number', description: 'Results per page' },
        },
        required: ['owner', 'repo'],
      },
    },
    {
      name: 'create_pull_request',
      description: 'Create a pull request in a GitHub repository',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          title: { type: 'string', description: 'PR title' },
          body: { type: 'string', description: 'PR description' },
          head: { type: 'string', description: 'Head branch' },
          base: { type: 'string', description: 'Base branch' },
        },
        required: ['owner', 'repo', 'title', 'head', 'base'],
      },
    },
    {
      name: 'search_repositories',
      description: 'Search for repositories on GitHub',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          sort: { type: 'string', enum: ['stars', 'forks', 'updated'], description: 'Sort field' },
          order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
          per_page: { type: 'number', description: 'Results per page' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_file_contents',
      description: 'Get the contents of a file or directory in a repository',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          path: { type: 'string', description: 'File path' },
          branch: { type: 'string', description: 'Branch name' },
        },
        required: ['owner', 'repo', 'path'],
      },
    },
    {
      name: 'push_files',
      description: 'Push multiple files to a repository in a single commit',
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'string', description: 'Repository owner' },
          repo: { type: 'string', description: 'Repository name' },
          branch: { type: 'string', description: 'Target branch' },
          files: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } }, description: 'Files to push' },
          message: { type: 'string', description: 'Commit message' },
        },
        required: ['owner', 'repo', 'branch', 'files', 'message'],
      },
    },
  ]
}

function getGitHubResources(): ResourceDefinition[] {
  return [
    { uri: 'github://repos', name: 'Repositories', description: 'List of accessible repositories' },
    { uri: 'github://notifications', name: 'Notifications', description: 'GitHub notifications' },
    { uri: 'github://user/profile', name: 'User Profile', description: 'Authenticated user profile' },
  ]
}

function getFileTools(): ToolDefinition[] {
  return [
    {
      name: 'list_files',
      description: 'List files in a Google Drive folder',
      inputSchema: {
        type: 'object',
        properties: {
          folderId: { type: 'string', description: 'Folder ID (use "root" for root folder)' },
          pageSize: { type: 'number', description: 'Number of files to return' },
          query: { type: 'string', description: 'Query string for filtering files' },
        },
        required: ['folderId'],
      },
    },
    {
      name: 'read_file',
      description: 'Read the content of a file from Google Drive',
      inputSchema: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'File ID' },
          mimeType: { type: 'string', description: 'Desired output MIME type for exports' },
        },
        required: ['fileId'],
      },
    },
    {
      name: 'upload_file',
      description: 'Upload a file to Google Drive',
      inputSchema: {
        type: 'object',
        properties: {
          fileName: { type: 'string', description: 'Name for the uploaded file' },
          parentId: { type: 'string', description: 'Parent folder ID' },
          content: { type: 'string', description: 'Base64-encoded file content' },
          mimeType: { type: 'string', description: 'MIME type of the file' },
        },
        required: ['fileName', 'content', 'mimeType'],
      },
    },
    {
      name: 'search_files',
      description: 'Search for files in Google Drive',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          pageSize: { type: 'number', description: 'Number of results' },
        },
        required: ['query'],
      },
    },
    {
      name: 'create_folder',
      description: 'Create a new folder in Google Drive',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Folder name' },
          parentId: { type: 'string', description: 'Parent folder ID' },
        },
        required: ['name'],
      },
    },
  ]
}

function getFileResources(): ResourceDefinition[] {
  return [
    { uri: 'drive://root', name: 'Root Folder', description: 'Root of Google Drive' },
    { uri: 'drive://shared', name: 'Shared With Me', description: 'Files shared with the user' },
    { uri: 'drive://recent', name: 'Recent Files', description: 'Recently accessed files' },
  ]
}

function getSlackTools(): ToolDefinition[] {
  return [
    {
      name: 'send_message',
      description: 'Send a message to a Slack channel or user',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID or name' },
          text: { type: 'string', description: 'Message text' },
          blocks: { type: 'array', items: { type: 'object' }, description: 'Slack blocks for rich formatting' },
        },
        required: ['channel', 'text'],
      },
    },
    {
      name: 'list_channels',
      description: 'List all channels in the Slack workspace',
      inputSchema: {
        type: 'object',
        properties: {
          types: { type: 'string', description: 'Comma-separated channel types (public_channel, private_channel)' },
          limit: { type: 'number', description: 'Maximum number of channels to return' },
        },
      },
    },
    {
      name: 'get_channel_history',
      description: 'Get message history from a Slack channel',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID' },
          limit: { type: 'number', description: 'Number of messages to fetch' },
          oldest: { type: 'string', description: 'Oldest message timestamp' },
        },
        required: ['channel'],
      },
    },
    {
      name: 'search_messages',
      description: 'Search for messages in the Slack workspace',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          count: { type: 'number', description: 'Number of results' },
        },
        required: ['query'],
      },
    },
    {
      name: 'upload_file',
      description: 'Upload a file to a Slack channel',
      inputSchema: {
        type: 'object',
        properties: {
          channels: { type: 'string', description: 'Comma-separated channel IDs' },
          content: { type: 'string', description: 'File content' },
          filename: { type: 'string', description: 'Filename' },
          title: { type: 'string', description: 'File title' },
        },
        required: ['channels', 'content', 'filename'],
      },
    },
  ]
}

function getSlackResources(): ResourceDefinition[] {
  return [
    { uri: 'slack://channels', name: 'Channels', description: 'List of Slack channels' },
    { uri: 'slack://users', name: 'Users', description: 'List of workspace users' },
    { uri: 'slack://team', name: 'Team Info', description: 'Workspace team information' },
  ]
}

function getDatabaseTools(): ToolDefinition[] {
  return [
    {
      name: 'execute_query',
      description: 'Execute a SQL query against the database',
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SQL query to execute' },
          params: { type: 'array', items: { type: 'string' }, description: 'Query parameters' },
        },
        required: ['sql'],
      },
    },
    {
      name: 'list_tables',
      description: 'List all tables in the database',
      inputSchema: {
        type: 'object',
        properties: {
          schema: { type: 'string', description: 'Database schema name' },
        },
      },
    },
    {
      name: 'describe_table',
      description: 'Get the schema of a specific table',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: { type: 'string', description: 'Table name' },
          schema: { type: 'string', description: 'Schema name' },
        },
        required: ['tableName'],
      },
    },
    {
      name: 'insert_row',
      description: 'Insert a row into a database table',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: { type: 'string', description: 'Table name' },
          data: { type: 'object', description: 'Column-value pairs to insert' },
        },
        required: ['tableName', 'data'],
      },
    },
    {
      name: 'update_rows',
      description: 'Update rows in a database table',
      inputSchema: {
        type: 'object',
        properties: {
          tableName: { type: 'string', description: 'Table name' },
          data: { type: 'object', description: 'Column-value pairs to update' },
          where: { type: 'string', description: 'WHERE clause' },
        },
        required: ['tableName', 'data', 'where'],
      },
    },
  ]
}

function getDatabaseResources(): ResourceDefinition[] {
  return [
    { uri: 'db://tables', name: 'Tables', description: 'List of database tables' },
    { uri: 'db://schemas', name: 'Schemas', description: 'Database schemas' },
  ]
}

function getGenericTools(): ToolDefinition[] {
  return [
    {
      name: 'ping',
      description: 'Ping the MCP server to check connectivity',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_resources',
      description: 'List available resources on the server',
      inputSchema: {
        type: 'object',
        properties: {
          cursor: { type: 'string', description: 'Pagination cursor' },
        },
      },
    },
    {
      name: 'read_resource',
      description: 'Read a specific resource by URI',
      inputSchema: {
        type: 'object',
        properties: {
          uri: { type: 'string', description: 'Resource URI' },
        },
        required: ['uri'],
      },
    },
    {
      name: 'list_tools',
      description: 'List all available tools on the server',
      inputSchema: { type: 'object', properties: {} },
    },
  ]
}

function getGenericResources(): ResourceDefinition[] {
  return [
    { uri: 'server://info', name: 'Server Info', description: 'Server information and capabilities' },
    { uri: 'server://status', name: 'Server Status', description: 'Current server status and health' },
  ]
}

function discoverToolsAndResources(serverName: string): {
  tools: ToolDefinition[]
  resources: ResourceDefinition[]
} {
  const nameLower = serverName.toLowerCase()

  if (nameLower.includes('github')) {
    return { tools: getGitHubTools(), resources: getGitHubResources() }
  }
  if (nameLower.includes('drive') || nameLower.includes('google')) {
    return { tools: getFileTools(), resources: getFileResources() }
  }
  if (nameLower.includes('slack')) {
    return { tools: getSlackTools(), resources: getSlackResources() }
  }
  if (nameLower.includes('database') || nameLower.includes('sql') || nameLower.includes('db')) {
    return { tools: getDatabaseTools(), resources: getDatabaseResources() }
  }

  return { tools: getGenericTools(), resources: getGenericResources() }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const server = await db.mcpServer.findUnique({ where: { id } })
    if (!server) {
      return NextResponse.json(
        { error: 'MCP server not found' },
        { status: 404 }
      )
    }

    if (!server.isConnected) {
      return NextResponse.json(
        { error: 'Server must be connected before discovering tools' },
        { status: 400 }
      )
    }

    const { tools, resources } = discoverToolsAndResources(server.name)

    await db.mcpServer.update({
      where: { id },
      data: {
        discoveredTools: JSON.stringify(tools),
        discoveredResources: JSON.stringify(resources),
      },
    })

    return NextResponse.json({
      tools,
      resources,
      serverId: id,
      serverName: server.name,
    })
  } catch (error) {
    console.error('Failed to discover MCP server tools:', error)
    return NextResponse.json(
      { error: 'Failed to discover MCP server tools' },
      { status: 500 }
    )
  }
}
