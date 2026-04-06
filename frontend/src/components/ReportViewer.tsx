import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { ResearchResult } from '@/hooks/useStream'
import remarkGfm from 'remark-gfm'
import { API_URL } from '@/config'

interface Props {
  result: ResearchResult & { warning?: string; id?: string }
}

export function ReportViewer({ result }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(result.final_answer)
    setCopied(true)
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
    <div className="border rounded-xl overflow-hidden">
      {result.warning && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            ⚠️ {result.warning}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card">
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold">Research Report</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {wordCount} words
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {readTime} min read
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          {result.id && (
            <>
              <button
                onClick={handleDownloadMarkdown}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors"
              >
                .md
              </button>
              <button
                onClick={handleDownloadPDF}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors"
              >
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