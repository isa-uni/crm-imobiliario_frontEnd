'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    // tenta recuperar sem reload completo se possível
    if (typeof window !== 'undefined') {
      // fallback: reload se erro persistir
      // window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
          <div className="bg-card border border-line rounded-card shadow-card p-8 max-w-lg w-full text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-danger-bg text-danger flex items-center justify-center mb-4">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-lg font-bold text-ink">Ocorreu um erro inesperado</h2>
            <p className="text-sm text-muted mt-2">
              Não foi possível carregar esta seção. Tente novamente. Se o problema persistir, contate o suporte.
            </p>
            {this.state.error && (
              <p className="text-xs text-muted mt-2 break-all bg-surface p-2 rounded-btn border border-line">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover"
            >
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
