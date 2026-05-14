'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Download,
  Upload,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Database,
  HardDrive,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Export options
// ---------------------------------------------------------------------------

const EXPORT_OPTIONS = [
  { key: 'conversations', label: 'Conversations & Messages', icon: '💬' },
  { key: 'providers', label: 'Providers', icon: '🌐' },
  { key: 'modelConfigs', label: 'Model Configurations', icon: '⚡' },
  { key: 'workspaces', label: 'Workspaces', icon: '📁' },
  { key: 'skills', label: 'Skills', icon: '🛠' },
  { key: 'memories', label: 'Memories', icon: '🧠' },
  { key: 'agents', label: 'Agent Swarms', icon: '🤖' },
  { key: 'cron', label: 'Cron Jobs', icon: '⏰' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExportImportPanel() {
  const [selectedExport, setSelectedExport] = useState<Set<string>>(
    new Set(['conversations', 'providers', 'modelConfigs'])
  )
  const [importData, setImportData] = useState<Record<string, unknown> | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---- Export ----
  const handleExport = async () => {
    setExporting(true)
    try {
      const types = Array.from(selectedExport).join(',')
      const res = await fetch(`/api/export?type=${types}`)
      if (!res.ok) throw new Error('Export failed')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clawhub-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  // ---- Import file selection ----
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      setImportData(data)
      setImportResult(null)
    } catch {
      setImportResult({ success: false, message: 'Invalid JSON file. Please select a valid ClawHub export file.' })
    }
    // Reset file input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ---- Import execution ----
  const handleImport = async () => {
    if (!importData) return
    setImporting(true)
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData),
      })
      const result = await res.json()
      if (result.success) {
        setImportResult({ success: true, message: `Import successful: ${JSON.stringify(result.imported)}` })
        setImportData(null)
        setImportDialogOpen(false)
      } else {
        setImportResult({ success: false, message: result.error || 'Import failed' })
      }
    } catch (error) {
      setImportResult({ success: false, message: 'Import failed. Please check the file and try again.' })
      console.error('Import failed:', error)
    } finally {
      setImporting(false)
    }
  }

  // ---- Toggle export option ----
  const toggleExport = (key: string) => {
    setSelectedExport((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => setSelectedExport(new Set(EXPORT_OPTIONS.map((o) => o.key)))
  const selectNone = () => setSelectedExport(new Set())

  // ---- Import preview helpers ----
  const getImportSummary = () => {
    if (!importData) return []
    return Object.entries(importData)
      .filter(([k, val]) => k !== 'exportedAt' && k !== 'version' && Array.isArray(val))
      .map(([key, val]) => ({ key, count: (val as unknown[]).length }))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-500" />
          <span className="text-xs font-semibold">Export / Import</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          {/* ========== Export Section ========== */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-500" /> Export Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-2"
                  onClick={selectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-2"
                  onClick={selectNone}
                >
                  Select None
                </Button>
                <Badge variant="outline" className="text-[9px] h-4 px-1 ml-auto">
                  {selectedExport.size} selected
                </Badge>
              </div>

              {EXPORT_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2 text-xs cursor-pointer rounded-md px-1.5 py-1 hover:bg-accent/30 transition-colors"
                >
                  <Checkbox
                    checked={selectedExport.has(opt.key)}
                    onCheckedChange={() => toggleExport(opt.key)}
                  />
                  <span className="text-sm">{opt.icon}</span>
                  <span>{opt.label}</span>
                </label>
              ))}

              <Separator className="my-2" />

              <Button
                onClick={handleExport}
                disabled={selectedExport.size === 0 || exporting}
                className="w-full h-8 text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-700"
              >
                {exporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileJson className="w-3.5 h-3.5" />
                )}
                {exporting ? 'Exporting...' : 'Export as JSON'}
              </Button>
            </CardContent>
          </Card>

          {/* ========== Import Section ========== */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-500" /> Import Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-8 text-xs gap-1.5"
              >
                <FileJson className="w-3.5 h-3.5" /> Select JSON File
              </Button>

              {/* Import result message */}
              {importResult && (
                <div
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
                    importResult.success
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {importResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{importResult.message}</span>
                </div>
              )}

              {/* Import preview */}
              {importData && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <Database className="w-3.5 h-3.5 text-muted-foreground" />
                      Import Preview
                    </div>
                    {getImportSummary().length > 0 ? (
                      <div className="space-y-1">
                        {getImportSummary().map(({ key, count }) => (
                          <div key={key} className="text-xs flex items-center justify-between">
                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                              {count} items
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground">
                        No importable data found in this file.
                      </div>
                    )}
                    {importData.version && (
                      <div className="text-[10px] text-muted-foreground">
                        Export version: {String(importData.version)}
                      </div>
                    )}
                    {importData.exportedAt && (
                      <div className="text-[10px] text-muted-foreground">
                        Exported: {String(importData.exportedAt)}
                      </div>
                    )}
                  </div>

                  <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700">
                        <Upload className="w-3.5 h-3.5" /> Import Data
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500" /> Confirm Import
                        </DialogTitle>
                        <DialogDescription>
                          This will merge the imported data with your existing data. Existing items
                          with the same ID will be overwritten. This cannot be undone.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="rounded-lg border border-border p-3 space-y-1 my-2">
                        <div className="text-xs font-medium mb-1">Items to import:</div>
                        {getImportSummary().map(({ key, count }) => (
                          <div key={key} className="text-xs flex items-center justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-muted-foreground">{count} items</span>
                          </div>
                        ))}
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setImportDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            setImportDialogOpen(false)
                            handleImport()
                          }}
                          disabled={importing}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          {importing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Importing...
                            </>
                          ) : (
                            'Confirm Import'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-[10px] text-muted-foreground"
                    onClick={() => {
                      setImportData(null)
                      setImportResult(null)
                    }}
                  >
                    Clear selection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
