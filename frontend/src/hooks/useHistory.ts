import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '@/config'

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
      const res = await axios.get(`${API_URL}/api/v1/history`)
      return res.data
    },
    staleTime: 30000
  })
}