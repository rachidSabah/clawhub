import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — Return all columns with their cards, sorted by position
export async function GET() {
  try {
    const columns = await db.kanbanColumn.findMany({
      orderBy: { position: 'asc' },
      include: {
        cards: { orderBy: { position: 'asc' } },
      },
    })
    return NextResponse.json(columns)
  } catch (error) {
    console.error('Kanban GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch kanban board' }, { status: 500 })
  }
}

// POST — Supports multiple actions via body { action, ...data }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      // ── Column actions ─────────────────────────────────────────────
      case 'addColumn': {
        const { title, color } = body
        if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

        // Get the max position to append at the end
        const maxCol = await db.kanbanColumn.findFirst({ orderBy: { position: 'desc' } })
        const position = (maxCol?.position ?? -1) + 1

        const column = await db.kanbanColumn.create({
          data: { title, color: color ?? null, position },
          include: { cards: true },
        })
        return NextResponse.json(column)
      }

      case 'updateColumn': {
        const { columnId, ...updates } = body
        if (!columnId) return NextResponse.json({ error: 'columnId is required' }, { status: 400 })

        const column = await db.kanbanColumn.update({
          where: { id: columnId },
          data: updates,
          include: { cards: { orderBy: { position: 'asc' } } },
        })
        return NextResponse.json(column)
      }

      case 'deleteColumn': {
        const { columnId } = body
        if (!columnId) return NextResponse.json({ error: 'columnId is required' }, { status: 400 })

        await db.kanbanColumn.delete({ where: { id: columnId } })
        return NextResponse.json({ success: true })
      }

      // ── Card actions ───────────────────────────────────────────────
      case 'addCard': {
        const { columnId, title, description, priority, color, tags, assignee, dueDate } = body
        if (!columnId || !title) return NextResponse.json({ error: 'columnId and title are required' }, { status: 400 })

        // Get max position in this column
        const maxCard = await db.kanbanCard.findFirst({
          where: { columnId },
          orderBy: { position: 'desc' },
        })
        const position = (maxCard?.position ?? -1) + 1

        const card = await db.kanbanCard.create({
          data: {
            columnId,
            title,
            description: description ?? null,
            priority: priority ?? 'medium',
            color: color ?? null,
            tags: tags ?? null,
            assignee: assignee ?? null,
            dueDate: dueDate ? new Date(dueDate) : null,
            position,
          },
        })
        return NextResponse.json(card)
      }

      case 'updateCard': {
        const { cardId, ...updates } = body
        if (!cardId) return NextResponse.json({ error: 'cardId is required' }, { status: 400 })

        // Handle dueDate conversion
        if (updates.dueDate) {
          updates.dueDate = new Date(updates.dueDate)
        } else if (updates.dueDate === null || updates.dueDate === '') {
          updates.dueDate = null
        }

        const card = await db.kanbanCard.update({
          where: { id: cardId },
          data: updates,
        })
        return NextResponse.json(card)
      }

      case 'deleteCard': {
        const { cardId } = body
        if (!cardId) return NextResponse.json({ error: 'cardId is required' }, { status: 400 })

        await db.kanbanCard.delete({ where: { id: cardId } })
        return NextResponse.json({ success: true })
      }

      case 'moveCard': {
        const { cardId, targetColumnId, newPosition } = body
        if (!cardId || !targetColumnId || newPosition === undefined) {
          return NextResponse.json({ error: 'cardId, targetColumnId, and newPosition are required' }, { status: 400 })
        }

        // Get the card being moved
        const card = await db.kanbanCard.findUnique({ where: { id: cardId } })
        if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

        // If moving to a different column, update positions in both columns
        if (card.columnId !== targetColumnId) {
          // Shift positions in the target column
          const targetCards = await db.kanbanCard.findMany({
            where: { columnId: targetColumnId, position: { gte: newPosition } },
            orderBy: { position: 'asc' },
          })

          for (let i = 0; i < targetCards.length; i++) {
            await db.kanbanCard.update({
              where: { id: targetCards[i].id },
              data: { position: newPosition + i + 1 },
            })
          }

          // Update the card's column and position
          const updatedCard = await db.kanbanCard.update({
            where: { id: cardId },
            data: { columnId: targetColumnId, position: newPosition },
          })

          // Re-index old column positions
          const oldCards = await db.kanbanCard.findMany({
            where: { columnId: card.columnId },
            orderBy: { position: 'asc' },
          })
          for (let i = 0; i < oldCards.length; i++) {
            await db.kanbanCard.update({
              where: { id: oldCards[i].id },
              data: { position: i },
            })
          }

          return NextResponse.json(updatedCard)
        } else {
          // Moving within the same column
          const cards = await db.kanbanCard.findMany({
            where: { columnId: targetColumnId },
            orderBy: { position: 'asc' },
          })

          // Remove the card from the list, re-insert at newPosition
          const filtered = cards.filter(c => c.id !== cardId)
          filtered.splice(newPosition, 0, card)

          // Update all positions
          for (let i = 0; i < filtered.length; i++) {
            await db.kanbanCard.update({
              where: { id: filtered[i].id },
              data: { position: i },
            })
          }

          const updatedCard = await db.kanbanCard.findUnique({ where: { id: cardId } })
          return NextResponse.json(updatedCard)
        }
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('Kanban POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
