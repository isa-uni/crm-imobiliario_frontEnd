'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { adicionarToast, duracaoPadrao, ROTULO_TIPO, type ToastItem, type ToastType } from '@/lib/toastFila'

export type { ToastType }

/** Opções do toast. Número = duração em ms (compatível com a assinatura antiga). */
export type ToastOptions = number | { title?: string; duration?: number }

interface ToastContextValue {
  /**
   * Mostra um toast. Use `title` para dizer O QUE aconteceu e `message` para o motivo/resultado:
   * toast('Já existe um usuário com este e-mail.', 'error', { title: 'Não foi possível cadastrar o usuário' })
   */
  toast: (msg: string, type?: ToastType, options?: ToastOptions) => void
  success: (msg: string, options?: ToastOptions) => void
  error: (msg: string, options?: ToastOptions) => void
  warning: (msg: string, options?: ToastOptions) => void
  info: (msg: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ESTILO: Record<ToastType, string> = {
  error: 'bg-danger-bg border-danger-border text-danger',
  success: 'bg-success-bg border-success-border text-success',
  warning: 'bg-warning-bg border-warning-border text-warning',
  info: 'bg-info-bg border-info-border text-info',
}
const ICONE = { error: AlertCircle, success: CheckCircle, warning: AlertTriangle, info: Info }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const remover = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t) clearTimeout(t)
    timers.current.delete(id)
    setToasts(prev => prev.filter(x => x.id !== id))
  }, [])

  const agendar = useCallback((id: string, duracao: number) => {
    const anterior = timers.current.get(id)
    if (anterior) clearTimeout(anterior)
    if (duracao > 0) timers.current.set(id, setTimeout(() => remover(id), duracao))
  }, [remover])

  const toast = useCallback((message: string, type: ToastType = 'info', options?: ToastOptions) => {
    const opts = typeof options === 'number' ? { duration: options } : (options ?? {})
    const duration = opts.duration ?? duracaoPadrao(type, message, opts.title)
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => {
      const r = adicionarToast(prev, { id, type, message, title: opts.title, duration })
      // toasts que saíram da fila por excesso: limpa os temporizadores
      prev.filter(p => !r.lista.some(n => n.id === p.id)).forEach(p => {
        const t = timers.current.get(p.id); if (t) clearTimeout(t); timers.current.delete(p.id)
      })
      queueMicrotask(() => agendar(r.id, duration))
      return r.lista
    })
  }, [agendar])

  useEffect(() => {
    const mapa = timers.current
    return () => { mapa.forEach(t => clearTimeout(t)); mapa.clear() }
  }, [])

  const value = useMemo<ToastContextValue>(() => ({
    toast,
    success: (m, o) => toast(m, 'success', o),
    error: (m, o) => toast(m, 'error', o),
    warning: (m, o) => toast(m, 'warning', o),
    info: (m, o) => toast(m, 'info', o),
  }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* topo à direita no desktop; largura total (com margem) no celular */}
      <div
        aria-label="Notificações do sistema"
        className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:top-4 z-[9999] flex flex-col gap-2.5 pointer-events-none sm:w-[400px]"
      >
        {toasts.map(t => {
          const Icon = ICONE[t.type]
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              aria-live={t.type === 'error' ? 'assertive' : 'polite'}
              aria-atomic="true"
              onMouseEnter={() => { const x = timers.current.get(t.id); if (x) clearTimeout(x) }}
              onMouseLeave={() => agendar(t.id, Math.max(2500, t.duration / 2))}
              onFocus={() => { const x = timers.current.get(t.id); if (x) clearTimeout(x) }}
              onBlur={() => agendar(t.id, Math.max(2500, t.duration / 2))}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-card shadow-card-lg border text-sm leading-snug ${ESTILO[t.type]} motion-safe:animate-toast-in`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <span className="sr-only">{ROTULO_TIPO[t.type]}: </span>
                {t.title && <p className="font-semibold break-words">{t.title}</p>}
                <p className={`break-words ${t.title ? 'mt-0.5 font-normal' : 'font-medium'}`}>
                  {t.message}
                  {t.repeticoes > 1 && <span className="ml-1.5 text-xs opacity-75">({t.repeticoes}×)</span>}
                </p>
              </div>
              <button
                onClick={() => remover(t.id)}
                className="shrink-0 -mr-1 -my-1 p-1.5 rounded-btn hover:bg-ink/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
                aria-label={`Fechar mensagem: ${t.title ?? t.message}`}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// Helper global para uso fora de React (ex: api interceptor)
type GlobalToast = ToastContextValue | null
let globalToastRef: GlobalToast = null
export function setGlobalToast(ref: GlobalToast) { globalToastRef = ref }
export function getGlobalToast() { return globalToastRef }

export function GlobalToastSetter() {
  const toast = useToast()
  useEffect(() => { setGlobalToast(toast); return () => setGlobalToast(null) }, [toast])
  return null
}
