'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ExternalLink, Loader2 } from 'lucide-react'

interface SearchResult {
  url: string
  name: string
  snippet: string
  host_name: string
  rank: number
}

export function WebSearchPanel() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch('/api/chat/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), num: 10 }),
      })
      const data = await res.json()
      if (data.results) setResults(data.results)
    } catch (error) {
      console.error('Search failed:', error)
    }
    setSearching(false)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search the web..."
          className="text-sm"
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          className="h-9 bg-emerald-600 hover:bg-emerald-700 gap-1.5"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {results.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground mt-0.5">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-blue-500 hover:underline truncate">{r.name}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.snippet}</p>
                <span className="text-[10px] text-muted-foreground mt-1 block">{r.host_name}</span>
              </div>
            </div>
          </a>
        ))}
        {results.length === 0 && !searching && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Search the web for real-time information</p>
          </div>
        )}
        {searching && (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p className="text-xs">Searching...</p>
          </div>
        )}
      </div>
    </div>
  )
}
