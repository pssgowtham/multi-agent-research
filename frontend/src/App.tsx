import { useState } from 'react'
import { useStream } from '@/hooks/useStream'
import { AgentStepper } from '@/components/AgentStepper'
import { ReportViewer } from '@/components/ReportViewer'
import { AgentTimeline } from '@/components/AgentTimeline'
import { HistoryPanel } from '@/components/HistoryPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ReportTypeSelector } from '@/components/ReportTypeSelector'
import { ReportLengthSelector } from '@/components/ReportLengthSelector'
import axios from 'axios'
import { API_URL } from '@/config'

const cleanQuery = (raw: string) => {
  return raw
    .replace(/^(give me (a |an )?(report|summary|analysis) (about|on|of)|tell me about|what is|explain|research on)\s+/i, '')
    .trim()
}

function App() {
  const [query, setQuery] = useState('')
  const [reportType, setReportType] = useState('')
  const [reportLength, setReportLength] = useState('')
  const [cleanedQuery, setCleanedQuery] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [historyResult, setHistoryResult] = useState<any>(null)
  const [showTypeError, setShowTypeError] = useState(false)
  const [showLengthError, setShowLengthError] = useState(false)
  const { status, agents, result, error, startResearch, reset } = useStream()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportType) { setShowTypeError(true); return }
    if (!reportLength) { setShowLengthError(true); return }
    setShowTypeError(false)
    setShowLengthError(false)
    const cleaned = cleanQuery(query.trim())
    setCleanedQuery(cleaned)
    startResearch(cleaned, reportType, reportLength)
  }

  const handleReset = () => {
    setQuery('')
    setReportType('')
    setReportLength('')
    setCleanedQuery('')
    setHistoryResult(null)
    setShowTypeError(false)
    setShowLengthError(false)
    reset()
  }

  const handleHistorySelect = async (id: string, q: string) => {
    reset()
    setQuery(q)
    const res = await axios.get(`${API_URL}/api/v1/history/${id}`)
    setHistoryResult(res.data)
  }

  const isIdle = status === 'idle' && agents.length === 0 && !historyResult

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      {showHistory && (
        <aside className="w-72 border-r p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">History</h2>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <HistoryPanel onSelect={handleHistorySelect} />
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 p-8 max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Multi-Agent Research</h1>
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className="text-xs px-3 py-1.5 rounded border hover:bg-accent transition-colors"
            >
              History
            </button>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isIdle && (
              <button
                onClick={handleReset}
                className="text-sm px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors"
              >
                New research
              </button>
            )}
          </div>
        </div>

        {/* Input + selectors */}
        {isIdle && (
          <>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
              <input
                className="flex-1 border rounded-lg px-4 py-2 text-sm"
                placeholder="e.g. Impact of AI on healthcare, Status of Ukraine war..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={!query.trim()}
                style={{ backgroundColor: '#18181b', color: '#fff' }}
                className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Research
              </button>
            </form>

            {/* Step 1 — Report type */}
            <div className="mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Step 1 — Choose report type
              </p>
              {showTypeError && (
                <p className="text-xs text-red-500 mb-2">Please select a report type.</p>
              )}
              <ReportTypeSelector
                selected={reportType}
                onChange={(val) => { setReportType(val); setShowTypeError(false) }}
              />
            </div>

            {/* Step 2 — Report length — only show after type selected */}
            {reportType && (
              <div className="mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Step 2 — Choose report length
                </p>
                {showLengthError && (
                  <p className="text-xs text-red-500 mb-2">Please select a report length.</p>
                )}
                <ReportLengthSelector
                  selected={reportLength}
                  onChange={(val) => { setReportLength(val); setShowLengthError(false) }}
                />
              </div>
            )}
          </>
        )}

        {/* Research question card */}
        {!isIdle && (
          <div className="mb-6 p-4 rounded-xl border bg-card">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-medium">
              Research question
            </p>
            <p className="text-lg font-semibold">{cleanedQuery || query}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {reportType} report · {reportLength}
            </p>
          </div>
        )}

        {/* Agent stepper */}
        {agents.length > 0 && (
          <div className="mb-8">
            <AgentStepper agents={agents} status={status} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 mb-8">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Timeline + Report */}
        {(result || historyResult) && (
          <>
            <div className="mb-6">
              <AgentTimeline timeline={(result || historyResult).timeline} />
            </div>
            <ReportViewer result={result || historyResult} />
          </>
        )}
      </main>
    </div>
  )
}

export default App