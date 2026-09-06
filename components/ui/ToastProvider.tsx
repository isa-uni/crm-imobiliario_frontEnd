'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  toast: (msg: string, type?: ToastType, duration?: number) => void
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev, { id, type, message, duration }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const value: ToastContextValue = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error', 5000),
    warning: (m) => toast(m, 'warning'),
    info: (m) => toast(m, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[420px] w-[calc(100%-2rem)]">
        {toasts.map(t => {
          const bg = t.type === 'error' ? 'bg-[#c0392b] border-[#a93226]' : t.type === 'success' ? 'bg-[#0f8a52] border-[#0a6b3e]' : t.type === 'warning' ? 'bg-amber-600 border-amber-700' : 'bg-primary border-primary-700'
          const Icon = t.type === 'error' ? AlertCircle : t.type === 'success' ? CheckCircle : t.type === 'warning' ? AlertTriangle : Info
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-card shadow-card-lg border text-white text-sm leading-snug ${bg} animate-in slide-in-from-top-2`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 break-words">{t.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="shrink-0 -mr-1 -my-1 p-1.5 rounded-btn hover:bg-white/15"
                aria-label="Fechar"
              >
                <X size={16} />
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
