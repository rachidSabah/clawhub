import { NextResponse } from 'next/server'

export interface ToolDefinition {
  name: string
  description: string
  category: string
  riskLevel: 'low' | 'medium' | 'high'
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string; required?: boolean }>
    required: string[]
  }
  requiresApproval: boolean
}

const AVAILABLE_TOOLS: ToolDefinition[] = [
  // =========================================================================
  // Web & Search (8 tools)
  // =========================================================================
  {
    name: 'web_search',
    description: 'Search the web for real-time information using search engines',
    category: 'Web & Search',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string', required: true },
        num: { type: 'number', description: 'Number of results to return (default: 5)' },
      },
      required: ['query'],
    },
    requiresApproval: false,
  },
  {
    name: 'url_fetch',
    description: 'Fetch and extract text content from a URL',
    category: 'Web & Search',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to fetch', required: true },
        format: { type: 'string', description: 'Output format: text, html, markdown (default: text)' },
      },
      required: ['url'],
    },
    requiresApproval: false,
  },
  {
    name: 'web_scrape',
    description: 'Scrape structured data from a webpage using CSS selectors',
    category: 'Web & Search',
    riskLevel: 'medium',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to scrape', required: true },
        selector: { type: 'string', description: 'CSS selector to extract elements' },
        extract: { type: 'string', description: 'What to extract: text, html, attributes (default: text)' },
      },
      required: ['url'],
    },
    requiresApproval: true,
  },
  {
    name: 'api_call',
    description: 'Make HTTP API requests to external endpoints',
    category: 'Web & Search',
    riskLevel: 'high',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'API endpoint URL', required: true },
        method: { type: 'string', description: 'HTTP method: GET, POST, PUT, PATCH, DELETE (default: GET)' },
        headers: { type: 'string', description: 'JSON object of request headers' },
        body: { type: 'string', description: 'Request body (JSON string)' },
      },
      required: ['url'],
    },
    requiresApproval: true,
  },
  {
    name: 'dns_lookup',
    description: 'Resolve DNS records for a domain',
    category: 'Web & Search',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain name to look up', required: true },
        recordType: { type: 'string', description: 'DNS record type: A, AAAA, MX, TXT, CNAME, NS (default: A)' },
      },
      required: ['domain'],
    },
    requiresApproval: false,
  },
  {
    name: 'ssl_check',
    description: 'Check SSL certificate information for a domain',
    category: 'Web & Search',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain to check SSL certificate', required: true },
        port: { type: 'number', description: 'Port number (default: 443)' },
      },
      required: ['domain'],
    },
    requiresApproval: false,
  },
  {
    name: 'ping',
    description: 'Ping a host to check connectivity',
    category: 'Web & Search',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'Hostname or IP address to ping', required: true },
        count: { type: 'number', description: 'Number of pings (default: 3)' },
      },
      required: ['host'],
    },
    requiresApproval: false,
  },
  {
    name: 'port_scan',
    description: 'Scan common ports on a host to detect open services',
    category: 'Web & Search',
    riskLevel: 'high',
    parameters: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'Hostname or IP address', required: true },
        ports: { type: 'string', description: 'Comma-separated port numbers or ranges (e.g. "80,443,8000-9000")' },
      },
      required: ['host'],
    },
    requiresApproval: true,
  },

  // =========================================================================
  // File Operations (8 tools)
  // =========================================================================
  {
    name: 'file_read',
    description: 'Read file contents from the workspace',
    category: 'File Operations',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to workspace', required: true },
        encoding: { type: 'string', description: 'File encoding (default: utf-8)' },
        startLine: { type: 'number', description: 'Start line number (1-based)' },
        endLine: { type: 'number', description: 'End line number (inclusive)' },
      },
      required: ['path'],
    },
    requiresApproval: false,
  },
  {
    name: 'file_write',
    description: 'Write or create files in the workspace',
    category: 'File Operations',
    riskLevel: 'medium',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to workspace', required: true },
        content: { type: 'string', description: 'File content to write', required: true },
        append: { type: 'boolean', description: 'Append to file instead of overwriting (default: false)' },
      },
      required: ['path', 'content'],
    },
    requiresApproval: true,
  },
  {
    name: 'file_delete',
    description: 'Delete files from the workspace',
    category: 'File Operations',
    riskLevel: 'high',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to delete', required: true },
      },
      required: ['path'],
    },
    requiresApproval: true,
  },
  {
    name: 'file_list',
    description: 'List directory contents with file metadata',
    category: 'File Operations',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path (default: workspace root)' },
        recursive: { type: 'boolean', description: 'List recursively (default: false)' },
        pattern: { type: 'string', description: 'Glob pattern to filter files (e.g. "*.ts")' },
      },
      required: [],
    },
    requiresApproval: false,
  },
  {
    name: 'file_search',
    description: 'Search for files by name or pattern in the workspace',
    category: 'File Operations',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'File name pattern or glob (e.g. "*.tsx")', required: true },
        directory: { type: 'string', description: 'Directory to search in (default: workspace root)' },
      },
      required: ['pattern'],
    },
    requiresApproval: false,
  },
  {
    name: 'file_diff',
    description: 'Compare two files and show differences',
    category: 'File Operations',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        pathA: { type: 'string', description: 'Path to first file', required: true },
        pathB: { type: 'string', description: 'Path to second file', required: true },
      },
      required: ['pathA', 'pathB'],
    },
    requiresApproval: false,
  },
  {
    name: 'file_backup',
    description: 'Create a backup copy of a file with timestamp',
    category: 'File Operations',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to backup', required: true },
        suffix: { type: 'string', description: 'Backup suffix (default: .bak)' },
      },
      required: ['path'],
    },
    requiresApproval: false,
  },
  {
    name: 'file_watch',
    description: 'Watch a file or directory for changes and report events',
    category: 'File Operations',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File or directory path to watch', required: true },
        duration: { type: 'number', description: 'Watch duration in seconds (default: 30)' },
      },
      required: ['path'],
    },
    requiresApproval: false,
  },

  // =========================================================================
  // Code & Development (8 tools)
  // =========================================================================
  {
    name: 'code_execute',
    description: 'Execute code in a sandboxed environment (Python, JavaScript, TypeScript)',
    category: 'Code & Development',
    riskLevel: 'medium',
    parameters: {
      type: 'object',
      properties: {
        language: { type: 'string', description: 'Programming language: python, javascript, typescript', required: true },
        code: { type: 'string', description: 'Code to execute', required: true },
        timeout: { type: 'number', description: 'Execution timeout in seconds (default: 30)' },
      },
      required: ['language', 'code'],
    },
    requiresApproval: true,
  },
  {
    name: 'code_format',
    description: 'Format code using Prettier or language-specific formatters',
    category: 'Code & Development',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to format', required: true },
        formatter: { type: 'string', description: 'Formatter to use: prettier, black, gofmt (default: prettier)' },
      },
      required: ['path'],
    },
    requiresApproval: false,
  },
  {
    name: 'code_lint',
    description: 'Lint code using ESLint or language-specific linters',
    category: 'Code & Development',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File or directory path to lint', required: true },
        linter: { type: 'string', description: 'Linter to use: eslint, pylint, ruff (default: eslint)' },
        fix: { type: 'boolean', description: 'Auto-fix issues (default: false)' },
      },
      required: ['path'],
    },
    requiresApproval: false,
  },
  {
    name: 'code_test',
    description: 'Run tests using the project test framework',
    category: 'Code & Development',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File or directory path to test', required: true },
        framework: { type: 'string', description: 'Test framework: jest, vitest, pytest (default: jest)' },
        coverage: { type: 'boolean', description: 'Generate coverage report (default: false)' },
      },
      required: ['path'],
    },
    requiresApproval: false,
  },
  {
    name: 'git_status',
    description: 'Show Git repository working tree status',
    category: 'Code & Development',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Repository directory (default: workspace root)' },
      },
      required: [],
    },
    requiresApproval: false,
  },
  {
    name: 'git_diff',
    description: 'Show Git diff of changes',
    category: 'Code & Development',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Repository directory' },
        target: { type: 'string', description: 'Diff target: branch name, commit hash, or --staged' },
      },
      required: [],
    },
    requiresApproval: false,
  },
  {
    name: 'git_log',
    description: 'Show Git commit log',
    category: 'Code & Development',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Repository directory' },
        count: { type: 'number', description: 'Number of commits to show (default: 10)' },
        format: { type: 'string', description: 'Log format: oneline, short, full (default: oneline)' },
      },
      required: [],
    },
    requiresApproval: false,
  },
  {
    name: 'npm_install',
    description: 'Install npm packages in the workspace',
    category: 'Code & Development',
    riskLevel: 'medium',
    parameters: {
      type: 'object',
      properties: {
        packages: { type: 'string', description: 'Comma-separated package names', required: true },
        dev: { type: 'boolean', description: 'Install as dev dependency (default: false)' },
        directory: { type: 'string', description: 'Project directory' },
      },
      required: ['packages'],
    },
    requiresApproval: true,
  },

  // =========================================================================
  // System & Shell (6 tools)
  // =========================================================================
  {
    name: 'shell_execute',
    description: 'Execute shell commands (requires approval in safe mode)',
    category: 'System & Shell',
    riskLevel: 'high',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute', required: true },
        directory: { type: 'string', description: 'Working directory' },
        timeout: { type: 'number', description: 'Timeout in seconds (default: 30)' },
      },
      required: ['command'],
    },
    requiresApproval: true,
  },
  {
    name: 'process_list',
    description: 'List running system processes',
    category: 'System & Shell',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Filter pattern for process name' },
        sort: { type: 'string', description: 'Sort by: cpu, memory, pid (default: cpu)' },
      },
      required: [],
    },
    requiresApproval: false,
  },
  {
    name: 'process_kill',
    description: 'Kill a running process by PID or name',
    category: 'System & Shell',
    riskLevel: 'high',
    parameters: {
      type: 'object',
      properties: {
        pid: { type: 'number', description: 'Process ID to kill' },
        name: { type: 'string', description: 'Process name pattern to kill' },
        signal: { type: 'string', description: 'Signal to send: SIGTERM, SIGKILL (default: SIGTERM)' },
      },
      required: [],
    },
    requiresApproval: true,
  },
  {
    name: 'env_get',
    description: 'Get environment variable value',
    category: 'System & Shell',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Environment variable name', required: true },
      },
      required: ['key'],
    },
    requiresApproval: false,
  },
  {
    name: 'env_set',
    description: 'Set an environment variable for the current session',
    category: 'System & Shell',
    riskLevel: 'high',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Environment variable name', required: true },
        value: { type: 'string', description: 'Value to set', required: true },
      },
      required: ['key', 'value'],
    },
    requiresApproval: true,
  },
  {
    name: 'system_info',
    description: 'Get system information (OS, CPU, memory, disk, uptime)',
    category: 'System & Shell',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        sections: { type: 'string', description: 'Comma-separated sections: os, cpu, memory, disk, network, all (default: all)' },
      },
      required: [],
    },
    requiresApproval: false,
  },

  // =========================================================================
  // AI & Data (6 tools)
  // =========================================================================
  {
    name: 'image_generate',
    description: 'Generate images from text descriptions using AI',
    category: 'AI & Data',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Image description prompt', required: true },
        size: { type: 'string', description: 'Image size: 1024x1024, 1344x768, etc. (default: 1024x1024)' },
        style: { type: 'string', description: 'Style: natural, vivid, artistic (default: natural)' },
      },
      required: ['prompt'],
    },
    requiresApproval: false,
  },
  {
    name: 'image_analyze',
    description: 'Analyze images with vision-language model (VLM)',
    category: 'AI & Data',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Image URL or base64-encoded image data', required: true },
        prompt: { type: 'string', description: 'Analysis prompt (default: "Describe this image")' },
      },
      required: ['image'],
    },
    requiresApproval: false,
  },
  {
    name: 'speech_to_text',
    description: 'Transcribe audio to text using AI speech recognition',
    category: 'AI & Data',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        audio: { type: 'string', description: 'Audio file path or base64-encoded audio', required: true },
        language: { type: 'string', description: 'Language code (e.g. en, zh, es) for better accuracy' },
      },
      required: ['audio'],
    },
    requiresApproval: false,
  },
  {
    name: 'text_to_speech',
    description: 'Convert text to speech audio',
    category: 'AI & Data',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to convert to speech', required: true },
        voice: { type: 'string', description: 'Voice ID or name (default: alloy)' },
        speed: { type: 'number', description: 'Speech speed multiplier (0.5-2.0, default: 1.0)' },
      },
      required: ['text'],
    },
    requiresApproval: false,
  },
  {
    name: 'data_query',
    description: 'Query structured data from databases, CSV, or JSON sources',
    category: 'AI & Data',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        source: { type: 'string', description: 'Data source path or connection string', required: true },
        query: { type: 'string', description: 'SQL-like or filter query', required: true },
        format: { type: 'string', description: 'Output format: json, csv, table (default: json)' },
      },
      required: ['source', 'query'],
    },
    requiresApproval: false,
  },
  {
    name: 'data_visualize',
    description: 'Create data visualizations and charts',
    category: 'AI & Data',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        data: { type: 'string', description: 'JSON data or path to data file', required: true },
        chartType: { type: 'string', description: 'Chart type: bar, line, pie, scatter, heatmap (default: bar)' },
        title: { type: 'string', description: 'Chart title' },
        options: { type: 'string', description: 'JSON chart options (colors, labels, etc.)' },
      },
      required: ['data', 'chartType'],
    },
    requiresApproval: false,
  },

  // =========================================================================
  // Memory & Knowledge (5 tools)
  // =========================================================================
  {
    name: 'memory_store',
    description: 'Store information in long-term memory for future recall',
    category: 'Memory & Knowledge',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Information to store', required: true },
        type: { type: 'string', description: 'Memory type: fact, preference, context, learned-pattern (default: fact)' },
        key: { type: 'string', description: 'Optional key for quick retrieval' },
        tags: { type: 'string', description: 'Comma-separated tags' },
      },
      required: ['content'],
    },
    requiresApproval: false,
  },
  {
    name: 'memory_search',
    description: 'Search long-term memory for relevant information',
    category: 'Memory & Knowledge',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query', required: true },
        type: { type: 'string', description: 'Filter by memory type' },
        limit: { type: 'number', description: 'Max results (default: 5)' },
      },
      required: ['query'],
    },
    requiresApproval: false,
  },
  {
    name: 'memory_summarize',
    description: 'Summarize and compress memories to save space and improve retrieval',
    category: 'Memory & Knowledge',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Memory type to summarize (default: all)' },
        olderThan: { type: 'string', description: 'Summarize memories older than (e.g. "7d", "30d")' },
      },
      required: [],
    },
    requiresApproval: false,
  },
  {
    name: 'document_query',
    description: 'Query uploaded documents using RAG (Retrieval-Augmented Generation)',
    category: 'Memory & Knowledge',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Question about uploaded documents', required: true },
        docIds: { type: 'string', description: 'Comma-separated document IDs to search (default: all)' },
      },
      required: ['query'],
    },
    requiresApproval: false,
  },
  {
    name: 'knowledge_graph',
    description: 'Build and query knowledge relationships between entities',
    category: 'Memory & Knowledge',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Action: add, query, visualize (default: query)', required: true },
        entity: { type: 'string', description: 'Entity name or ID' },
        relation: { type: 'string', description: 'Relationship type' },
        target: { type: 'string', description: 'Target entity' },
      },
      required: ['action'],
    },
    requiresApproval: false,
  },

  // =========================================================================
  // Scheduling & Automation (4 tools)
  // =========================================================================
  {
    name: 'schedule_task',
    description: 'Schedule a task to run at specific times using cron expressions',
    category: 'Scheduling & Automation',
    riskLevel: 'medium',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Task name', required: true },
        schedule: { type: 'string', description: 'Cron schedule expression (e.g. "*/5 * * * *")', required: true },
        command: { type: 'string', description: 'Command to run', required: true },
        taskType: { type: 'string', description: 'Task type: shell, api-call, agent-task (default: shell)' },
      },
      required: ['name', 'schedule', 'command'],
    },
    requiresApproval: true,
  },
  {
    name: 'schedule_list',
    description: 'List all scheduled tasks and their status',
    category: 'Scheduling & Automation',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        active: { type: 'boolean', description: 'Filter by active status' },
      },
      required: [],
    },
    requiresApproval: false,
  },
  {
    name: 'notify',
    description: 'Send a notification to the user',
    category: 'Scheduling & Automation',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Notification title', required: true },
        message: { type: 'string', description: 'Notification message', required: true },
        type: { type: 'string', description: 'Notification type: info, warning, error, success (default: info)' },
        channel: { type: 'string', description: 'Channel: browser, email, webhook (default: browser)' },
      },
      required: ['title', 'message'],
    },
    requiresApproval: false,
  },
  {
    name: 'webhook_trigger',
    description: 'Trigger a webhook to notify external services',
    category: 'Scheduling & Automation',
    riskLevel: 'high',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Webhook URL to trigger', required: true },
        payload: { type: 'string', description: 'JSON payload to send' },
        method: { type: 'string', description: 'HTTP method (default: POST)' },
        headers: { type: 'string', description: 'JSON headers' },
      },
      required: ['url'],
    },
    requiresApproval: true,
  },

  // =========================================================================
  // Messaging & Communication (3 tools)
  // =========================================================================
  {
    name: 'message_send',
    description: 'Send a message to a messaging platform (Telegram, Discord, Slack, etc.)',
    category: 'Messaging & Communication',
    riskLevel: 'medium',
    parameters: {
      type: 'object',
      properties: {
        platform: { type: 'string', description: 'Platform: telegram, discord, slack, signal, whatsapp', required: true },
        recipient: { type: 'string', description: 'Recipient ID or channel name', required: true },
        message: { type: 'string', description: 'Message content', required: true },
      },
      required: ['platform', 'recipient', 'message'],
    },
    requiresApproval: true,
  },
  {
    name: 'email_send',
    description: 'Send an email to specified recipients',
    category: 'Messaging & Communication',
    riskLevel: 'high',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address(es), comma-separated', required: true },
        subject: { type: 'string', description: 'Email subject', required: true },
        body: { type: 'string', description: 'Email body (plain text or HTML)', required: true },
        cc: { type: 'string', description: 'CC recipients' },
        attachments: { type: 'string', description: 'Comma-separated file paths to attach' },
      },
      required: ['to', 'subject', 'body'],
    },
    requiresApproval: true,
  },
  {
    name: 'contact_search',
    description: 'Search contacts by name, email, or platform',
    category: 'Messaging & Communication',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (name, email, or username)', required: true },
        platform: { type: 'string', description: 'Filter by platform: telegram, discord, slack, email' },
      },
      required: ['query'],
    },
    requiresApproval: false,
  },
]

export async function GET() {
  return NextResponse.json({ tools: AVAILABLE_TOOLS, count: AVAILABLE_TOOLS.length })
}
