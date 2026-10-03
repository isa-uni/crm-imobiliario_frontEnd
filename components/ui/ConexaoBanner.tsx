'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { api, EVENTO_CONEXAO, type EstadoConexao } from '@/service/api'

/**
 * Banner para problema sistêmico: o servidor não responde (sem internet ou sistema fora do ar).
 * Fica visível até a próxima resposta do servidor — diferente de um toast, que sumiria sozinho
 * enquanto o problema continua. Os erros das ações em si continuam nos toasts de cada tela.
 */
export function ConexaoBanner() {
  const [estado, setEstado] = useState<EstadoConexao>('ok')
  const [verificando, setVerificando] = useState(false)

  useEffect(() => {
    const onConexao = (e: Event) => setEstado((e as CustomEvent<EstadoConexao>).detail)
    window.addEventListener(EVENTO_CONEXAO, onConexao)
    return () => window.removeEventListener(EVENTO_CONEXAO, onConexao)
  }, [])

  if (estado === 'ok') return null

  const verificar = async () => {
    setVerificando(true)
    // qualquer resposta do servidor (mesmo 401) significa que ele voltou; o interceptor atualiza o estado
    try { await api.get('/auth/me') } catch {} finally { setVerificando(false) }
  }

  return (
    <div role="status" aria-live="polite" className="sticky top-0 z-[60] w-full bg-warning-bg border-b border-warning-border text-warning">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm">
        <WifiOff size={18} className="shrink-0 hidden sm:block" aria-hidden="true" />
        <p className="flex-1">
          <strong className="font-semibold">Sem conexão com o servidor.</strong>{' '}
          Verifique sua internet. Enquanto isso, as ações feitas no sistema não serão concluídas.
        </p>
        <button
          onClick={verificar}
          disabled={verificando}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-warning-border font-semibold hover:bg-warning/10 disabled:opacity-60"
        >
          <RefreshCw size={14} className={verificando ? 'motion-safe:animate-spin' : ''} aria-hidden="true" />
          {verificando ? 'Verificando conexão...' : 'Verificar novamente'}
        </button>
      </div>
    </div>
  )
}
