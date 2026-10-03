import { describe, expect, it } from 'vitest'
import { STATUS_ORDER, contagemCumulativa } from './funil'

const leads = (...status: string[]) => status.map(s => ({ status: s }))

describe('funil de vendas (contagem cumulativa)', () => {
  it('a etapa "lead" conta todos os leads, inclusive descartados', () => {
    expect(contagemCumulativa(leads('lead', 'contrato', 'descarte'), 'lead')).toBe(3)
  })

  it('um lead "aprovado" conta em todas as etapas até "aprovado", mas não em "contrato"', () => {
    const l = leads('aprovado')
    for (const etapa of ['oportunidade', 'visita-agendada', 'visita-realizada', 'pasta', 'aprovado'] as const) {
      expect(contagemCumulativa(l, etapa), etapa).toBe(1)
    }
    expect(contagemCumulativa(l, 'contrato')).toBe(0)
  })

  it('descartados só contam na etapa inicial', () => {
    expect(contagemCumulativa(leads('descarte'), 'oportunidade')).toBe(0)
  })

  it('cada etapa nunca tem mais leads que a anterior', () => {
    const l = leads('lead', 'oportunidade', 'pasta', 'aprovado', 'contrato', 'contrato', 'descarte')
    const valores = STATUS_ORDER.map(e => contagemCumulativa(l, e))
    for (let i = 1; i < valores.length; i++) expect(valores[i]).toBeLessThanOrEqual(valores[i - 1])
    expect(valores).toEqual([7, 5, 4, 4, 4, 3, 2])
  })

  it('a ordem das etapas espelha o backend (LeadExportService.FUNIL_ORDEM)', () => {
    expect(STATUS_ORDER).toEqual(['lead', 'oportunidade', 'visita-agendada', 'visita-realizada', 'pasta', 'aprovado', 'contrato'])
  })
})
