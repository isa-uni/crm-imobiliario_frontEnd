'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

// Tokens usados por gráficos/estilos inline (SVG do Recharts não lê classes do Tailwind).
const TOKENS = [
  'surface', 'card', 'subtle', 'line', 'ink', 'muted',
  'brand', 'brand-fg', 'accent', 'success', 'danger', 'on-chart',
  'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-7',
] as const

export type ThemeToken = (typeof TOKENS)[number]
export type ThemeColors = Record<ThemeToken, string>

/** Referência CSS de um token, para `style={{ background: cssVar('chart-1') }}`. */
export const cssVar = (token: ThemeToken) => `rgb(var(--c-${token}))`

function readColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement)
  return Object.fromEntries(
    TOKENS.map((t) => [t, `rgb(${style.getPropertyValue(`--c-${t}`).trim().split(/\s+/).join(', ')})`]),
  ) as ThemeColors
}

/** Cores do tema atual já resolvidas; recalcula quando o tema muda. */
export function useThemeColors(): ThemeColors {
  const { resolvedTheme } = useTheme()
  // Começa com o claro (igual ao HTML do servidor) e ajusta após montar,
  // evitando divergência de hidratação.
  const [colors, setColors] = useState<ThemeColors>(LIGHT_FALLBACK)

  useEffect(() => {
    setColors(readColors())
  }, [resolvedTheme])

  return colors
}

// Valores do tema claro, usados só durante a renderização no servidor.
const LIGHT_FALLBACK: ThemeColors = {
  surface: 'rgb(242, 245, 249)', card: 'rgb(255, 255, 255)', subtle: 'rgb(238, 242, 247)',
  line: 'rgb(225, 232, 240)', ink: 'rgb(18, 33, 47)', muted: 'rgb(95, 116, 136)',
  brand: 'rgb(15, 39, 64)', 'brand-fg': 'rgb(15, 39, 64)', accent: 'rgb(242, 169, 0)',
  success: 'rgb(15, 138, 82)', danger: 'rgb(192, 57, 43)', 'on-chart': 'rgb(255, 255, 255)',
  'chart-1': 'rgb(15, 39, 64)', 'chart-2': 'rgb(242, 169, 0)', 'chart-3': 'rgb(39, 80, 111)',
  'chart-4': 'rgb(232, 145, 74)', 'chart-5': 'rgb(74, 156, 118)', 'chart-6': 'rgb(63, 179, 179)',
  'chart-7': 'rgb(122, 92, 168)',
}

/** Paleta categórica (séries, fatias de pizza). */
export const chartSeries = (c: ThemeColors) => [
  c['chart-1'], c['chart-2'], c['chart-3'], c['chart-4'], c['chart-5'], c['chart-6'], c['chart-7'],
]

/** Estilo do Tooltip do Recharts seguindo o tema. */
export const chartTooltipStyle = (c: ThemeColors) => ({
  contentStyle: {
    borderRadius: 10,
    border: `1px solid ${c.line}`,
    background: c.card,
    color: c.ink,
    boxShadow: 'var(--shadow-card-lg)',
    fontSize: 13,
  },
  labelStyle: { color: c.ink },
  itemStyle: { color: c.ink },
})
