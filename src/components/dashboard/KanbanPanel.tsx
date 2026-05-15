'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  User,
  Tag,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────────────────────

interface KanbanCardType {
  id: string
  title: string
  description: string | null
  color: string | null
  priority: string
  tags: string | null
  assignee: string | null
  dueDate: string | null
  position: number
  columnId: string
  createdAt: string
  updatedAt: string
}

interface KanbanColumnType {
  id: string
  title: string
  position: number
  color: string | null
  cards: KanbanCardType[]
}

// ─── API helpers ────────────────────────────────────────────────────────────

async function kanbanRequest(action: string, data?: Record<string, unknown>) {
  const res = await fetch('/api/kanban', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
  })
  if (!res.ok) throw new Error('Kanban API error')
  return res.json()
}

async function fetchKanbanBoard() {
  const res = await fetch('/api/kanban')
  if (!res.ok) throw new Error('Failed to fetch kanban')
  return res.json()
}

// ─── Default columns config ─────────────────────────────────────────────────

const DEFAULT_COLUMNS = [
  { title: 'Backlog', color: 'bg-blue-500' },
  { title: 'To Do', color: 'bg-amber-500' },
  { title: 'In Progress', color: 'bg-cyan-500' },
  { title: 'Review', color: 'bg-purple-500' },
  { title: 'Done', color: 'bg-emerald-500' },
]

