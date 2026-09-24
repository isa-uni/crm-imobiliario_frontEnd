import { ReactNode } from "react"

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral"

const TONES: Record<BadgeTone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-brand-soft text-brand-fg",
  neutral: "bg-subtle text-muted",
}

export function Badge({ tone = "neutral", children, className = "" }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${TONES[tone]} ${className}`}>{children}</span>
}

const SITUACAO_TONE: Record<string, BadgeTone> = {
  disponivel: "success",
  reservada: "warning",
  vendida: "danger",
  em_processo: "info",
}

const SITUACAO_LABEL: Record<string, string> = {
  disponivel: "Disponível",
  reservada: "Reservada",
  vendida: "Vendida",
  em_processo: "Em processo",
}

export function BadgeSituacao({ situacao }: { situacao?: string | null }) {
  if (!situacao) return <Badge tone="neutral">Não informado</Badge>
  const chave = situacao.toLowerCase()
  return <Badge tone={SITUACAO_TONE[chave] ?? "neutral"}>{SITUACAO_LABEL[chave] ?? situacao}</Badge>
}

export function BadgeConfianca({ confianca }: { confianca?: number | null }) {
  if (confianca === null || confianca === undefined) return null
  const tone: BadgeTone = confianca >= 80 ? "success" : confianca >= 60 ? "warning" : "danger"
  return <Badge tone={tone}>{confianca}%</Badge>
}
