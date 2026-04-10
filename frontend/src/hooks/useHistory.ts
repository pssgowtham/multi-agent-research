import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '@/config'

export interface HistoryItem {
  id: string
  query: string
  critic_approved: boolean
  iterations: number
  timeline: Record<string, number>
  report_type: string
  report_length: string
  is_bookmarked: boolean
  created_at: string
}

interface HistoryResponse {
  items: HistoryItem[]
  total: number
  limit: number
  offset: number
}

export function useHistory() {
  return useQuery<HistoryItem[]>({
    queryKey: ['history'],
    queryFn: async () => {
      const res = await axios.get<HistoryResponse>(`${API_URL}/api/v1/history`)
      return res.data.items
    },
    staleTime: 30000
  })
}
