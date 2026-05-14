'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { ThemeToggle } from './ThemeToggle'
import { ConversationSidebar } from './ConversationSidebar'
import { ChatWindow } from './ChatWindow'
import { AgentPanel } from './AgentPanel'
import { InputBar } from './InputBar'
import { ModelSelector } from './ModelSelector'
import { SettingsDialog } from './SettingsDialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Settings,
  PanelLeftClose,
  PanelLeft,
  Bot,
  Terminal,
  Sparkles,
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

      {/* Settings dialog */}
      <SettingsDialog />
    </div>
  )
}
