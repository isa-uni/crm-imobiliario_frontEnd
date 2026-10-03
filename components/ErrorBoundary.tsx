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
    // tenta recuperar sem reload completo
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="min-h-[50vh] flex items-center justify-center p-4 sm:p-8">
          <div className="bg-card border border-line rounded-card shadow-card p-8 max-w-lg w-full text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-danger-bg text-danger flex items-center justify-center mb-4">
              <AlertTriangle size={28} aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-ink">Não foi possível exibir esta tela</h2>
            <p className="text-sm text-muted mt-2">
              Ocorreu um erro inesperado ao montar esta parte do sistema. Tente novamente; se o problema persistir,
              recarregue a página ou informe ao suporte em qual tela isso aconteceu.
            </p>
            {/* detalhe técnico só em desenvolvimento — nunca para o usuário final */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mt-3">
                <summary className="text-xs text-muted cursor-pointer">Detalhes técnicos (desenvolvimento)</summary>
                <p className="text-xs text-muted mt-2 break-all bg-surface p-2 rounded-btn border border-line">{this.state.error.message}</p>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover"
            >
              <RefreshCw size={16} aria-hidden="true" /> Tentar novamente
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
