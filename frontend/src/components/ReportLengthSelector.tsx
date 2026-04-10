import { FileText, BookOpen, Library } from 'lucide-react'

interface Length {
  id: string
  label: string
  description: string
  pages: string
  words: string
  icon: typeof FileText
  bars: number
}

const LENGTHS: Length[] = [
  {
    id: 'concise',
    label: 'Concise',
    description: 'Key points only, no fluff',
    pages: '< 1 page',
    words: '~400 words',
    icon: FileText,
    bars: 1,
  },
  {
    id: 'medium',
    label: 'Medium',
    description: 'Balanced depth and readability',
    pages: '1-2 pages',
    words: '~800 words',
    icon: BookOpen,
    bars: 2,
  },
  {
    id: 'long',
    label: 'Long',
    description: 'Comprehensive deep dive',
    pages: '3-4 pages',
    words: '~1600 words',
    icon: Library,
    bars: 3,
  },
]

interface Props {
  selected: string
  onChange: (id: string) => void
}

export function ReportLengthSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {LENGTHS.map((length) => {
        const isSelected = selected === length.id
        const Icon = length.icon

        return (
          <button
            key={length.id}
            onClick={() => onChange(length.id)}
            className={`group relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              isSelected
                ? 'border-purple-500 dark:border-purple-400 bg-purple-50/50 dark:bg-purple-950/30 shadow-sm'
                : 'border-transparent bg-card hover:border-muted-foreground/20 hover:shadow-sm'
            }`}
          >
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-purple-500" />
            )}

            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">{length.label}</span>
            </div>

            {/* Length indicator bars */}
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3].map((bar) => (
                <div
                  key={bar}
                  className={`h-1.5 rounded-full transition-colors ${
                    bar <= length.bars
                      ? isSelected
                        ? 'bg-purple-500'
                        : 'bg-muted-foreground/40'
                      : 'bg-muted'
                  }`}
                  style={{ width: `${20 + bar * 8}px` }}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground">{length.description}</p>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{length.words}</span>
              <span>{length.pages}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
