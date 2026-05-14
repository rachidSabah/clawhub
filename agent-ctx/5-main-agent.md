# Task 5: Build RAG Document Upload System and Desktop Notifications

## Status: ✅ Completed

## Work Done

### API Routes Created
1. `/src/app/api/documents/route.ts` — POST (file upload + chunking) and GET (list documents)
2. `/src/app/api/documents/query/route.ts` — POST (RAG query with keyword retrieval + AI synthesis)
3. `/src/app/api/documents/[id]/route.ts` — DELETE (remove document from DB and disk)

### Components Created
1. `/src/components/dashboard/DocumentsPanel.tsx` — RAG document management panel with drag & drop upload, document list, and AI query
2. `/src/components/dashboard/NotificationCenter.tsx` — Desktop notification system with global pushNotification() function

### Components Updated
1. `/src/components/dashboard/AppLayout.tsx` — Added NotificationCenter in top bar
2. `/src/components/dashboard/Sidebar.tsx` — Added 6th Documents tab with DocumentsPanel
3. `/src/components/dashboard/RightPanel.tsx` — Added Docs tab with DocumentsPanel

### Key Technical Decisions
- Used existing `Memory` Prisma model with `type: 'context'` and `key: 'document:...'` prefix for document storage
- Text chunking splits by double-newline paragraphs, combining into ≤512 char chunks
- RAG retrieval uses simple keyword matching (no vector DB), scoring by word overlap count
- AI synthesis uses z-ai-web-dev-sdk with temperature 0.3 for factual, citation-based answers
- NotificationCenter uses module-level listener pattern for global notification dispatching
- Browser Notification API integration with auto-permission request
- Fixed lint error by refactoring useEffect from async callback to fetch .then() with cancelled flag

### Lint: 0 errors, 5 pre-existing warnings
