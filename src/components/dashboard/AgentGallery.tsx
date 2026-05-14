'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Bot, Sparkles, Code2, Cpu, Monitor, Search, Wrench, FileText, Globe, Shield, Database, Palette, Download, Star } from 'lucide-react'
import { createSwarmAgent } from '@/lib/api'
import { useAppStore } from '@/lib/store'

interface AgentTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: typeof Bot
  color: string
  systemPrompt: string
  tools: string[]
  author: string
  downloads: number
  rating: number
}

const TEMPLATES: AgentTemplate[] = [
  {
    id: 'full-stack-dev',
    name: 'Full-Stack Developer',
    description: 'Build complete web applications with React, Next.js, TypeScript, and databases. Handles frontend, backend, and deployment.',
    category: 'Development',
    icon: Code2,
    color: 'from-cyan-500 to-blue-600',
    systemPrompt: 'You are a senior full-stack developer specializing in React, Next.js, TypeScript, and PostgreSQL. You build production-ready applications with clean code, proper testing, and deployment configurations. Always use TypeScript, follow best practices, and explain your decisions.',
    tools: ['file_read', 'file_write', 'code_execute', 'shell_execute', 'web_search'],
    author: 'ClawHub Team',
    downloads: 2847,
    rating: 4.8,
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyze datasets, create visualizations, and generate insights from data using Python, pandas, and matplotlib.',
    category: 'Data',
    icon: Database,
    color: 'from-purple-500 to-violet-600',
    systemPrompt: 'You are an expert data analyst. You work with datasets using Python, pandas, numpy, and matplotlib. You clean data, perform statistical analysis, create visualizations, and derive actionable insights. Always show your code and explain findings clearly.',
    tools: ['code_execute', 'file_read', 'file_write', 'web_search', 'memory_store'],
    author: 'ClawHub Team',
    downloads: 1923,
    rating: 4.7,
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Audit code and infrastructure for security vulnerabilities. OWASP-aware, provides remediation guidance.',
    category: 'Security',
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    systemPrompt: 'You are a cybersecurity expert specializing in code auditing and penetration testing. You identify vulnerabilities following OWASP Top 10, provide severity ratings (Critical/High/Medium/Low), and give specific remediation advice with code examples. Always consider the full attack surface.',
    tools: ['file_read', 'shell_execute', 'web_search', 'code_execute'],
    author: 'ClawHub Team',
    downloads: 1205,
    rating: 4.6,
  },
  {
    id: 'technical-writer',
    name: 'Technical Writer',
    description: 'Create clear, comprehensive technical documentation for APIs, codebases, and systems.',
    category: 'Writing',
    icon: FileText,
    color: 'from-amber-500 to-orange-600',
    systemPrompt: 'You are a technical writer who creates clear, comprehensive documentation. You write API docs, README files, architecture docs, and user guides. You follow documentation best practices, include code examples, and structure content for easy navigation. Always use proper Markdown formatting.',
    tools: ['file_read', 'file_write', 'web_search', 'memory_search'],
    author: 'ClawHub Team',
    downloads: 1567,
    rating: 4.5,
  },
  {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    description: 'Manage infrastructure, CI/CD pipelines, Docker, Kubernetes, and cloud deployments.',
    category: 'Infrastructure',
    icon: Monitor,
    color: 'from-emerald-500 to-teal-600',
    systemPrompt: 'You are a DevOps engineer expert in Docker, Kubernetes, CI/CD (GitHub Actions, GitLab CI), AWS/GCP/Azure, Terraform, and monitoring. You create infrastructure as code, optimize deployment pipelines, and ensure system reliability. Always consider security, scalability, and cost optimization.',
    tools: ['shell_execute', 'file_read', 'file_write', 'schedule_task', 'web_search'],
    author: 'ClawHub Team',
    downloads: 987,
    rating: 4.4,
  },
  {
    id: 'ui-designer',
    name: 'UI/UX Designer',
    description: 'Design user interfaces, create component systems, and implement responsive layouts with Tailwind CSS.',
    category: 'Design',
    icon: Palette,
    color: 'from-pink-500 to-fuchsia-600',
    systemPrompt: 'You are a UI/UX designer specializing in modern web interfaces with Tailwind CSS, shadcn/ui, and React. You create responsive, accessible, and beautiful designs. You follow design systems, use proper spacing/typography, and ensure WCAG accessibility compliance. Always provide the complete component code.',
    tools: ['file_read', 'file_write', 'image_generate', 'web_search'],
    author: 'ClawHub Team',
    downloads: 1456,
    rating: 4.7,
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Conduct research, summarize papers, and synthesize information from multiple sources.',
    category: 'Research',
    icon: Search,
    color: 'from-teal-500 to-cyan-600',
    systemPrompt: 'You are a research assistant skilled in academic research, literature review, and information synthesis. You search for relevant papers, summarize findings, compare methodologies, and identify gaps. You cite sources properly and maintain objectivity. Always distinguish between established facts and hypotheses.',
    tools: ['web_search', 'document_query', 'memory_store', 'memory_search', 'file_write'],
    author: 'ClawHub Team',
    downloads: 2103,
    rating: 4.6,
  },
  {
    id: 'api-builder',
    name: 'API Architect',
    description: 'Design and implement RESTful and GraphQL APIs with proper schemas, auth, and documentation.',
    category: 'Development',
    icon: Globe,
    color: 'from-sky-500 to-cyan-600',
    systemPrompt: 'You are an API architect who designs and implements RESTful and GraphQL APIs. You create OpenAPI specifications, implement authentication (JWT, OAuth), design database schemas, and write comprehensive API documentation. You follow API design best practices, version properly, and handle error responses consistently.',
    tools: ['file_read', 'file_write', 'code_execute', 'shell_execute', 'web_search'],
    author: 'ClawHub Team',
    downloads: 1345,
    rating: 4.5,
  },
]

