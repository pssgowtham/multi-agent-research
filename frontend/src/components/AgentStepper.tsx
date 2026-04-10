import type { AgentUpdate } from '@/hooks/useStream'
import {
  Lightbulb,
  Search,
  BarChart3,
  PenTool,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

const AGENT_CONFIG: Record<string, {
  label: string
  description: string
  icon: typeof Lightbulb
  gradient: string
  bgLight: string
}> = {
  planner: {
    label: 'Planner',
    description: 'Breaking down your query into search strategies',
    icon: Lightbulb,
    gradient: 'from-amber-400 to-orange-500',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
  },
  search: {
    label: 'Search',
    description: 'Searching the web for relevant information',
    icon: Search,
    gradient: 'from-blue-400 to-cyan-500',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
  },
  analyst: {
    label: 'Analyst',
    description: 'Extracting insights and cross-referencing sources',
    icon: BarChart3,
    gradient: 'from-emerald-400 to-teal-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  writer: {
    label: 'Writer',
    description: 'Composing a polished research report',
    icon: PenTool,
    gradient: 'from-violet-400 to-purple-500',
    bgLight: 'bg-violet-50 dark:bg-violet-950/30',
  },
  critic: {
    label: 'Critic',
    description: 'Reviewing quality, accuracy, and completeness',
    icon: ShieldCheck,
    gradient: 'from-rose-400 to-pink-500',
    bgLight: 'bg-rose-50 dark:bg-rose-950/30',
  },
}

interface Props {
  agents: AgentUpdate[]
  status: 'idle' | 'streaming' | 'done' | 'error'
}

export function AgentStepper({ agents }: Props) {
  if (agents.length === 0) return null

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-[23px] top-[40px] bottom-[40px] w-px bg-border" />

      <div className="space-y-1 stagger-children">
        {agents.map((agent, index) => {
          const config = AGENT_CONFIG[agent.agent]
          if (!config) return null
          const Icon = config.icon
          const isRunning = agent.status === 'running'
          const isDone = agent.status === 'done'

          return (
            <div
              key={agent.agent}
              className={`relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                isRunning ? config.bgLight + ' border border-transparent' : 'hover:bg-accent/50'
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Icon */}
              <div className="relative z-10 shrink-0">
                {isRunning ? (
                  <div className="relative">
                    <div className={`w-[46px] h-[46px] rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${config.gradient} opacity-30 animate-ping`} style={{ animationDuration: '2s' }} />
                  </div>
                ) : isDone ? (
                  <div className={`w-[46px] h-[46px] rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-[46px] h-[46px] rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${isRunning ? 'text-foreground' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {config.label}
                  </span>
                  {isRunning && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Running
                    </span>
                  )}
                  {isDone && (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Complete
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config.description}
                </p>
              </div>

              {/* Duration */}
              {agent.duration && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
                  {agent.duration}s
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
