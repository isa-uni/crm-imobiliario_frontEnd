'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { authService } from '@/service/authService'

const DEFAULT_TIMEOUT = 30 * 60 * 1000 // 30min
const WARNING_BEFORE = 60 * 1000 // 60s

export function useInactivityLogout(options?: { timeoutMs?: number; warningMs?: number; enabled?: boolean }) {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT
  const warningMs = options?.warningMs ?? WARNING_BEFORE
  const enabled = options?.enabled ?? true

  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const logout = useCallback(() => {
    setShowWarning(false)
    authService.logoutLocal()
    // também tenta logout no servidor (blacklist)
    if (typeof window !== 'undefined') {
      // storage event para outras abas
      localStorage.setItem('crm:logout', Date.now().toString())
      window.location.href = '/login?reason=inactivity'
    }
  }, [])

  const reset = useCallback(() => {
    if (!enabled) return
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setShowWarning(false)

    // sem token = sem timer
    if (!authService.getToken() && !authService.getUsuario()) return

    warningRef.current = setTimeout(() => {
      setShowWarning(true)
      setCountdown(Math.ceil(warningMs / 1000))
      intervalRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }, Math.max(0, timeoutMs - warningMs))

    timerRef.current = setTimeout(() => {
      logout()
    }, timeoutMs)
  }, [enabled, timeoutMs, warningMs, logout])

  const keepAlive = useCallback(() => {
    reset()
  }, [reset])

  useEffect(() => {
    if (!enabled) return
    const events: (keyof WindowEventMap)[] = ['mousemove','mousedown','keydown','scroll','touchstart','click']
    const handler = () => reset()
    // throttle via reset que recria timers
    let throttled = false
    const throttledHandler = () => {
      if (throttled) return
      throttled = true
      handler()
      setTimeout(()=> throttled = false, 5000)
    }
    events.forEach(e => window.addEventListener(e, throttledHandler, { passive: true }))
    document.addEventListener('visibilitychange', handler)
    window.addEventListener('storage', (e) => {
      if (e.key === 'crm:logout') logout()
    })

    reset()

    return () => {
      events.forEach(e => window.removeEventListener(e, throttledHandler as any))
      document.removeEventListener('visibilitychange', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [reset, enabled, logout])

  return { showWarning, countdown, keepAlive, dismissWarning: () => reset(), logout }
}
