import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '@/config'
import { BarChart3, Clock, CheckCircle, FileText } from 'lucide-react'

interface Stats {
  total_researches: number
  avg_duration: number
  approval_rate: number
  total_this_week: number
}

export function StatsBar() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/v1/stats`)
      return res.data
    },
    staleTime: 60000,
    retry: false,
  })

  if (!stats) return null

  const items = [
    {
      icon: FileText,
      label: 'Total Researches',
      value: stats.total_researches.toString(),
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      icon: Clock,
      label: 'Avg Duration',
      value: `${stats.avg_duration.toFixed(1)}s`,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      icon: CheckCircle,
      label: 'Approval Rate',
      value: `${stats.approval_rate.toFixed(0)}%`,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950/50',
    },
    {
      icon: BarChart3,
      label: 'This Week',
      value: stats.total_this_week.toString(),
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/50',
    },
  ]

  return (
    <div className="mt-8 pt-8 border-t">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 p-3 rounded-xl border bg-card"
          >
            <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
