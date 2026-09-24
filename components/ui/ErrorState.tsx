'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  details,
  onRetry,
  compact = false,
}: {
  message?: string
  details?: string
  onRetry?: () => void
  compact?: boolean
}) {
  return (
    <div className={`bg-card border border-line rounded-card shadow-card ${compact ? 'p-4' : 'p-8'} text-center`}>
      <div className={`mx-auto flex items-center justify-center rounded-full bg-danger-bg text-danger ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
        <AlertTriangle size={compact ? 20 : 28} />
      </div>
      <p className={`font-semibold text-ink ${compact ? 'mt-3 text-sm' : 'mt-4'}`}>{message}</p>
      {details && <p className="text-xs text-muted mt-1 break-words">{details}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover"
        >
          <RefreshCw size={16} /> Tentar novamente
        </button>
      )}
    </div>
  )
}

export function InlineError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-danger mt-1.5">{message}</p>
}
