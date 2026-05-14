'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { createContextFile, updateContextFile, deleteContextFile, fetchActiveContext } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Plus, Trash2, ToggleLeft, ToggleRight, FileCode, Sparkles, BookOpen, Settings } from 'lucide-react'
import type { ContextFile, ContextFileCategory } from '@/lib/types'

const categoryIcons: Record<string, React.ReactNode> = {
  project: <FileCode className="w-3 h-3 text-blue-500" />,
  persona: <Sparkles className="w-3 h-3 text-purple-500" />,
  instructions: <BookOpen className="w-3 h-3 text-amber-500" />,
  custom: <Settings className="w-3 h-3 text-emerald-500" />,
}

const categoryColors: Record<string, string> = {
  project: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  persona: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  instructions: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  custom: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
}

export function ContextFilesPanel() {
  const { contextFiles, loadContextFiles } = useAppStore()
  const [activeContext, setActiveContext] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formPath, setFormPath] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState<ContextFileCategory>('project')
  const [formAutoLoad, setFormAutoLoad] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadContextFiles()
    loadActiveContext()
  }, [loadContextFiles])

  const loadActiveContext = async () => {
    try {
      const res = await fetchActiveContext()
      setActiveContext(res.context)
    } catch {
      // ignore
    }
  }

  const handleCreate = async () => {
    if (!formName.trim() || !formPath.trim()) return
    setLoading(true)
    try {
      await createContextFile({
        name: formName,
        path: formPath,
        content: formContent,
        category: formCategory,
        autoLoad: formAutoLoad,
      })
      setFormName('')
      setFormPath('')
      setFormContent('')
      setFormCategory('project')
      setFormAutoLoad(true)
      setShowForm(false)
      loadContextFiles()
      loadActiveContext()
    } catch (e) {
      console.error('Create failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAutoLoad = async (file: ContextFile) => {
    try {
      await updateContextFile(file.id, { autoLoad: !file.autoLoad })
      loadContextFiles()
      loadActiveContext()
    } catch (e) {
      console.error('Toggle failed:', e)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContextFile(id)
      loadContextFiles()
      loadActiveContext()
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  return (
    <div className="p-3 space-y-4">
      {/* Active Context Preview */}
      {activeContext && (
        <Card className="border-border">
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Active System Context
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="max-h-32">
              <pre className="text-[9px] text-muted-foreground whitespace-pre-wrap font-mono">
                {activeContext.slice(0, 500)}{activeContext.length > 500 ? '...' : ''}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Context Files List */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Context Files
              <Badge variant="outline" className="text-[8px] h-3.5 px-1">
                {contextFiles.length}
              </Badge>
            </CardTitle>
            <Button
              size="sm"
              className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="w-3 h-3 mr-1" /> New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {/* Create Form */}
          {showForm && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 space-y-2">
              <div className="flex gap-1.5">
                <Input
                  placeholder="Name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-7 text-[10px] flex-1"
                />
                <Input
                  placeholder="Path (e.g. /project/README.md)"
                  value={formPath}
                  onChange={(e) => setFormPath(e.target.value)}
                  className="h-7 text-[10px] flex-1"
                />
              </div>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ContextFileCategory)}
                className="h-7 text-[10px] rounded-md border border-border bg-background px-2"
              >
                <option value="project">Project</option>
                <option value="persona">Persona</option>
                <option value="instructions">Instructions</option>
                <option value="custom">Custom</option>
              </select>
              <Textarea
                placeholder="Context file content..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="min-h-[80px] text-[10px] font-mono"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAutoLoad}
                    onChange={(e) => setFormAutoLoad(e.target.checked)}
                    className="rounded"
                  />
                  Auto-load as system context
                </label>
                <Button
                  size="sm"
                  className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleCreate}
                  disabled={!formName.trim() || !formPath.trim() || loading}
                >
                  {loading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          )}

          {/* Files List */}
          <ScrollArea className="max-h-64">
            {contextFiles.length === 0 ? (
              <div className="text-[10px] text-muted-foreground text-center py-4">
                No context files yet. Create one to provide system context for AI.
              </div>
            ) : (
              <div className="space-y-1.5">
                {contextFiles.map((file: ContextFile) => (
                  <div
                    key={file.id}
                    className="rounded-md border border-border px-2 py-1.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {categoryIcons[file.category] || <FileText className="w-3 h-3" />}
                        <span className="text-[10px] font-medium">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={`text-[8px] h-3.5 px-1 ${categoryColors[file.category] || ''}`}
                        >
                          {file.category}
                        </Badge>
                        <button
                          onClick={() => handleToggleAutoLoad(file)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {file.autoLoad ? (
                            <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground">{file.path}</div>
                    <div className="text-[9px] text-muted-foreground line-clamp-2">
                      {file.content.slice(0, 100)}{file.content.length > 100 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
