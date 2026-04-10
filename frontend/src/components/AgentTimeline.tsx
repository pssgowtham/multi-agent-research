import type { ResearchResult } from '@/hooks/useStream'
import { Clock, Zap } from 'lucide-react'

const AGENT_STYLES: Record<string, { gradient: string; label: string }> = {
  planner: { gradient: 'from-amber-400 to-orange-500', label: 'Planner' },
  search: { gradient: 'from-blue-400 to-cyan-500', label: 'Search' },
  analyst: { gradient: 'from-emerald-400 to-teal-500', label: 'Analyst' },
  writer: { gradient: 'from-violet-400 to-purple-500', label: 'Writer' },
  critic: { gradient: 'from-rose-400 to-pink-500', label: 'Critic' },
}

interface Props {
  timeline: ResearchResult['timeline']
}

const AGENT_ORDER = ['planner', 'search', 'analyst', 'writer', 'critic']

export function AgentTimeline({ timeline }: Props) {
  const total = Object.values(timeline).reduce((a, b) => a + b, 0)
  const sorted = AGENT_ORDER.filter(a => timeline[a] !== undefined)
  const maxDuration = Math.max(...sorted.map(a => timeline[a]))

  return (
    <div className="border rounded-2xl p-5 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Execution Timeline</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          <Zap className="w-3 h-3" />
          {total.toFixed(1)}s total
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((agent, index) => {
          const duration = timeline[agent]
          const pct = Math.max((duration / maxDuration) * 100, 4)
          const style = AGENT_STYLES[agent]

          return (
            <div key={agent} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">{style?.label || agent}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {((duration / total) * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs font-mono font-medium">{duration}s</span>
                </div>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${style?.gradient || 'from-gray-400 to-gray-500'} animate-bar-grow`}
                  style={{
                    width: `${pct}%`,
                    animationDelay: `${index * 150}ms`,
                    animationFillMode: 'backwards',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Compact bar visualization */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex rounded-full overflow-hidden h-1.5">
          {sorted.map((agent) => {
            const duration = timeline[agent]
            const pct = (duration / total) * 100
            const style = AGENT_STYLES[agent]
            return (
              <div
                key={agent}
                className={`bg-gradient-to-r ${style?.gradient || 'from-gray-400 to-gray-500'}`}
                style={{ width: `${pct}%` }}
                title={`${style?.label}: ${duration}s`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
