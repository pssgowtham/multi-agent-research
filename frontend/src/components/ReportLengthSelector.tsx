interface Length {
  id: string
  label: string
  description: string
  pages: string
  words: string
}

const LENGTHS: Length[] = [
  {
    id: 'concise',
    label: 'Concise',
    description: 'Key points only, no fluff',
    pages: '< 1 page',
    words: '~400 words'
  },
  {
    id: 'medium',
    label: 'Medium',
    description: 'Balanced depth and readability',
    pages: '1-2 pages',
    words: '~800 words'
  },
  {
    id: 'long',
    label: 'Long',
    description: 'Comprehensive deep dive',
    pages: '3-4 pages',
    words: '~1600 words'
  }
]

interface Props {
  selected: string
  onChange: (id: string) => void
}

export function ReportLengthSelector({ selected, onChange }: Props) {
  return (
    <div className="mb-6">
      <p className="text-sm text-muted-foreground mb-3">Report length</p>
      <div className="grid grid-cols-3 gap-2">
        {LENGTHS.map(length => (
          <button
            key={length.id}
            onClick={() => onChange(length.id)}
            style={{
              border: selected === length.id ? '2px solid black' : '1px solid #e2e8f0',
              background: selected === length.id ? '#f1f5f9' : 'transparent'
            }}
            className="text-left p-3 rounded-lg transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{length.label}</span>
              <span className="text-xs text-muted-foreground">{length.pages}</span>
            </div>
            <p className="text-xs text-muted-foreground">{length.description}</p>
            <p className="text-xs text-muted-foreground mt-1">{length.words}</p>
          </button>
        ))}
      </div>
    </div>
  )
}