// ─── Priority config ────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
  medium: { label: 'Med', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  high: { label: 'High', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
}

// ─── Sortable Card Component ────────────────────────────────────────────────

function SortableCard({
  card,
  onDelete,
  onUpdate,
}: {
  card: KanbanCardType
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Record<string, unknown>) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const priority = PRIORITY_CONFIG[card.priority] ?? PRIORITY_CONFIG.medium
  const tags: string[] = card.tags ? JSON.parse(card.tags) : []

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== card.title) {
      onUpdate(card.id, { title: editTitle.trim() })
    }
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-xl border border-border bg-card p-3 space-y-2 transition-shadow hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Card header */}
      <div className="flex items-start gap-1.5">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground shrink-0"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') { setEditTitle(card.title); setEditing(false) }
              }}
              className="h-6 text-xs px-1.5"
              autoFocus
            />
          ) : (
            <p
              className="text-xs font-medium leading-snug cursor-pointer hover:underline"
              onClick={() => setEditing(true)}
            >
              {card.title}
            </p>
          )}
        </div>
        <div className="shrink-0">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onDelete(card.id)}
                className="text-[9px] text-destructive hover:underline"
              >
                Del?
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-[9px] text-muted-foreground hover:underline"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {card.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-2 pl-5">
          {card.description}
        </p>
      )}

      {/* Priority badge */}
      <div className="pl-5">
        <span
          className={cn(
            'inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold',
            priority.bg,
            priority.color
          )}
        >
          {priority.label}
        </span>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[8px] h-4 px-1.5 gap-0.5"
            >
              <Tag className="w-2 h-2" />
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: assignee + due date */}
      {(card.assignee || card.dueDate) && (
        <div className="flex items-center gap-2 pl-5 text-[9px] text-muted-foreground">
          {card.assignee && (
            <span className="flex items-center gap-0.5">
              <User className="w-2.5 h-2.5" />
              {card.assignee}
            </span>
          )}
          {card.dueDate && (
            <span className="flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(card.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Column Component ───────────────────────────────────────────────────────

function KanbanColumnComponent({
  column,
  onAddCard,
  onDeleteCard,
  onUpdateCard,
  onDeleteColumn,
  newCardTitle,
  setNewCardTitle,
  showAddCard,
  setShowAddCard,
}: {
  column: KanbanColumnType
  onAddCard: (columnId: string, title: string) => void
  onDeleteCard: (cardId: string) => void
  onUpdateCard: (cardId: string, updates: Record<string, unknown>) => void
  onDeleteColumn: (columnId: string) => void
  newCardTitle: string
  setNewCardTitle: (v: string) => void
  showAddCard: string | null
  setShowAddCard: (v: string | null) => void
}) {
  const [showDeleteColConfirm, setShowDeleteColConfirm] = useState(false)

  return (
    <div className="flex flex-col w-[260px] shrink-0 rounded-xl border border-border bg-muted/20">
      {/* Column header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className={cn('w-2.5 h-2.5 rounded-full', column.color || 'bg-muted-foreground')} />
        <h3 className="text-xs font-semibold flex-1 truncate">{column.title}</h3>
        <Badge variant="outline" className="text-[9px] h-4 px-1.5">
          {column.cards.length}
        </Badge>
        {showDeleteColConfirm ? (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onDeleteColumn(column.id)}
              className="text-[9px] text-destructive hover:underline"
            >
              Del?
            </button>
            <button
              onClick={() => setShowDeleteColConfirm(false)}
              className="text-[9px] text-muted-foreground hover:underline"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteColConfirm(true)}
            className="p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Cards list */}
      <SortableContext
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <ScrollArea className="flex-1 max-h-[calc(100vh-220px)]">
          <div className="p-2 space-y-2">
            {column.cards.length === 0 && (
              <div className="text-center py-6 text-[10px] text-muted-foreground">
                No cards yet
              </div>
            )}
            {column.cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                onDelete={onDeleteCard}
                onUpdate={onUpdateCard}
              />
            ))}
          </div>
        </ScrollArea>
      </SortableContext>

      {/* Add card */}
      <div className="p-2 border-t border-border">
        {showAddCard === column.id ? (
          <div className="space-y-1.5">
            <Input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Card title..."
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCardTitle.trim()) {
                  onAddCard(column.id, newCardTitle.trim())
                  setNewCardTitle('')
                  setShowAddCard(null)
                }
                if (e.key === 'Escape') {
                  setNewCardTitle('')
                  setShowAddCard(null)
                }
              }}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-6 text-[10px] gap-1 flex-1"
                disabled={!newCardTitle.trim()}
                onClick={() => {
                  if (newCardTitle.trim()) {
                    onAddCard(column.id, newCardTitle.trim())
                    setNewCardTitle('')
                    setShowAddCard(null)
                  }
                }}
              >
                <Plus className="w-2.5 h-2.5" /> Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px]"
                onClick={() => {
                  setNewCardTitle('')
                  setShowAddCard(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => setShowAddCard(column.id)}
          >
            <Plus className="w-3 h-3" /> Add Card
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

export function KanbanPanel() {
  const [columns, setColumns] = useState<KanbanColumnType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [newCardTitle, setNewCardTitle] = useState('')
  const [showAddCard, setShowAddCard] = useState<string | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // ── Load board ──────────────────────────────────────────────────────
  const loadBoard = useCallback(async () => {
    try {
      const data = await fetchKanbanBoard()
      if (Array.isArray(data) && data.length === 0) {
        // Seed default columns
        for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
          await kanbanRequest('addColumn', {
            title: DEFAULT_COLUMNS[i].title,
            color: DEFAULT_COLUMNS[i].color,
          })
        }
        const seeded = await fetchKanbanBoard()
        setColumns(seeded)
      } else {
        setColumns(data)
      }
    } catch (err) {
      console.error('Failed to load kanban board:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBoard()
  }, [loadBoard])

  // ── Column actions ──────────────────────────────────────────────────
  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return
    await kanbanRequest('addColumn', { title: newColumnTitle.trim() })
    setNewColumnTitle('')
    setShowAddColumn(false)
    await loadBoard()
  }

  const handleDeleteColumn = async (columnId: string) => {
    await kanbanRequest('deleteColumn', { columnId })
    await loadBoard()
  }

  // ── Card actions ────────────────────────────────────────────────────
  const handleAddCard = async (columnId: string, title: string) => {
    await kanbanRequest('addCard', { columnId, title })
    await loadBoard()
  }

  const handleDeleteCard = async (cardId: string) => {
    await kanbanRequest('deleteCard', { cardId })
    await loadBoard()
  }

  const handleUpdateCard = async (cardId: string, updates: Record<string, unknown>) => {
    await kanbanRequest('updateCard', { cardId, ...updates })
    await loadBoard()
  }

  // ── Drag and drop ───────────────────────────────────────────────────
  const findColumnForCard = (cardId: string): KanbanColumnType | undefined => {
    return columns.find((col) => col.cards.some((c) => c.id === cardId))
  }

  const handleDragStart = (event: DragEndEvent) => {
    setActiveCardId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCardId(null)
    const { active, over } = event
    if (!over) return

    const activeCardId = active.id as string
    const overId = over.id as string

    // Find source column
    const sourceColumn = findColumnForCard(activeCardId)
    if (!sourceColumn) return

    // Determine target column and new position
    let targetColumnId: string
    let newPosition: number

    // Check if dropped over a card or a column
    const overColumn = columns.find((col) => col.id === overId)
    if (overColumn) {
      // Dropped over a column (empty area)
      targetColumnId = overId
      newPosition = overColumn.cards.length
    } else {
      // Dropped over another card
      const targetColumn = findColumnForCard(overId)
      if (!targetColumn) return
      targetColumnId = targetColumn.id
      const overCardIndex = targetColumn.cards.findIndex((c) => c.id === overId)
      newPosition = overCardIndex >= 0 ? overCardIndex : targetColumn.cards.length
    }

    // Don't do anything if same position
    if (sourceColumn.id === targetColumnId) {
      const currentIndex = sourceColumn.cards.findIndex((c) => c.id === activeCardId)
      if (currentIndex === newPosition) return
    }

    // Optimistic update
    setColumns((prev) => {
      const newCols = prev.map((col) => ({ ...col, cards: [...col.cards] }))
      const srcCol = newCols.find((c) => c.id === sourceColumn.id)
      const tgtCol = newCols.find((c) => c.id === targetColumnId)
      if (!srcCol || !tgtCol) return prev

      const cardIndex = srcCol.cards.findIndex((c) => c.id === activeCardId)
      if (cardIndex < 0) return prev
      const [card] = srcCol.cards.splice(cardIndex, 1)

      tgtCol.cards.splice(newPosition, 0, card)

      // Re-index positions
      srcCol.cards.forEach((c, i) => { c.position = i })
      tgtCol.cards.forEach((c, i) => { c.position = i })

      return newCols
    })

    // Persist to server
    try {
      await kanbanRequest('moveCard', {
        cardId: activeCardId,
        targetColumnId,
        newPosition,
      })
    } catch {
      // Revert on error
      await loadBoard()
    }
  }

  // ── Active card for drag overlay ────────────────────────────────────
  const activeCard = activeCardId
    ? columns.flatMap((c) => c.cards).find((c) => c.id === activeCardId)
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <LayoutGrid className="w-6 h-6 animate-pulse" />
          <span className="text-xs">Loading board...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="shrink-0 px-3 py-2 border-b border-border flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold">Kanban Board</span>
        <span className="text-[9px] text-muted-foreground">
          {columns.reduce((acc, col) => acc + col.cards.length, 0)} cards across{' '}
          {columns.length} columns
        </span>
      </div>

      {/* Board content — horizontal scroll */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1" orientation="horizontal">
          <div className="flex gap-3 p-3 min-h-full">
            {columns.map((column) => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
                onUpdateCard={handleUpdateCard}
                onDeleteColumn={handleDeleteColumn}
                newCardTitle={newCardTitle}
                setNewCardTitle={setNewCardTitle}
                showAddCard={showAddCard}
                setShowAddCard={setShowAddCard}
              />
            ))}

            {/* Add Column */}
            <div className="w-[260px] shrink-0">
              {showAddColumn ? (
                <div className="rounded-xl border border-dashed border-border p-3 space-y-1.5">
                  <Input
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="Column title..."
                    className="h-7 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn()
                      if (e.key === 'Escape') {
                        setNewColumnTitle('')
                        setShowAddColumn(false)
                      }
                    }}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-[10px] gap-1 flex-1"
                      disabled={!newColumnTitle.trim()}
                      onClick={handleAddColumn}
                    >
                      <Plus className="w-2.5 h-2.5" /> Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px]"
                      onClick={() => {
                        setNewColumnTitle('')
                        setShowAddColumn(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 border-dashed"
                  onClick={() => setShowAddColumn(true)}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Column
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>

        <DragOverlay>
          {activeCard ? (
            <div className="rounded-xl border border-border bg-card p-3 space-y-2 shadow-xl w-[236px] rotate-2">
              <p className="text-xs font-medium">{activeCard.title}</p>
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold',
                  PRIORITY_CONFIG[activeCard.priority]?.bg ?? PRIORITY_CONFIG.medium.bg,
                  PRIORITY_CONFIG[activeCard.priority]?.color ?? PRIORITY_CONFIG.medium.color
                )}
              >
                {PRIORITY_CONFIG[activeCard.priority]?.label ?? 'Med'}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
