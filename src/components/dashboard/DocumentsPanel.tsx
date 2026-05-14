'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileUp, FileText, Trash2, Search, Loader2, Bot, X } from 'lucide-react'

interface DocInfo {
  id: string
  fileName: string
  fileSize: number
  chunks: number
  ext: string
  uploadedAt: string
}

export function DocumentsPanel() {
  const [documents, setDocuments] = useState<DocInfo[]>([])
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')
  const [querying, setQuerying] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      if (Array.isArray(data)) setDocuments(data)
    } catch (error) { console.error('Failed to load docs:', error) }
  }, [])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        await fetch('/api/documents', { method: 'POST', body: formData })
      } catch (error) { console.error('Upload failed:', error) }
    }
    await loadDocs()
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    await loadDocs()
  }

  const handleQuery = async () => {
    if (!query.trim()) return
    setQuerying(true)
    setAnswer(null)
    try {
      const res = await fetch('/api/documents/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      })
      const data = await res.json()
      setAnswer(data.answer || 'No answer found')
    } catch (error) {
      setAnswer('Query failed. Please try again.')
    }
    setQuerying(false)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  // Load docs on mount
  useEffect(() => {
    let cancelled = false
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => { if (!cancelled && Array.isArray(data)) setDocuments(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="space-y-4 p-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${dragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-emerald-500/50'}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.json,.csv,.ts,.js,.py,.html,.css,.yaml,.yml,.xml" onChange={e => handleUpload(e.target.files)} className="hidden" />
        <FileUp className={`w-6 h-6 mx-auto mb-2 ${dragOver ? 'text-emerald-500' : 'text-muted-foreground'}`} />
        <p className="text-xs text-muted-foreground">
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">.txt, .md, .json, .csv, .ts, .js, .py, .html, .css, .yaml, .xml</p>
      </div>

      {/* Document List */}
      <ScrollArea className="max-h-[200px]">
        <div className="space-y-1.5">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-2 p-2 rounded-lg border border-border text-xs group">
              <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{doc.fileName}</div>
                <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                  <span>{formatSize(doc.fileSize)}</span>
                  <span>{doc.chunks} chunks</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[8px] h-4 px-1">{doc.ext}</Badge>
              <button onClick={() => handleDelete(doc.id)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">No documents uploaded yet</div>
          )}
        </div>
      </ScrollArea>

      {/* RAG Query */}
      <Card>
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-emerald-500" /> Ask Your Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1 space-y-2">
          <div className="flex gap-2">
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask a question about your documents..." className="text-xs h-8"
              onKeyDown={e => e.key === 'Enter' && handleQuery()} />
            <Button onClick={handleQuery} disabled={!query.trim() || querying} size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 gap-1">
              {querying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </Button>
          </div>
          {answer && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap leading-relaxed relative">
              <button onClick={() => setAnswer(null)} className="absolute top-1 right-1 p-0.5 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
              {answer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
