import { Badge } from '@/components/ui/badge'
import type { AgentUpdate } from '@/hooks/useStream'

const AGENT_LABELS: Record<string, string> = {
  planner: 'Planner',
  search: 'Search',
  analyst: 'Analyst',
  writer: 'Writer',
  critic: 'Critic'
}

const AGENT_DESCRIPTIONS: Record<string, string> = {
  planner: 'Breaking down your query into search strategies',
  search: 'Searching the web and retrieving relevant content',
  analyst: 'Analysing findings and extracting key insights',
  writer: 'Writing a polished research report',
  critic: 'Reviewing the report for quality and accuracy'
}

interface Props {
  agents: AgentUpdate[]
  status: 'idle' | 'streaming' | 'done' | 'error'
}

export function AgentStepper({ agents, status }: Props) {
  if (agents.length === 0) return null

  return (
    <div className="space-y-3 w-full">
      {agents.map((agent) => (
        <div
          key={agent.agent}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
        >
          <div className="mt-1">
            {agent.status === 'running' ? (
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-green-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {AGENT_LABELS[agent.agent]}
              </span>
              <Badge variant={agent.status === 'running' ? 'secondary' : 'default'}>
                {agent.status === 'running' ? 'Running' : 'Done'}
              </Badge>
              {agent.duration && (
                <span className="text-xs text-muted-foreground">
                  {agent.duration}s
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {AGENT_DESCRIPTIONS[agent.agent]}
            </p>
          </div>
        </div>
      ))}

      {status === 'streaming' && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Research in progress...
        </p>
      )}
    </div>
  )
}