const CATEGORIES = ['All', 'Development', 'Data', 'Security', 'Writing', 'Infrastructure', 'Design', 'Research']

export function AgentGallery() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<AgentTemplate | null>(null)
  const [installing, setInstalling] = useState(false)
  const { loadSwarmAgents } = useAppStore()

  const filtered = TEMPLATES.filter(t => {
    if (category !== 'All' && t.category !== category) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleInstall = async (template: AgentTemplate) => {
    setInstalling(true)
    try {
      await createSwarmAgent({
        name: template.name,
        role: template.category,
        systemPrompt: template.systemPrompt,
        autoApprove: false,
        maxIterations: 10,
        isActive: true,
        isDaemon: false,
      })
      await loadSwarmAgents()
    } catch (error) {
      console.error('Install failed:', error)
    }
    setInstalling(false)
    setSelected(null)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-semibold">Agent Gallery</h3>
      </div>

      {/* Search & Filter */}
      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." className="text-sm h-8" />
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${category === cat ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-2">
          {filtered.map(template => {
            const I = template.icon
            return (
              <Card key={template.id} className="cursor-pointer hover:ring-1 hover:ring-emerald-500/50 transition-all" onClick={() => setSelected(template)}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center shrink-0`}>
                      <I className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{template.name}</span>
                        <Badge variant="outline" className="text-[8px] h-4 px-1">{template.category}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-amber-500" /> {template.rating}</span>
                        <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" /> {template.downloads}</span>
                        <span className="flex items-center gap-0.5"><Wrench className="w-2.5 h-2.5" /> {template.tools.length} tools</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">No agents found</div>
          )}
        </div>
      </ScrollArea>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selected.color} flex items-center justify-center`}>
                    <selected.icon className="w-4 h-4 text-white" />
                  </div>
                  {selected.name}
                </DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-medium">Tools:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selected.tools.map(t => (
                      <Badge key={t} variant="outline" className="text-[9px] h-4">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-medium">System Prompt:</span>
                  <div className="mt-1 p-2 rounded-lg bg-muted/50 text-muted-foreground text-[10px] max-h-[150px] overflow-auto">
                    {selected.systemPrompt}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500" /> {selected.rating}</span>
                  <span className="flex items-center gap-0.5"><Download className="w-3 h-3" /> {selected.downloads} installs</span>
                  <span>by {selected.author}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                <Button onClick={() => handleInstall(selected)} disabled={installing}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  {installing ? 'Installing...' : 'Install Agent'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
