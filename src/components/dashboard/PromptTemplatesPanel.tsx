'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Code2,
  PenLine,
  BarChart3,
  Sparkles,
  Settings2,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  FileText,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PromptTemplate {
  id: string
  name: string
  description: string
  category: string
  content: string
  variables: string[]
}

// ---------------------------------------------------------------------------
// Built-in templates
// ---------------------------------------------------------------------------

const BUILTIN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Review code for bugs, performance, and best practices',
    category: 'Coding',
    content:
      'Please review the following {{language}} code for:\n1. Bugs and potential issues\n2. Performance improvements\n3. Best practices\n4. Security vulnerabilities\n\n```{{language}}\n{{code}}\n```\n\nProvide specific suggestions with explanations.',
    variables: ['language', 'code'],
  },
  {
    id: 'debug-error',
    name: 'Debug Error',
    description: 'Debug an error message with context',
    category: 'Coding',
    content:
      "I'm getting the following error in my {{language}} application:\n\n```\n{{error_message}}\n```\n\nContext:\n- Framework: {{framework}}\n- What I was trying to do: {{intent}}\n\nHelp me understand and fix this error.",
    variables: ['language', 'error_message', 'framework', 'intent'],
  },
  {
    id: 'api-design',
    name: 'API Design',
    description: 'Design a REST API for a service',
    category: 'Coding',
    content:
      'Design a REST API for {{service_name}} with the following requirements:\n\n{{requirements}}\n\nInclude:\n- Endpoint definitions with HTTP methods\n- Request/response schemas\n- Authentication strategy\n- Error handling patterns\n- Rate limiting considerations',
    variables: ['service_name', 'requirements'],
  },
  {
    id: 'explain-concept',
    name: 'Explain Concept',
    description: 'Explain a technical concept clearly',
    category: 'Analysis',
    content:
      'Explain {{concept}} in simple terms. Include:\n1. A brief definition (1-2 sentences)\n2. How it works (with analogy)\n3. Real-world example\n4. Common misconceptions\n5. Related concepts: {{related}}\n\nTarget audience: {{audience}}',
    variables: ['concept', 'related', 'audience'],
  },
  {
    id: 'write-docs',
    name: 'Write Documentation',
    description: 'Generate documentation for code or APIs',
    category: 'Writing',
    content:
      'Write comprehensive {{doc_type}} documentation for:\n\n{{code_or_api}}\n\nStyle: {{style}}\nInclude: {{include_sections}}',
    variables: ['doc_type', 'code_or_api', 'style', 'include_sections'],
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Analyze data and provide insights',
    category: 'Analysis',
    content:
      'Analyze the following {{data_type}} data:\n\n{{data}}\n\nFocus on:\n1. Key patterns and trends\n2. Statistical significance\n3. Anomalies or outliers\n4. Actionable insights\n5. Recommendations\n\nVisualization suggestions: {{viz_type}}',
    variables: ['data_type', 'data', 'viz_type'],
  },
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Design a system architecture',
    category: 'System',
    content:
      'Design a system for {{system_name}} with these requirements:\n\nFunctional:\n{{functional_requirements}}\n\nNon-functional:\n{{non_functional_requirements}}\n\nScale: {{scale}}\n\nProvide:\n1. High-level architecture diagram (text description)\n2. Component breakdown\n3. Data flow\n4. Technology choices with rationale\n5. Scalability considerations\n6. Failure modes and recovery',
    variables: ['system_name', 'functional_requirements', 'non_functional_requirements', 'scale'],
  },
  {
    id: 'creative-story',
    name: 'Creative Story',
    description: 'Write a creative story or narrative',
    category: 'Creative',
    content:
      'Write a {{genre}} story about {{subject}}.\n\nSetting: {{setting}}\nTone: {{tone}}\nLength: {{length}}\n\nMake it engaging with vivid descriptions and compelling characters.',
    variables: ['genre', 'subject', 'setting', 'tone', 'length'],
  },
]

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { key: 'Coding', label: 'Coding', icon: Code2, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { key: 'Writing', label: 'Writing', icon: PenLine, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { key: 'Analysis', label: 'Analysis', icon: BarChart3, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  { key: 'System', label: 'System', icon: Settings2, color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  { key: 'Creative', label: 'Creative', icon: Sparkles, color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { key: 'Custom', label: 'Custom', icon: Plus, color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
]

function getCategoryConfig(key: string) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PromptTemplatesPanelProps {
  onSelectPrompt: (prompt: string) => void
}

export function PromptTemplatesPanel({ onSelectPrompt }: PromptTemplatesPanelProps) {
  const [customTemplates, setCustomTemplates] = useState<PromptTemplate[]>([])
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<PromptTemplate>>({
    name: '',
    description: '',
    category: 'Custom',
    content: '',
  })

  const allTemplates = useMemo(() => [...BUILTIN_TEMPLATES, ...customTemplates], [customTemplates])

  const templatesByCategory = useMemo(() => {
    const map = new Map<string, PromptTemplate[]>()
    for (const t of allTemplates) {
      const cat = t.category || 'Custom'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(t)
    }
    // Also add Custom category even if empty
    if (!map.has('Custom')) map.set('Custom', [])
    return map
  }, [allTemplates])

  // ---- Resolve template with variable values ----
  const resolveTemplate = (template: PromptTemplate, values: Record<string, string>) => {
    let resolved = template.content
    for (const v of template.variables) {
      resolved = resolved.replaceAll(`{{${v}}}`, values[v] || `[${v}]`)
    }
    return resolved
  }

  // ---- Open template dialog ----
  const openTemplate = (template: PromptTemplate) => {
    setActiveTemplate(template)
    const defaults: Record<string, string> = {}
    for (const v of template.variables) defaults[v] = ''
    setVariableValues(defaults)
  }

  // ---- Use template ----
  const handleUseTemplate = () => {
    if (!activeTemplate) return
    const prompt = resolveTemplate(activeTemplate, variableValues)
    onSelectPrompt(prompt)
    setActiveTemplate(null)
    setVariableValues({})
  }

  // ---- Create custom template ----
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g)
    if (!matches) return []
    return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))]
  }

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return
    const variables = extractVariables(newTemplate.content!)
    const template: PromptTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name!,
      description: newTemplate.description || '',
      category: newTemplate.category || 'Custom',
      content: newTemplate.content!,
      variables,
    }
    setCustomTemplates((prev) => [...prev, template])
    setShowCreateDialog(false)
    setNewTemplate({ name: '', description: '', category: 'Custom', content: '' })
  }

  const handleDeleteCustom = (id: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  // ---- Preview of resolved prompt ----
  const resolvedPreview = activeTemplate ? resolveTemplate(activeTemplate, variableValues) : ''

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold">Prompt Templates</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1 px-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3" /> New
          </Button>
        </div>
      </div>

      {/* Templates list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {CATEGORIES.filter((c) => templatesByCategory.has(c.key)).map((cat) => {
            const CatIcon = cat.icon
            const templates = templatesByCategory.get(cat.key) || []
            return (
              <div key={cat.key}>
                <div className="flex items-center gap-1.5 mb-2">
                  <CatIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {cat.label}
                  </span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1 ml-auto">
                    {templates.length}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {templates.map((template) => {
                    const config = getCategoryConfig(template.category)
                    const isCustom = template.id.startsWith('custom-')
                    return (
                      <button
                        key={template.id}
                        className="w-full text-left rounded-lg border border-border p-2.5 hover:bg-accent/50 transition-colors group"
                        onClick={() => openTemplate(template)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-medium truncate">{template.name}</span>
                              <Badge
                                variant="outline"
                                className={`text-[8px] h-3.5 px-1 border-0 ${config.color}`}
                              >
                                {template.category}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {template.variables.map((v) => (
                                <span
                                  key={v}
                                  className="inline-flex items-center text-[9px] bg-muted/50 rounded px-1.5 py-0.5 font-mono text-muted-foreground"
                                >
                                  {`{{${v}}}`}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isCustom && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteCustom(template.id)
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      </button>
                    )
                  })}
                  {cat.key === 'Custom' && templates.length === 0 && (
                    <div className="text-[10px] text-muted-foreground text-center py-3">
                      No custom templates yet. Click &quot;New&quot; to create one.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* ---- Template Variable Dialog ---- */}
      <Dialog open={!!activeTemplate} onOpenChange={(open) => !open && setActiveTemplate(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Copy className="w-4 h-4 text-emerald-500" />
              {activeTemplate?.name}
            </DialogTitle>
            <DialogDescription>{activeTemplate?.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-4 pr-2">
              {/* Variable inputs */}
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Fill in variables</div>
                {activeTemplate?.variables.map((v) => (
                  <div key={v} className="space-y-1">
                    <Label className="text-xs font-mono">{`{{${v}}}`}</Label>
                    {v.includes('code') || v.includes('content') || v.includes('data') || v.includes('requirements') || v === 'error_message' ? (
                      <Textarea
                        value={variableValues[v] || ''}
                        onChange={(e) =>
                          setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))
                        }
                        placeholder={`Enter ${v.replace(/_/g, ' ')}...`}
                        className="min-h-[80px] text-xs font-mono"
                      />
                    ) : (
                      <Input
                        value={variableValues[v] || ''}
                        onChange={(e) =>
                          setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))
                        }
                        placeholder={`Enter ${v.replace(/_/g, ' ')}...`}
                        className="h-8 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Preview */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">Preview</div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {resolvedPreview}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveTemplate(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleUseTemplate}
            >
              <Copy className="w-3.5 h-3.5" /> Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Create Custom Template Dialog ---- */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-500" /> Create Custom Template
            </DialogTitle>
            <DialogDescription>
              Create a reusable prompt template with {{variable}} placeholders.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 pr-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Template Name</Label>
                <Input
                  value={newTemplate.name || ''}
                  onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Unit Test Generator"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input
                  value={newTemplate.description || ''}
                  onChange={(e) => setNewTemplate((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this template"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select
                  value={newTemplate.category || 'Custom'}
                  onValueChange={(v) => setNewTemplate((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Template Content{' '}
                  <span className="text-muted-foreground font-normal">
                    (use {'{{variable_name}}'} for placeholders)
                  </span>
                </Label>
                <Textarea
                  value={newTemplate.content || ''}
                  onChange={(e) => setNewTemplate((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Write your prompt template here. Use {{variable}} for placeholders that will be filled in later."
                  className="min-h-[160px] text-xs font-mono"
                />
              </div>
              {newTemplate.content && extractVariables(newTemplate.content).length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">Detected variables:</div>
                  <div className="flex flex-wrap gap-1">
                    {extractVariables(newTemplate.content).map((v) => (
                      <Badge key={v} variant="outline" className="text-[10px] h-5 font-mono">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-violet-600 hover:bg-violet-700"
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name || !newTemplate.content}
            >
              <Plus className="w-3.5 h-3.5" /> Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
