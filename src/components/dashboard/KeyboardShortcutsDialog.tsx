'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Keyboard, Command, MessageSquarePlus, Settings, PanelLeft, PanelRight, Bot, X } from 'lucide-react'

// ---------------------------------------------------------------------------
// Shortcut definitions
// ---------------------------------------------------------------------------

interface Shortcut {
  keys: string[]
  label: string
  icon: React.ElementType
  category: string
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['Ctrl', 'K'], label: 'Command Palette', icon: Command, category: 'Navigation' },
  { keys: ['Ctrl', 'N'], label: 'New Chat', icon: MessageSquarePlus, category: 'Navigation' },
  { keys: ['Ctrl', ','], label: 'Settings', icon: Settings, category: 'Navigation' },
  { keys: ['Ctrl', 'B'], label: 'Toggle Sidebar', icon: PanelLeft, category: 'Layout' },
  { keys: ['Ctrl', 'J'], label: 'Toggle Right Panel', icon: PanelRight, category: 'Layout' },
  { keys: ['Ctrl', 'Enter'], label: 'Toggle Agent Mode', icon: Bot, category: 'Chat' },
  { keys: ['Escape'], label: 'Close Dialog / Panel', icon: X, category: 'General' },
]

const CATEGORIES = ['Navigation', 'Layout', 'Chat', 'General']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-emerald-500" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and interact with ClawHub faster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const categoryShortcuts = SHORTCUTS.filter((s) => s.category === category)
            if (categoryShortcuts.length === 0) return null

            return (
              <div key={category}>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {category}
                </div>
                <div className="space-y-1">
                  {categoryShortcuts.map((shortcut) => {
                    const Icon = shortcut.icon
                    return (
                      <div
                        key={shortcut.label}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs">{shortcut.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <kbd className="inline-flex items-center justify-center rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground min-w-[20px]">
                                {key}
                              </kbd>
                              {i < shortcut.keys.length - 1 && (
                                <span className="text-[10px] text-muted-foreground">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {category !== CATEGORIES[CATEGORIES.length - 1] && (
                  <Separator className="mt-3" />
                )}
              </div>
            )
          })}
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-[10px] text-muted-foreground">
          <strong>Tip:</strong> On macOS, use <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted/50 px-1 py-0.5 font-mono text-[9px]">⌘</kbd> instead of <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted/50 px-1 py-0.5 font-mono text-[9px]">Ctrl</kbd> for most shortcuts.
        </div>
      </DialogContent>
    </Dialog>
  )
}
