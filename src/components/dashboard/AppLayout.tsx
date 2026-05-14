'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { ThemeToggle } from './ThemeToggle'
import { ConversationSidebar } from './ConversationSidebar'
import { ChatWindow } from './ChatWindow'
import { AgentPanel } from './AgentPanel'
import { InputBar } from './InputBar'
import { ModelSelector } from './ModelSelector'
import { SettingsDialog } from './SettingsDialog'
import { ControlCenter } from './ControlCenter'
import { AgentSwarmPanel } from './AgentSwarmPanel'
import { FileTreePanel } from './FileTreePanel'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Settings,
  PanelLeftClose,
  PanelLeft,
  Bot,
  Terminal,
  LayoutDashboard,
  PanelRightClose,
  Cpu,
  Folder,
} from 'lucide-react'

export function AppLayout() {
  const {
    isSidebarOpen,
    toggleSidebar,
    isAgentMode,
    toggleAgentMode,
    setSettingsOpen,
    activeProvider,
    loadProviders,
    loadSettings,
    loadConversations,
  } = useAppStore()

  const [isDashboardOpen, setIsDashboardOpen] = useState(false)
  const [dashboardTab, setDashboardTab] = useState('control')

  useEffect(() => {
    loadProviders()
    loadSettings()
    loadConversations()
  }, [loadProviders, loadSettings, loadConversations])

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          'shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
          isSidebarOpen ? 'w-72' : 'w-0'
        )}
      >
        <ConversationSidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-12 shrink-0 border-b border-border flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </Button>

            <div className="h-5 w-px bg-border" />

            <ModelSelector />

            {activeProvider && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="max-w-[100px] truncate">{activeProvider.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Agent Mode Toggle */}
            <Button
              variant={isAgentMode ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-7 text-xs gap-1.5',
                isAgentMode && 'bg-violet-600 hover:bg-violet-700 text-white'
              )}
              onClick={toggleAgentMode}
            >
              {isAgentMode ? (
                <>
                  <Bot className="w-3.5 h-3.5" />
                  Agent Mode
                </>
              ) : (
                <>
                  <Terminal className="w-3.5 h-3.5" />
                  Chat Mode
                </>
              )}
            </Button>

            <div className="h-5 w-px bg-border" />

            {/* Dashboard Toggle */}
            <Button
              variant={isDashboardOpen ? 'default' : 'ghost'}
              size="icon"
              className={cn('h-8 w-8', isDashboardOpen && 'bg-cyan-600 hover:bg-cyan-700 text-white')}
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
            >
              {isDashboardOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <LayoutDashboard className="w-4 h-4" />
              )}
            </Button>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Chat area */}
        <ChatWindow />

        {/* Agent panel (shown when in agent mode) */}
        <AgentPanel />

        {/* Input bar */}
        <InputBar />
      </div>

      {/* Dashboard Panel (right side) */}
      <div
        className={cn(
          'shrink-0 border-l border-border transition-all duration-300 ease-in-out overflow-hidden bg-background',
          isDashboardOpen ? 'w-96' : 'w-0'
        )}
      >
        <div className="w-96 h-full flex flex-col">
          <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="flex-1 flex flex-col min-h-0">
            <div className="shrink-0 border-b border-border px-3 pt-3 pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">Dashboard</span>
              </div>
              <TabsList className="w-full grid grid-cols-3 h-8">
                <TabsTrigger value="control" className="text-[10px] gap-1">
                  <Cpu className="w-3 h-3" />
                  Control
                </TabsTrigger>
                <TabsTrigger value="swarm" className="text-[10px] gap-1">
                  <Bot className="w-3 h-3" />
                  Swarm
                </TabsTrigger>
                <TabsTrigger value="files" className="text-[10px] gap-1">
                  <Folder className="w-3 h-3" />
                  Files
                </TabsTrigger>
              </TabsList>
            </div>
            <ScrollArea className="flex-1">
              <TabsContent value="control" className="p-4 m-0">
                <ControlCenter />
              </TabsContent>
              <TabsContent value="swarm" className="p-4 m-0">
                <AgentSwarmPanel />
              </TabsContent>
              <TabsContent value="files" className="p-4 m-0">
                <FileTreePanel />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {/* Settings dialog */}
      <SettingsDialog />
    </div>
  )
}
