'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { createConversation, deleteConversation, fetchConversations } from '@/lib/api'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  MessageSquarePlus, Bot, Settings, PanelLeft, PanelRight, Search, Image,
  Download, Upload, FolderPlus, Cpu, ArrowLeftRight, Trash2, Terminal,
} from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const {
    toggleSidebar, toggleRightPanel, setSettingsOpen, toggleAgentMode,
    isAgentMode, activeConversationId, loadConversations, setActiveConversation, clearAgentLog,
  } = useAppStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleNewChat = useCallback(async () => {
    const conv = await createConversation({ title: 'New Chat', mode: 'chat' })
    await loadConversations()
    setActiveConversation(conv.id)
    clearAgentLog()
    setOpen(false)
  }, [loadConversations, setActiveConversation, clearAgentLog])

  const handleNewAgent = useCallback(async () => {
    const conv = await createConversation({ title: 'New Agent Task', mode: 'agent' })
    await loadConversations()
    setActiveConversation(conv.id)
    clearAgentLog()
    setOpen(false)
  }, [loadConversations, setActiveConversation, clearAgentLog])

  const handleClearHistory = useCallback(async () => {
    const convs = await fetchConversations()
    for (const c of convs) {
      await deleteConversation(c.id)
    }
    await loadConversations()
    setActiveConversation(null)
    setOpen(false)
  }, [loadConversations, setActiveConversation])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Chat">
          <CommandItem onSelect={handleNewChat}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            New Chat
            <CommandShortcut>Ctrl+N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleNewAgent}>
            <Bot className="mr-2 h-4 w-4" />
            New Agent Task
          </CommandItem>
          <CommandItem onSelect={() => runCommand(handleClearHistory)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All History
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setActiveConversation(null))}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Close Current Chat
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(toggleSidebar)}>
            <PanelLeft className="mr-2 h-4 w-4" />
            Toggle Sidebar
          </CommandItem>
          <CommandItem onSelect={() => runCommand(toggleRightPanel)}>
            <PanelRight className="mr-2 h-4 w-4" />
            Toggle Right Panel
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setSettingsOpen(true))}>
            <Settings className="mr-2 h-4 w-4" />
            Open Settings
            <CommandShortcut>Ctrl+,</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Mode">
          <CommandItem onSelect={() => runCommand(() => { if (isAgentMode) toggleAgentMode() })}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Switch to Chat Mode
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => { if (!isAgentMode) toggleAgentMode() })}>
            <Terminal className="mr-2 h-4 w-4" />
            Switch to Agent Mode
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Tools">
          <CommandItem onSelect={() => runCommand(() => {
            const store = useAppStore.getState()
            store.setSidebarTab('chats')
          })}>
            <Search className="mr-2 h-4 w-4" />
            Web Search
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            // trigger image generation via right panel
            const store = useAppStore.getState()
            if (!store.isRightPanelOpen) store.toggleRightPanel()
            store.setRightPanelTab('image')
          })}>
            <Image className="mr-2 h-4 w-4" />
            Generate Image
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.open('/api/export', '_blank'))}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Workspace">
          <CommandItem onSelect={() => runCommand(() => {
            const store = useAppStore.getState()
            store.setSidebarTab('workspaces')
          })}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Workspace
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            const store = useAppStore.getState()
            store.setSidebarTab('workspaces')
          })}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Switch Workspace
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Model">
          <CommandItem onSelect={() => runCommand(() => {
            const store = useAppStore.getState()
            if (!store.isRightPanelOpen) store.toggleRightPanel()
            store.setRightPanelTab('model')
          })}>
            <Cpu className="mr-2 h-4 w-4" />
            Configure Models
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => {
            // model comparison mode
            const store = useAppStore.getState()
            if (!store.isRightPanelOpen) store.toggleRightPanel()
            store.setRightPanelTab('tokens')
          })}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Token Usage &amp; Comparison
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
