import { CheckCircle2, XCircle, X } from 'lucide-react'

interface Props {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type, onClose }: Props) {
  return (
    <div className="fixed bottom-6 right-6 z-50 toast-enter">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
        type === 'success'
          ? 'bg-card border-green-200 dark:border-green-900'
          : 'bg-card border-red-200 dark:border-red-900'
      }`}>
        {type === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-accent transition-colors ml-2">
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
