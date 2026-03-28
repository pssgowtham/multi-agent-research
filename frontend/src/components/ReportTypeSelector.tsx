interface Style {
  id: string
  label: string
  description: string
  icon: string
}

const STYLES: Style[] = [
  {
    id: 'executive',
    label: 'Executive briefing',
    description: 'Key insight summary, bullet points, business implications',
    icon: '📋'
  },
  {
    id: 'news',
    label: 'News article',
    description: 'Journalistic narrative, strong headline, concise',
    icon: '📰'
  },
  {
    id: 'statistical',
    label: 'Statistical analysis',
    description: 'Data-heavy, numbers, comparisons, tables',
    icon: '📊'
  },
  {
    id: 'educational',
    label: 'Educational explainer',
    description: 'Beginner-friendly, definitions, analogies',
    icon: '🎓'
  },
  {
    id: 'business',
    label: 'Business report',
    description: 'Market opportunities, ROI, strategic recommendations',
    icon: '💼'
  },
  {
    id: 'progress',
    label: 'Progress report',
    description: 'Current state, milestones, blockers, next steps',
    icon: '📈'
  }
]

interface Props {
  selected: string
  onChange: (id: string) => void
}

export function ReportTypeSelector({ selected, onChange }: Props) {
  return (
    <div className="mb-6">
      <p className="text-sm text-muted-foreground mb-3">Report type</p>
      <div className="grid grid-cols-3 gap-2">
        {STYLES.map(style => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            style={{
              border: selected === style.id ? '2px solid black' : '1px solid #e2e8f0',
              background: selected === style.id ? '#f1f5f9' : 'transparent'
            }}
            className="text-left p-3 rounded-lg transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: '16px' }}>{style.icon}</span>
              <span className="text-xs font-medium">{style.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{style.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}