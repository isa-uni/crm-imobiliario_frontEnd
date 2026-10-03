import type { LeadStatus } from "@/types"

// Ordem das etapas do funil de vendas. Usada pelo FunilDashboard e pelo Relógio de Vendas (contagem
// cumulativa: um lead com status mais avançado conta como tendo passado pelas etapas anteriores) e
// espelhada no backend em LeadExportService.FUNIL_ORDEM — manter as três em sincronia.
export const STATUS_ORDER: LeadStatus[] = [
  "lead",
  "oportunidade",
  "visita-agendada",
  "visita-realizada",
  "pasta",
  "aprovado",
  "contrato",
]

/**
 * Quantos leads chegaram até a etapa (contagem cumulativa): conta os leads cuja etapa atual é a
 * informada ou qualquer posterior. A primeira etapa ("lead") conta todos, inclusive descartados.
 */
export function contagemCumulativa(leads: { status: LeadStatus | string }[], etapa: LeadStatus): number {
  const indice = STATUS_ORDER.indexOf(etapa)
  if (indice <= 0) return leads.length
  const validos = STATUS_ORDER.slice(indice) as string[]
  return leads.filter(l => validos.includes(l.status)).length
}
