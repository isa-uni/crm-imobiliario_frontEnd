'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-8">
      <div className="bg-white border border-line rounded-card shadow-card-lg p-8 max-w-lg w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#fdeceb] text-[#c0392b] flex items-center justify-center mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-ink">Ops, algo deu errado</h2>
        <p className="text-sm text-muted mt-2">
          Não foi possível carregar esta página. Tente novamente ou volte ao início.
        </p>
        {error?.digest && (
          <p className="text-xs text-muted mt-2 font-mono bg-surface p-2 rounded-btn border border-line break-all">
            ID: {error.digest}
          </p>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-btn font-semibold shadow-btn hover:bg-primary-700"
          >
            <RefreshCw size={16} /> Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-line text-ink rounded-btn font-semibold hover:bg-surface"
          >
            <Home size={16} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
