'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FolderOpen,
  X,
  ArrowUp,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size?: number
  modified?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function parseLsOutput(output: string, parentPath: string): FileEntry[] {
  const lines = output.trim().split('\n').filter(Boolean)
  const entries: FileEntry[] = []

  for (const line of lines) {
    // Parse ls -la output: permissions, links, owner, group, size, date, name
    const match = line.match(
      /^([drwx\-]{10})\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\w{3}\s+\d{1,2}\s+[\d:]+)\s+(.+)$/
    )
    if (match) {
      const [, perms, sizeStr, dateStr, name] = match
      if (name === '.' || name === '..') continue
      const isDirectory = perms.startsWith('d')
      entries.push({
        name,
        path: parentPath === '/' ? `/${name}` : `${parentPath}/${name}`,
        isDirectory,
        size: isDirectory ? undefined : parseInt(sizeStr, 10),
        modified: dateStr,
      })
    }
  }

  // Sort: directories first, then alphabetically
  entries.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.name.localeCompare(b.name)
  })

  return entries
}

// ---------------------------------------------------------------------------
// File Tree Panel
// ---------------------------------------------------------------------------

export function FileTreePanel() {
  const [currentPath, setCurrentPath] = useState('/home/z/my-project')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Record<string, FileEntry[]>>({})
  const [loading, setLoading] = useState(false)
  const [viewingFile, setViewingFile] = useState<{ path: string; content: string } | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)

  const listDirectory = useCallback(async (dirPath: string): Promise<FileEntry[]> => {
    try {
      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `ls -la ${dirPath}` }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.stdout) {
          return parseLsOutput(data.stdout, dirPath)
        }
      }
      return []
    } catch (err) {
      console.error('Failed to list directory:', err)
      return []
    }
  }, [])

  const loadRoot = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listDirectory(currentPath)
      setEntries(result)
    } finally {
      setLoading(false)
    }
  }, [currentPath, listDirectory])

  const handleExpand = async (entry: FileEntry) => {
    if (!entry.isDirectory) return
    if (expandedDirs[entry.path]) {
      // Collapse
      setExpandedDirs((prev) => {
        const next = { ...prev }
        delete next[entry.path]
        return next
      })
    } else {
      // Expand
      const children = await listDirectory(entry.path)
      setExpandedDirs((prev) => ({ ...prev, [entry.path]: children }))
    }
  }

  const handleFileClick = async (entry: FileEntry) => {
    if (entry.isDirectory) {
      handleExpand(entry)
      return
    }

    // View file content
    setLoadingFile(true)
    try {
      const res = await fetch(`/api/agent/files?path=${encodeURIComponent(entry.path)}`)
      if (res.ok) {
        const data = await res.json()
        setViewingFile({ path: entry.path, content: data.content || data.text || JSON.stringify(data, null, 2) })
      } else {
        setViewingFile({ path: entry.path, content: `Error: Unable to read file (HTTP ${res.status})` })
      }
    } catch (err) {
      setViewingFile({ path: entry.path, content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` })
    } finally {
      setLoadingFile(false)
    }
  }

  const navigateTo = async (path: string) => {
    setCurrentPath(path)
    setExpandedDirs({})
    setViewingFile(null)
    setLoading(true)
    try {
      const result = await listDirectory(path)
      setEntries(result)
    } finally {
      setLoading(false)
    }
  }

  // Load on mount
  useEffect(() => {
    loadRoot()
  }, [loadRoot])

  // Breadcrumb segments
  const pathSegments = currentPath.split('/').filter(Boolean)

  const renderFileTree = (items: FileEntry[], depth: number = 0) => {
    return items.map((entry) => {
      const isExpanded = !!expandedDirs[entry.path]
      const children = expandedDirs[entry.path]

      return (
        <div key={entry.path}>
          <button
            className={cn(
              'w-full flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-muted/50 rounded transition-colors text-left',
              viewingFile?.path === entry.path && 'bg-muted'
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => handleFileClick(entry)}
          >
            {entry.isDirectory ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                ) : (
                  <Folder className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                )}
              </>
            ) : (
              <>
                <span className="w-3" />
                <File className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              </>
            )}
            <span className="truncate flex-1">{entry.name}</span>
            {!entry.isDirectory && entry.size !== undefined && (
              <span className="text-[9px] text-muted-foreground shrink-0">
                {formatFileSize(entry.size)}
              </span>
            )}
            {entry.modified && (
              <span className="text-[9px] text-muted-foreground shrink-0 ml-2">
                {entry.modified}
              </span>
            )}
          </button>
          {/* Render children if expanded */}
          {isExpanded && children && renderFileTree(children, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">File Explorer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigateTo(currentPath)}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
          {currentPath !== '/' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1"
              onClick={() => {
                const parent = currentPath.split('/').slice(0, -1).join('/') || '/'
                navigateTo(parent)
              }}
            >
              <ArrowUp className="w-3 h-3" />
              Up
            </Button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-[10px]">
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigateTo('/')}
        >
          /
        </button>
        {pathSegments.map((segment, idx) => {
          const segPath = '/' + pathSegments.slice(0, idx + 1).join('/')
          return (
            <span key={segPath} className="flex items-center gap-1">
              <span className="text-muted-foreground">/</span>
              <button
                className={cn(
                  'hover:text-foreground transition-colors',
                  idx === pathSegments.length - 1
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                )}
                onClick={() => navigateTo(segPath)}
              >
                {segment}
              </button>
            </span>
          )
        })}
      </div>

      <div className="flex gap-3 min-h-0">
        {/* File Tree */}
        <Card className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-[350px]">
            <div className="p-1">
              {entries.length === 0 && !loading && (
                <div className="text-[10px] text-muted-foreground text-center py-8">
                  Empty directory or unable to list files.
                </div>
              )}
              {renderFileTree(entries)}
            </div>
          </ScrollArea>
        </Card>

        {/* File Viewer */}
        {viewingFile && (
          <Card className="flex-1 p-0 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-1.5 min-w-0">
                <File className="w-3 h-3 shrink-0 text-muted-foreground" />
                <span className="text-[10px] font-medium truncate">
                  {viewingFile.path.split('/').pop()}
                </span>
                <Badge variant="outline" className="text-[8px] h-3.5 px-1 shrink-0">
                  {viewingFile.path.split('.').pop()}
                </Badge>
              </div>
              <button
                className="h-5 w-5 inline-flex items-center justify-center rounded hover:bg-muted transition-colors"
                onClick={() => setViewingFile(null)}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <pre className="p-3 text-[10px] font-mono whitespace-pre-wrap break-all text-muted-foreground">
                {loadingFile ? 'Loading...' : viewingFile.content}
              </pre>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  )
}
