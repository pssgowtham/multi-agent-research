import { useState } from 'react'
import { useStream } from '@/hooks/useStream'
import { AgentStepper } from '@/components/AgentStepper'
import { ReportViewer } from '@/components/ReportViewer'
import { AgentTimeline } from '@/components/AgentTimeline'
import { HistoryPanel } from '@/components/HistoryPanel'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ReportTypeSelector } from '@/components/ReportTypeSelector'
import { ReportLengthSelector } from '@/components/ReportLengthSelector'
import { StatsBar } from '@/components/StatsBar'
import { Toast } from '@/components/Toast'
import axios from 'axios'
import { API_URL } from '@/config'
import {
  Search,
  Sparkles,
  ArrowRight,
  History,
  Plus,
  X,
  Loader2,
  AlertCircle,
  RotateCcw,
  Zap,
  Brain,
  FileText,
} from 'lucide-react'

const cleanQuery = (raw: string) => {
  return raw
    .replace(/^(give me (a |an )?(report|summary|analysis) (about|on|of)|tell me about|what is|explain|research on)\s+/i, '')
    .trim()
}

const EXAMPLE_QUERIES = [
  'Impact of AI on drug discovery in 2025',
  'Global semiconductor supply chain risks',
  'Latest advances in quantum computing',
  'Climate change effects on agriculture',
]

function App() {
  const [query, setQuery] = useState('')
  const [reportType, setReportType] = useState('')
  const [reportLength, setReportLength] = useState('')
  const [cleanedQuery, setCleanedQuery] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [historyResult, setHistoryResult] = useState<any>(null)
  const [showTypeError, setShowTypeError] = useState(false)
  const [showLengthError, setShowLengthError] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const { status, agents, result, error, startResearch, reset } = useStream()

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

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

  const handleHistoryDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/v1/history/${id}`)
      showToast('Research deleted')
    } catch {
      showToast('Failed to delete', 'error')
    }
  }

  const handleBookmark = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/api/v1/history/${id}/bookmark`)
      showToast('Bookmark toggled')
    } catch {
      showToast('Failed to bookmark', 'error')
    }
  }

  const isIdle = status === 'idle' && agents.length === 0 && !historyResult

  return (
    <div className="min-h-screen flex bg-background bg-grid">
      {/* History Sidebar */}
      {showHistory && (
        <aside className="w-80 border-r bg-card/80 backdrop-blur-sm flex flex-col animate-slide-in-left">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Research History</h2>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <HistoryPanel
              onSelect={handleHistorySelect}
              onDelete={handleHistoryDelete}
              onBookmark={handleBookmark}
            />
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Nav */}
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto w-full px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(prev => !prev)}
                className="p-2 rounded-lg hover:bg-accent transition-colors relative"
                title="Research history"
              >
                <History className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-sm hidden sm:inline">Multi-Agent Research</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {!isIdle && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New research</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
          {/* Hero + Input (idle state) */}
          {isIdle && (
            <div className="animate-fade-in-up">
              {/* Hero */}
              <div className="text-center mb-10 glow-accent">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-4">
                    <Sparkles className="w-3 h-3" />
                    Powered by 5 specialized AI agents
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
                    Research{' '}
                    <span className="gradient-text">anything</span>
                  </h1>
                  <p className="text-muted-foreground text-base max-w-lg mx-auto">
                    Get comprehensive, fact-checked research reports generated by a pipeline of
                    AI agents that plan, search, analyze, write, and review.
                  </p>
                </div>
              </div>

              {/* Search form */}
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center gap-2 p-2 rounded-2xl border bg-card shadow-sm group-focus-within:border-indigo-300 dark:group-focus-within:border-indigo-700 transition-colors">
                    <Search className="w-5 h-5 text-muted-foreground ml-3 shrink-0" />
                    <input
                      className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60"
                      placeholder="What would you like to research?"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!query.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium disabled:opacity-40 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-sm disabled:shadow-none"
                    >
                      <Zap className="w-4 h-4" />
                      Research
                    </button>
                  </div>
                </div>
              </form>

              {/* Example queries */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                <span className="text-xs text-muted-foreground">Try:</span>
                {EXAMPLE_QUERIES.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setQuery(eq)}
                    className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {eq}
                  </button>
                ))}
              </div>

              {/* Step 1 - Report type */}
              <div className="mb-6 animate-fade-in-up animation-delay-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    1
                  </div>
                  <p className="text-sm font-medium">Choose report type</p>
                  {showTypeError && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Required
                    </span>
                  )}
                </div>
                <ReportTypeSelector
                  selected={reportType}
                  onChange={(val) => { setReportType(val); setShowTypeError(false) }}
                />
              </div>

              {/* Step 2 - Report length */}
              {reportType && (
                <div className="mb-6 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">
                      2
                    </div>
                    <p className="text-sm font-medium">Choose report length</p>
                    {showLengthError && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Required
                      </span>
                    )}
                  </div>
                  <ReportLengthSelector
                    selected={reportLength}
                    onChange={(val) => { setReportLength(val); setShowLengthError(false) }}
                  />
                </div>
              )}

              {/* Stats bar */}
              <StatsBar />
            </div>
          )}

          {/* Research in progress / results */}
          {!isIdle && (
            <div className="animate-fade-in-up">
              {/* Research question card */}
              <div className="mb-8 p-5 rounded-2xl border bg-card glass-card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">
                      Research question
                    </p>
                    <p className="text-lg font-semibold leading-snug">{cleanedQuery || query}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium capitalize">
                        {reportType || historyResult?.report_type || 'executive'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-medium capitalize">
                        {reportLength || historyResult?.report_length || 'medium'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent stepper */}
              {agents.length > 0 && (
                <div className="mb-8">
                  <AgentStepper agents={agents} status={status} />
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="p-5 rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 mb-8 animate-scale-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Research failed</p>
                      <p className="text-sm text-red-600 dark:text-red-400/80">{error}</p>
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 mt-3 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Streaming indicator */}
              {status === 'streaming' && !result && agents.length > 0 && (
                <div className="flex items-center justify-center gap-2 py-6 mb-6 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Agents are working on your research...</span>
                </div>
              )}

              {/* Timeline + Report */}
              {(result || historyResult) && (
                <div className="space-y-6 animate-fade-in-up">
                  <AgentTimeline timeline={(result || historyResult).timeline} />
                  <ReportViewer
                    result={result || historyResult}
                    onCopy={() => showToast('Copied to clipboard')}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t py-4">
          <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Brain className="w-3 h-3" />
              <span>Multi-Agent Research System</span>
            </div>
            <div className="flex items-center gap-1">
              <span>5 agents</span>
              <ArrowRight className="w-3 h-3" />
              <span>1 report</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default App
