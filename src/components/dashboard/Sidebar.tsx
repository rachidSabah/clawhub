'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { createConversation, deleteConversation, fetchCronJobs, deleteCronJob, executeCronJob, fetchWorkspaces, deleteWorkspace, createWorkspace, createCronJob } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquarePlus, Bot, Trash2, Clock, FolderOpen, Plus, Cpu, Code2, Monitor, Sparkles, Play, Zap, ChevronDown, ChevronRight, Store, FileText, GitBranch, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isToday, isYesterday, subDays } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AgentGallery } from './AgentGallery'
import { DocumentsPanel } from './DocumentsPanel'
import { KanbanPanel } from './KanbanPanel'

const PREBUILT_AGENTS = [
  { id: 'clawhub-agent', name: 'ClawHub Agent', desc: 'Full AI capacity', icon: Sparkles, color: 'from-violet-500 to-purple-600' },
  { id: 'clawhub-coder', name: 'ClawHub Coder', desc: 'Coding & debugging', icon: Code2, color: 'from-cyan-500 to-blue-600' },
  { id: 'clawhub-fullstack', name: 'ClawHub Full-Stack', desc: 'Web app builder', icon: Cpu, color: 'from-emerald-500 to-teal-600' },
  { id: 'clawhub-sysadmin', name: 'ClawHub SysAdmin', desc: 'System admin', icon: Monitor, color: 'from-orange-500 to-red-600' },
]

