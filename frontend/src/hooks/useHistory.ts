import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface HistoryItem {
  id: string
  query: string
  critic_approved: boolean
  iterations: number
  timeline: Record<string, number>
  created_at: string
}

export function useHistory() {
  return useQuery<HistoryItem[]>({
    queryKey: ['history'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:8000/api/v1/history')
      return res.data
    },
    staleTime: 30000
  })
}