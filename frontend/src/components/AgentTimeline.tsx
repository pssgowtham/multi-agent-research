import type { ResearchResult } from '@/hooks/useStream'

const AGENT_COLORS: Record<string, string> = {
  planner: 'bg-purple-500',
  search: 'bg-blue-500',
  analyst: 'bg-amber-500',
  writer: 'bg-teal-500',
  critic: 'bg-coral-500'
}

interface Props {
  timeline: ResearchResult['timeline']
}

const AGENT_ORDER = ['planner', 'search', 'analyst', 'writer', 'critic']

export function AgentTimeline({ timeline }: Props) {
  const total = Object.values(timeline).reduce((a, b) => a + b, 0)
  const sorted = AGENT_ORDER.filter(a => timeline[a] !== undefined)

  return (
    <div className="border rounded-lg p-4 bg-card">
      <h3 className="text-sm font-medium mb-3">Agent timeline</h3>
      <div className="space-y-2">
        {sorted.map((agent) => {
          const duration = timeline[agent]
          const pct = Math.max((duration / total) * 100, 2) // min 2% so bar is visible
          return (
            <div key={agent} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 capitalize">{agent}</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${AGENT_COLORS[agent] ?? 'bg-gray-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-12 text-right">{duration}s</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-3 border-t flex justify-between">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-xs font-medium">{total.toFixed(2)}s</span>
      </div>
    </div>
  )
}