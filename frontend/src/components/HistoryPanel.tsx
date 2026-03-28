import { useHistory } from '@/hooks/useHistory'

interface Props {
  onSelect: (id: string, query: string) => void
}

export function HistoryPanel({ onSelect }: Props) {
  const { data: history, isLoading } = useHistory()

  if (isLoading) return (
    <p className="text-xs text-muted-foreground">Loading history...</p>
  )

  if (!history?.length) return (
    <p className="text-xs text-muted-foreground">No research history yet.</p>
  )

  return (
    <div className="space-y-2">
      {history.map(item => {
        const total = Object.values(item.timeline).reduce((a, b) => a + b, 0)
        const date = new Date(item.created_at).toLocaleDateString()

        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id, item.query)}
            className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <p className="text-sm font-medium truncate">{item.query}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{date}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{total.toFixed(1)}s</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className={`text-xs ${item.critic_approved ? 'text-green-500' : 'text-amber-500'}`}>
                {item.critic_approved ? 'Approved' : `${item.iterations} iter`}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}