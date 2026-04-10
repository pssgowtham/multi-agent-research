import { useState } from 'react'
import { useHistory } from '@/hooks/useHistory'
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Bookmark,
  Loader2,
} from 'lucide-react'

interface Props {
  onSelect: (id: string, query: string) => void
  onDelete?: (id: string) => void
  onBookmark?: (id: string) => void
}

export function HistoryPanel({ onSelect, onDelete, onBookmark }: Props) {
  const { data: history, isLoading, refetch } = useHistory()
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    await onDelete?.(id)
    setDeletingId(null)
    refetch()
  }

  const handleBookmark = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onBookmark?.(id)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-8 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      <span className="text-xs">Loading history...</span>
    </div>
  )

  if (!history?.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Clock className="w-8 h-8 text-muted-foreground/30 mb-3" />
      <p className="text-xs text-muted-foreground">No research history yet.</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Your research will appear here.</p>
    </div>
  )

  const filtered = search
    ? history.filter(item => item.query.toLowerCase().includes(search.toLowerCase()))
    : history

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search history..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs border rounded-lg bg-background outline-none focus:ring-1 focus:ring-indigo-500/30 transition-shadow"
        />
      </div>

      {/* Results */}
      <div className="space-y-1.5 stagger-children">
        {filtered.map(item => {
          const total = Object.values(item.timeline).reduce((a: number, b: number) => a + b, 0)
          const date = new Date(item.created_at)
          const timeAgo = getTimeAgo(date)

          return (
            <div
              key={item.id}
              className="group relative"
            >
              <button
                onClick={() => onSelect(item.id, item.query)}
                className="w-full text-left p-3 rounded-xl border bg-card hover:bg-accent/50 transition-all hover:shadow-sm"
              >
                <p className="text-sm font-medium leading-snug pr-14 line-clamp-2">{item.query}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {timeAgo}
                  </span>
                  <span className="text-xs text-muted-foreground/40">|</span>
                  <span className="text-xs text-muted-foreground font-mono">{total.toFixed(1)}s</span>
                  <span className="text-xs text-muted-foreground/40">|</span>
                  {item.critic_approved ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      {item.iterations} iter
                    </span>
                  )}
                </div>
              </button>

              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {onBookmark && (
                  <button
                    onClick={(e) => handleBookmark(e, item.id)}
                    className="p-1.5 rounded-md hover:bg-accent transition-colors"
                    title="Bookmark"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    title="Delete"
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && search && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No results for "{search}"
          </p>
        )}
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
