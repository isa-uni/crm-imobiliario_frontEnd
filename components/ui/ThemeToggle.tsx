'use client'

import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useMounted } from '@/app/useMounted'

/** Botão rápido sol/lua (usado no rodapé da Sidebar). */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sidebar-fg hover:bg-white/10 hover:text-white transition-colors"
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
      <span className="text-sm">{isDark ? 'Tema claro' : 'Tema escuro'}</span>
    </button>
  )
}

const OPCOES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
] as const

/** Seletor Claro / Escuro / Sistema (usado em Meu Perfil). */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-3">
      {OPCOES.map(({ value, label, icon: Icon }) => {
        const ativo = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => setTheme(value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-btn border transition-colors ${
              ativo
                ? 'border-brand bg-brand-soft text-brand-fg font-semibold'
                : 'border-line bg-card text-muted hover:bg-subtle'
            }`}
          >
            <Icon size={22} />
            <span className="text-sm">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
