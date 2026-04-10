import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { ResearchResult } from '@/hooks/useStream'
import remarkGfm from 'remark-gfm'
import { API_URL } from '@/config'
import {
  Copy,
  Check,
  Download,
  FileText,
  FileDown,
  AlertTriangle,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface Props {
  result: ResearchResult & { warning?: string; id?: string }
  onCopy?: () => void
}

export function ReportViewer({ result, onCopy }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result.final_answer)
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPDF = () => {
    if (!result.id) return
    window.open(`${API_URL}/api/v1/report/${result.id}/pdf`, '_blank')
  }

  const handleDownloadMarkdown = () => {
    if (!result.id) return
    window.open(`${API_URL}/api/v1/report/${result.id}/markdown`, '_blank')
  }

  const wordCount = result.final_answer.trim().split(/\s+/).length
  const readTime = Math.ceil(wordCount / 200)

  return (
    <div className="border rounded-2xl overflow-hidden bg-card animate-scale-in">
      {/* Warning banner */}
      {result.warning && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 dark:bg-amber-950/50 dark:border-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {result.warning}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold">Research Report</span>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                {wordCount} words
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {readTime} min read
              </span>
              {result.critic_approved !== undefined && (
                <span className={`flex items-center gap-1 text-xs ${result.critic_approved ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {result.critic_approved ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {result.critic_approved ? 'Approved' : `${result.iterations} iterations`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border hover:bg-accent transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {result.id && (
            <>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border hover:bg-accent transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                .md
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report content */}
      <div className="px-8 py-8 bg-background">
        <div className="
          prose prose-slate max-w-none
          dark:prose-invert
          prose-headings:font-semibold
          prose-headings:tracking-tight
          prose-h1:text-2xl prose-h1:mb-6 prose-h1:pb-3 prose-h1:border-b
          prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-sm prose-p:leading-7 prose-p:text-foreground
          prose-li:text-sm prose-li:leading-7
          prose-strong:font-semibold prose-strong:text-foreground
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
          prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-ul:my-4 prose-ol:my-4
          prose-table:text-sm
          prose-th:bg-muted prose-th:font-semibold
          prose-td:border prose-td:border-border
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {result.final_answer}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
