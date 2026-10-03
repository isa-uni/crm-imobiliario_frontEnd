'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'

export interface ConfirmOptions {
  /** A pergunta, específica: "Desativar o usuário Maria Souza?" */
  titulo: string
  /** A consequência da ação, quando houver: "Ela perde o acesso e os leads dela vão para redistribuição." */
  mensagem?: React.ReactNode
  /** Verbo da ação (evite "OK"/"Sim"): "Desativar usuário" */
  confirmarLabel: string
  cancelarLabel?: string
  /** Ação destrutiva/irreversível: botão vermelho e foco inicial em "Cancelar". */
  perigo?: boolean
}

type Confirmar = (opcoes: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<Confirmar | null>(null)

/** Abre um diálogo de confirmação e resolve com true (confirmou) ou false (cancelou/fechou). */
export function useConfirm(): Confirmar {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

interface Pendente extends ConfirmOptions { resolver: (ok: boolean) => void }

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pendente, setPendente] = useState<Pendente | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  const confirmarRef = useRef<HTMLButtonElement>(null)
  const focoAnterior = useRef<HTMLElement | null>(null)

  const confirmar = useCallback<Confirmar>((opcoes) => new Promise<boolean>(resolver => {
    focoAnterior.current = document.activeElement as HTMLElement | null
    setPendente({ ...opcoes, resolver })
  }), [])

  const fechar = useCallback((ok: boolean) => {
    setPendente(atual => { atual?.resolver(ok); return null })
    // devolve o foco a quem abriu o diálogo (navegação por teclado)
    setTimeout(() => focoAnterior.current?.focus?.(), 0)
  }, [])

  useEffect(() => {
    if (!pendente) return
    ;(pendente.perigo ? cancelarRef : confirmarRef).current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); fechar(false) }
      if (e.key === 'Tab' && dialogRef.current) {
        // mantém o foco dentro do diálogo
        const focaveis = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button'))
        const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1]
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pendente, fechar])

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {pendente && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-overlay/50 p-3 sm:p-4" onMouseDown={() => fechar(false)}>
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-titulo"
            aria-describedby={pendente.mensagem ? 'confirm-mensagem' : undefined}
            onMouseDown={e => e.stopPropagation()}
            className="bg-card border border-line rounded-card shadow-card-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 motion-safe:animate-dialog-in"
          >
            <div className="flex items-start gap-3">
              <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${pendente.perigo ? 'bg-danger-bg text-danger' : 'bg-info-bg text-info'}`} aria-hidden="true">
                {pendente.perigo ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
              </span>
              <div className="min-w-0">
                <h2 id="confirm-titulo" className="text-base font-bold text-ink break-words">{pendente.titulo}</h2>
                {pendente.mensagem && <div id="confirm-mensagem" className="text-sm text-muted mt-1.5 break-words">{pendente.mensagem}</div>}
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <button
                ref={cancelarRef}
                type="button"
                onClick={() => fechar(false)}
                className="px-4 py-2.5 border border-line rounded-btn text-ink font-medium hover:bg-surface focus:outline-none focus-visible:ring-4 focus-visible:ring-focus/30"
              >
                {pendente.cancelarLabel ?? 'Cancelar'}
              </button>
              <button
                ref={confirmarRef}
                type="button"
                onClick={() => fechar(true)}
                className={`px-4 py-2.5 rounded-btn font-semibold shadow-btn focus:outline-none focus-visible:ring-4 focus-visible:ring-focus/30 ${pendente.perigo ? 'bg-danger text-white hover:opacity-90' : 'bg-brand text-on-brand hover:bg-brand-hover'}`}
              >
                {pendente.confirmarLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