export function Sidebar() {
  const { conversations, activeConversationId, setActiveConversation, loadConversations, loadMessages, clearAgentLog, sidebarTab, setSidebarTab, cronJobs, loadCronJobs, workspaces, loadWorkspaces, swarmAgents, loadSwarmAgents } = useAppStore()
  const [showAgents, setShowAgents] = useState(true)
  const [newCronName, setNewCronName] = useState('')
  const [newCronSchedule, setNewCronSchedule] = useState('*/5 * * * *')
  const [newCronCommand, setNewCronCommand] = useState('')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [galleryOpen, setGalleryOpen] = useState(false)

  useEffect(() => { loadCronJobs(); loadWorkspaces(); loadSwarmAgents() }, [loadCronJobs, loadWorkspaces, loadSwarmAgents])

  const grouped = useMemo(() => {
    const g: Record<string, typeof conversations> = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] }
    for (const c of conversations) {
      if (c.isArchived || c.isDeleted) continue
      const d = new Date(c.updatedAt)
      if (isToday(d)) g['Today'].push(c)
      else if (isYesterday(d)) g['Yesterday'].push(c)
      else if (d > subDays(new Date(), 7)) g['Previous 7 Days'].push(c)
      else g['Older'].push(c)
    }
    return Object.entries(g).filter(([, items]) => items.length > 0)
  }, [conversations])

  const handleNewChat = async (mode: 'chat' | 'agent' = 'chat') => {
    const conv = await createConversation({ title: mode === 'agent' ? 'New Agent Task' : 'New Chat', mode })
    await loadConversations()
    setActiveConversation(conv.id)
    clearAgentLog()
  }

  const handleSelect = async (id: string) => { setActiveConversation(id); await loadMessages(id); clearAgentLog() }
  const handleDelete = async (id: string) => { await deleteConversation(id); await loadConversations(); if (activeConversationId === id) setActiveConversation(null) }
  const handleStartAgent = async (agent: typeof PREBUILT_AGENTS[number]) => {
    const swarm = swarmAgents.find(a => a.name === agent.name)
    const conv = await createConversation({ title: `${agent.name} Task`, mode: 'agent', systemPrompt: swarm?.systemPrompt || undefined })
    await loadConversations(); setActiveConversation(conv.id); clearAgentLog()
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r border-border w-[280px]">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">INFOHAS ClawHub</span>
        </div>
        <div className="flex gap-1.5 mb-2">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => handleNewChat('chat')}>
            <MessageSquarePlus className="w-3.5 h-3.5" /> New Chat
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => handleNewChat('agent')}>
            <Bot className="w-3.5 h-3.5" /> Agent
          </Button>
        </div>
        {/* Quick Start Agents */}
        <button className="flex items-center gap-1.5 w-full text-xs font-medium text-muted-foreground hover:text-foreground py-1" onClick={() => setShowAgents(!showAgents)}>
          {showAgents ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} Quick Start
        </button>
        {showAgents && (
          <div className="grid grid-cols-2 gap-1 mt-1">
            {PREBUILT_AGENTS.map(a => { const I = a.icon; return (
              <button key={a.id} className="flex flex-col items-start gap-0.5 rounded-lg border border-border p-1.5 text-left hover:bg-accent/50 transition-colors" onClick={() => handleStartAgent(a)}>
                <div className="flex items-center gap-1"><div className={cn('w-4 h-4 rounded flex items-center justify-center bg-gradient-to-br', a.color)}><I className="w-2.5 h-2.5 text-white" /></div><span className="text-[10px] font-medium">{a.name}</span></div>
                <span className="text-[8px] text-muted-foreground pl-5">{a.desc}</span>
              </button>
            ) })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 px-2 pt-2">
          <TabsList className="w-full grid grid-cols-7 h-7">
            <TabsTrigger value="chats" className="text-[10px] gap-0.5"><MessageSquarePlus className="w-3 h-3" /></TabsTrigger>
            <TabsTrigger value="models" className="text-[10px] gap-0.5"><Cpu className="w-3 h-3" /></TabsTrigger>
            <TabsTrigger value="workspaces" className="text-[10px] gap-0.5"><FolderOpen className="w-3 h-3" /></TabsTrigger>
            <TabsTrigger value="cron" className="text-[10px] gap-0.5"><Clock className="w-3 h-3" /></TabsTrigger>
            <TabsTrigger value="agents" className="text-[10px] gap-0.5"><Bot className="w-3 h-3" /></TabsTrigger>
            <TabsTrigger value="documents" className="text-[10px] gap-0.5"><FileText className="w-3 h-3" /></TabsTrigger>
            <TabsTrigger value="kanban" className="text-[10px] gap-0.5"><LayoutGrid className="w-3 h-3" /></TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Chats Tab */}
          <TabsContent value="chats" className="p-2 m-0">
            {grouped.length === 0 ? <div className="text-center py-8 text-muted-foreground text-xs">No conversations yet</div> :
              grouped.map(([group, items]) => (
                <div key={group} className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{group}</div>
                  {items.map(conv => (
                    <div key={conv.id} className={cn('group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs mb-0.5 transition-colors', activeConversationId === conv.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50')}
                      onClick={() => handleSelect(conv.id)}>
                      <div className="shrink-0 flex items-center gap-0.5">
                        {conv.mode === 'agent' ? <Bot className="w-3.5 h-3.5 text-emerald-500" /> : <MessageSquarePlus className="w-3.5 h-3.5 text-muted-foreground" />}
                        {conv.title.startsWith('Branch:') && <GitBranch className="w-3 h-3 text-violet-500" />}
                      </div>
                      <span className="truncate flex-1">{conv.title}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); handleDelete(conv.id) }} className="p-0.5 rounded hover:bg-destructive/20 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            }
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="p-2 m-0 space-y-1.5">
            <div className="text-xs text-muted-foreground px-1 py-1">Model configurations will appear here. Add models in Settings.</div>
          </TabsContent>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces" className="p-2 m-0 space-y-2">
            <div className="flex gap-1">
              <Input value={newWorkspaceName} onChange={e => setNewWorkspaceName(e.target.value)} placeholder="Workspace name" className="h-7 text-xs flex-1" />
              <Button size="sm" className="h-7 text-xs gap-1" disabled={!newWorkspaceName} onClick={async () => { await createWorkspace({ name: newWorkspaceName }); setNewWorkspaceName(''); await loadWorkspaces() }}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {workspaces.map(ws => (
              <div key={ws.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border text-xs">
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.isDefault && <Badge variant="outline" className="text-[8px] h-3.5 px-1">Default</Badge>}
                <button onClick={async () => { await deleteWorkspace(ws.id); await loadWorkspaces() }} className="p-0.5 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            {workspaces.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No workspaces yet</div>}
          </TabsContent>

          {/* Cron Tab */}
          <TabsContent value="cron" className="p-2 m-0 space-y-2">
            <div className="rounded-lg border border-dashed border-border p-2 space-y-1.5">
              <Input value={newCronName} onChange={e => setNewCronName(e.target.value)} placeholder="Job name" className="h-7 text-xs" />
              <Input value={newCronSchedule} onChange={e => setNewCronSchedule(e.target.value)} placeholder="*/5 * * * *" className="h-7 text-xs font-mono" />
              <Input value={newCronCommand} onChange={e => setNewCronCommand(e.target.value)} placeholder="Shell command" className="h-7 text-xs" />
              <Button size="sm" className="h-7 text-xs gap-1 w-full" disabled={!newCronName || !newCronCommand} onClick={async () => {
                await createCronJob({ name: newCronName, schedule: newCronSchedule, taskType: 'shell', taskData: JSON.stringify({ command: newCronCommand }) })
                setNewCronName(''); setNewCronCommand(''); await loadCronJobs()
              }}>
                <Plus className="w-3 h-3" /> Add Job
              </Button>
            </div>
            {cronJobs.map(job => (
              <div key={job.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border text-xs">
                <Clock className={cn('w-3.5 h-3.5', job.isActive ? 'text-emerald-500' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{job.name}</div>
                  <div className="text-[9px] text-muted-foreground font-mono">{job.schedule}</div>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={async () => { await executeCronJob(job.id); await loadCronJobs() }} className="p-0.5 hover:text-emerald-500"><Play className="w-3 h-3" /></button>
                  <button onClick={async () => { await deleteCronJob(job.id); await loadCronJobs() }} className="p-0.5 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            {cronJobs.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No cron jobs yet</div>}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="p-0 m-0">
            <DocumentsPanel />
          </TabsContent>

          {/* Kanban Tab */}
          <TabsContent value="kanban" className="p-0 m-0">
            <KanbanPanel />
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="p-2 m-0 space-y-1.5">
            <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5" onClick={() => setGalleryOpen(true)}>
              <Store className="w-3.5 h-3.5" /> Browse Gallery
            </Button>
            {swarmAgents.map(a => (
              <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border text-xs">
                <div className={cn('w-2 h-2 rounded-full', a.status === 'running' ? 'bg-emerald-500' : a.status === 'error' ? 'bg-destructive' : 'bg-muted-foreground')} />
                <span className="flex-1 truncate">{a.name}</span>
                <Badge variant="outline" className="text-[8px] h-3.5 px-1">{a.status}</Badge>
              </div>
            ))}
            {swarmAgents.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">No swarm agents yet</div>}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Agent Gallery Dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-md max-h-[80vh] p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Store className="w-4 h-4" />
              Agent Template Gallery
            </DialogTitle>
          </DialogHeader>
          <AgentGallery />
        </DialogContent>
      </Dialog>
    </div>
  )
}
