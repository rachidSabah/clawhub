'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { ThemeToggle } from './ThemeToggle'
import { SettingsDialog } from './SettingsDialog'
import { Sidebar } from './Sidebar'
import { ChatWindow } from './ChatWindow'
import { InputBar } from './InputBar'
import { ModelSelector } from './ModelSelector'
import { RightPanel } from './RightPanel'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Settings,
  PanelLeftClose,
  PanelLeft,
  Bot,
  Terminal,
  PanelRightClose,
  PanelRight,
} from 'lucide-react'

export function AppLayout() {
  const {
    isSidebarOpen, toggleSidebar,
    isAgentMode, toggleAgentMode,
    setSettingsOpen,
    activeProvider, loadProviders, loadSettings, loadConversations,
    isRightPanelOpen, toggleRightPanel,
  } = useAppStore()

  useEffect(() => {
    loadProviders()
    loadSettings()
    loadConversations()
  }, [loadProviders, loadSettings, loadConversations])

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      {/* Left Sidebar */}
      <div className={cn('shrink-0 transition-all duration-300 overflow-hidden', isSidebarOpen ? 'w-[280px]' : 'w-0')}>
        <Sidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-12 shrink-0 border-b border-border flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </Button>
            <div className="h-5 w-px bg-border" />
            <ModelSelector />
            {activeProvider && (
              <span className="text-xs text-muted-foreground max-w-[100px] truncate">{activeProvider.name}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant={isAgentMode ? 'default' : 'outline'} size="sm"
              className={cn('h-7 text-xs gap-1.5', isAgentMode && 'bg-emerald-600 hover:bg-emerald-700 text-white')}
              onClick={toggleAgentMode}>
              {isAgentMode ? <><Bot className="w-3.5 h-3.5" /> Agent</> : <><Terminal className="w-3.5 h-3.5" /> Chat</>}
            </Button>
            <div className="h-5 w-px bg-border" />
            <Button variant={isRightPanelOpen ? 'default' : 'ghost'} size="icon"
              className={cn('h-8 w-8', isRightPanelOpen && 'bg-emerald-600 hover:bg-emerald-700 text-white')}
              onClick={toggleRightPanel}>
              {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>
        <ChatWindow />
        <InputBar />
      </div>

      {/* Right Panel */}
      <div className={cn('shrink-0 border-l border-border transition-all duration-300 overflow-hidden', isRightPanelOpen ? 'w-[320px]' : 'w-0')}>
        <RightPanel />
      </div>

      <SettingsDialog />
    </div>
  )
}
