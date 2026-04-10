import {
  ClipboardList,
  Newspaper,
  BarChart3,
  GraduationCap,
  Briefcase,
  TrendingUp,
} from 'lucide-react'

interface Style {
  id: string
  label: string
  description: string
  icon: typeof ClipboardList
  gradient: string
  bgLight: string
}

const STYLES: Style[] = [
  {
    id: 'executive',
    label: 'Executive briefing',
    description: 'Key insight summary, bullet points, business implications',
    icon: ClipboardList,
    gradient: 'from-indigo-500 to-blue-600',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
  {
    id: 'news',
    label: 'News article',
    description: 'Journalistic narrative, strong headline, concise',
    icon: Newspaper,
    gradient: 'from-rose-500 to-pink-600',
    bgLight: 'bg-rose-50 dark:bg-rose-950/30',
  },
  {
    id: 'statistical',
    label: 'Statistical analysis',
    description: 'Data-heavy, numbers, comparisons, tables',
    icon: BarChart3,
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    id: 'educational',
    label: 'Educational explainer',
    description: 'Beginner-friendly, definitions, analogies',
    icon: GraduationCap,
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    id: 'business',
    label: 'Business report',
    description: 'Market opportunities, ROI, strategic recommendations',
    icon: Briefcase,
    gradient: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50 dark:bg-violet-950/30',
  },
  {
    id: 'progress',
    label: 'Progress report',
    description: 'Current state, milestones, blockers, next steps',
    icon: TrendingUp,
    gradient: 'from-cyan-500 to-blue-600',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
]

interface Props {
  selected: string
  onChange: (id: string) => void
}

export function ReportTypeSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 stagger-children">
      {STYLES.map((style) => {
        const isSelected = selected === style.id
        const Icon = style.icon

        return (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={`group relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              isSelected
                ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm'
                : 'border-transparent bg-card hover:border-muted-foreground/20 hover:shadow-sm'
            }`}
          >
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-indigo-500" />
            )}

            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-2.5 shadow-sm`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-medium mb-0.5">{style.label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{style.description}</p>
          </button>
        )
      })}
    </div>
  )
}
