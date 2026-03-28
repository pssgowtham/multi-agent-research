import { useState, useCallback } from 'react'

export interface AgentUpdate {
  agent: string
  status: 'running' | 'done'
  duration?: number
}

export interface ResearchResult {
  query: string
  final_answer: string
  timeline: Record<string, number>
  search_queries: string[]
  critic_approved: boolean
  iterations: number
  id: string
}

export interface StreamState {
  status: 'idle' | 'streaming' | 'done' | 'error'
  agents: AgentUpdate[]
  result: ResearchResult | null
  error: string | null
}

export function useStream() {
  const [state, setState] = useState<StreamState>({
    status: 'idle',
    agents: [],
    result: null,
    error: null
  })

  const startResearch = useCallback(async (query: string, reportType: string, reportLength: string) => {
    setState({ status: 'streaming', agents: [], result: null, error: null })

    try {
      const response = await fetch('http://localhost:8000/api/v1/research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, report_type: reportType, report_length: reportLength })
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''  // accumulate chunks here

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete lines only
        const lines = buffer.split('\n')
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.replace('data: ', '').trim()
          if (!raw) continue

          try {
            const data = JSON.parse(raw)

            if (data.type === 'agent_start') {
              setState(prev => ({
                ...prev,
                agents: [...prev.agents, { agent: data.agent, status: 'running' }]
              }))
            }

            if (data.type === 'agent_end') {
              setState(prev => ({
                ...prev,
                agents: prev.agents.map(a =>
                  a.agent === data.agent
                    ? { ...a, status: 'done', duration: data.duration }
                    : a
                )
              }))
            }

            if (data.type === 'result') {
              setState(prev => ({
                ...prev,
                result: data.data,
                status: 'done'
              }))
            }

            if (data.type === 'error') {
              setState(prev => ({
                ...prev,
                error: data.message,
                status: 'error'
              }))
            }

          } catch (e) {
            console.error('Parse error:', e, 'on line:', raw.slice(0, 100))
          }
        }
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: String(err),
        status: 'error'
      }))
    }
  }, [])

  const reset = useCallback(() => {
    setState({ status: 'idle', agents: [], result: null, error: null })
  }, [])

  return { ...state, startResearch, reset }
}