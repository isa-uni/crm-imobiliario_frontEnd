'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { leadService } from '@/service/leadService'
import { equipeService } from '@/service/equipeService'
import { usuarioService } from '@/service/usuarioService'
import { useToast } from '@/components/ui/ToastProvider'
import { parseApiError } from '@/lib/errorHandler'
import { ErrorState, InlineError } from '@/components/ui/ErrorState'
import { notificarErro, textoDoErro, plural } from '@/lib/feedback'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import {
  alternarSelecao, alternarTodos, estadoSelecaoTodos, podarSelecao, resumoNomes, MAX_ATRIBUICAO_EM_MASSA,
} from '@/lib/redistribuicao'
import { Equipe, Usuario } from '@/types'
import { AlertTriangle, Users, ArrowRight, Eye, X, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react'
import { format } from 'date-fns'

interface LeadAguardando {
  id: number
  nome: string
  email: string
  telefone: string
  equipeId?: number | null
  equipeNome?: string | null
  statusAtribuicao?: string
  dataAtualizacao: string
  corretorAnteriorId?: number | null
  corretorAnteriorNome?: string | null
  motivoDesligamento?: string
  dataDesligamento?: string
  origem?: string
  status?: string
  responsavelRedistribuicaoId?: number | null
  responsavelRedistribuicaoNome?: string | null
}

// códigos gravados em LeadAtribuicaoService → texto para o usuário
const MOTIVOS: Record<string, string> = {
  DESLIGAMENTO_CORRETOR: 'Corretor desativado',
  ATRIBUICAO_INICIAL: 'Atribuição inicial',
  REDISTRIBUICAO: 'Redistribuição',
  ALTERACAO_MANUAL: 'Troca manual de corretor',
}
const motivoLegivel = (m?: string | null) => (m ? MOTIVOS[m] ?? m.replace(/_/g, ' ').toLowerCase() : 'Corretor desativado')

export default function RedistribuicaoPage() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<LeadAguardando[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [corretores, setCorretores] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [selecaoErro, setSelecaoErro] = useState<Record<number, string | undefined>>({})
  const [enviando, setEnviando] = useState<number | null>(null)
  const [historicos, setHistoricos] = useState<Record<number, any[]>>({})
  const [histLoading, setHistLoading] = useState<Record<number, boolean>>({})
  const [drawerLead, setDrawerLead] = useState<LeadAguardando | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const loadingRef = useRef(false)
  // atribuição em massa: leads marcados (ids) e o corretor que receberá todos
  const [marcados, setMarcados] = useState<Set<number>>(new Set())
  const [destinoMassa, setDestinoMassa] = useState('')
  const [destinoMassaErro, setDestinoMassaErro] = useState<string | undefined>()
  const [enviandoMassa, setEnviandoMassa] = useState(false)
  const confirmar = useConfirm()

  const load = useCallback(async (pageIndex = page) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true); setError(null)
    const controller = new AbortController()
    try {
      const [pageData, eq, users] = await Promise.all([
        leadService.getAguardandoResumo({ page: pageIndex, size: 50 }),
        equipeService.getAll().catch(()=>[]),
        usuarioService.getAll().catch(()=>[])
      ])
      if (controller.signal.aborted) return
      // pageData é Page<LeadAguardandoDTO> quando includeResumo=true, fallback para array legado
      let content: LeadAguardando[] = []
      let totalP = 0, totalE = 0
      if (pageData && Array.isArray(pageData.content)) {
        content = pageData.content.filter((x:any) => x && x.id != null)
        totalP = pageData.totalPages ?? 0
        totalE = pageData.totalElements ?? content.length
      } else if (Array.isArray(pageData)) {
        content = pageData.filter((x:any) => x && x.id != null)
        totalP = content.length > 0 ? 1 : 0
        totalE = content.length
      } else {
        content = []
      }
      setLeads(content)
      setTotalPages(totalP)
      setTotalElements(totalE)
      setEquipes(eq)
      setCorretores(users.filter((u:Usuario)=> u.ativo && (u.papel==='corretor' || u.papel==='gestor')))
    } catch (e:any) {
      if (controller.signal.aborted) return
      // exibido uma vez, no lugar da lista, com "Tentar novamente" (antes: também um toast repetido)
      setError(textoDoErro(parseApiError(e)))
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
    return () => controller.abort()
  }, [page])

  useEffect(()=>{ load(page) }, [load, page])

  const handleRedistribuir = async (lead: LeadAguardando) => {
    if (lead?.id == null || !Number.isFinite(Number(lead.id))) {
      toast('Não foi possível identificar este lead. Recarregue a página e tente novamente.','error'); return
    }
    const novoId = selected[lead.id]
    // aviso junto ao campo da própria linha (antes: toast genérico "Selecione um corretor")
    if (!novoId) { setSelecaoErro(s => ({ ...s, [lead.id]: 'Selecione o novo corretor responsável.' })); return }
    const novoNome = corretores.find(c => String(c.id) === novoId)?.nome ?? 'o corretor selecionado'
    setEnviando(lead.id)
    try {
      await leadService.redistribuir(lead.id, Number(novoId))
      toast(`Lead ${lead.nome} atribuído a ${novoNome}, que receberá uma notificação.`,'success')
      try { localStorage.setItem('crm:lastRedistribuicao', JSON.stringify({ leadId: lead.id, novoCorretorId: Number(novoId), at: Date.now() })) } catch {}
      load(page)
    } catch (e:any) {
      const p = notificarErro(toast, `Não foi possível atribuir o lead ${lead.nome}`, e)
      if (p.fields?.novoCorretorId) setSelecaoErro(s => ({ ...s, [lead.id]: p.fields!.novoCorretorId }))
    } finally {
      setEnviando(null)
    }
  }

  const handleVerHistorico = async (lead: LeadAguardando) => {
    if (lead?.id == null) return
    if (historicos[lead.id]) { setDrawerLead(lead); return }
    setHistLoading(s=> ({...s, [lead.id]: true}))
    try {
      const h = await leadService.getHistoricoResponsaveis(lead.id)
      setHistoricos(prev=> ({...prev, [lead.id]: h}))
      setDrawerLead(lead)
    } catch (e:any) {
      notificarErro(toast, `Não foi possível carregar o histórico de ${lead.nome}`, e)
    } finally {
      setHistLoading(s=> ({...s, [lead.id]: false}))
    }
  }

  // após recarregar, leads que já foram atribuídos (por esta ou outra pessoa) saem da seleção
  useEffect(() => { setMarcados(m => podarSelecao(m, leads.map(l => l.id))) }, [leads])

  /** Corretores possíveis para um lead: os da equipe do lead (ou todos, se ninguém estiver vinculado à equipe). */
  const corretoresDaEquipe = useCallback((equipeId?: number | null) => {
    const daEquipe = corretores.filter(c => {
      if (!equipeId) return true
      if (c.equipeId === equipeId) return true
      if (!c.equipeId && c.gestorId) {
        const eqGestor = equipes.find(e => e.gestorId === c.gestorId)
        if (eqGestor && eqGestor.id === equipeId) return true
      }
      return false
    })
    return daEquipe.length ? daEquipe : corretores
  }, [corretores, equipes])

  const leadsMarcados = useMemo(() => leads.filter(l => marcados.has(l.id)), [leads, marcados])
  // se todos os marcados são da mesma equipe, oferece só os corretores dela; se não, todos (o servidor valida)
  const opcoesMassa = useMemo(() => {
    const equipesMarcadas = Array.from(new Set(leadsMarcados.map(l => l.equipeId ?? null)))
    return equipesMarcadas.length === 1 ? corretoresDaEquipe(equipesMarcadas[0]) : corretores
  }, [leadsMarcados, corretoresDaEquipe, corretores])
  const variasEquipes = new Set(leadsMarcados.map(l => l.equipeId ?? null)).size > 1

  const handleAtribuirEmMassa = async () => {
    if (marcados.size === 0) return
    if (marcados.size > MAX_ATRIBUICAO_EM_MASSA) {
      toast(`Selecione no máximo ${MAX_ATRIBUICAO_EM_MASSA} leads por vez.`, 'warning'); return
    }
    if (!destinoMassa) {
      setDestinoMassaErro('Selecione o corretor que receberá os leads selecionados.')
      document.getElementById('destino-massa')?.focus()
      return
    }
    const destino = corretores.find(c => String(c.id) === destinoMassa)
    const nomeDestino = destino?.nome ?? 'o corretor selecionado'
    const n = leadsMarcados.length
    const ok = await confirmar({
      titulo: `Atribuir ${plural(n, 'lead', 'leads')} a ${nomeDestino}?`,
      mensagem: (
        <div className="space-y-2">
          <p><strong>Leads selecionados:</strong> {resumoNomes(leadsMarcados.map(l => l.nome))}.</p>
          <p><strong>Novo corretor:</strong> {nomeDestino}{destino?.equipeNome ? ` (${destino.equipeNome})` : ''}.</p>
          <p>{nomeDestino} receberá uma notificação na plataforma e por e-mail. Se algum lead não puder ser atribuído, nenhum será alterado.</p>
        </div>
      ),
      confirmarLabel: `Atribuir ${plural(n, 'lead', 'leads')}`,
    })
    if (!ok) return
    setEnviandoMassa(true)
    try {
      const r = await leadService.redistribuirEmMassa(leadsMarcados.map(l => l.id), Number(destinoMassa))
      toast(`${plural(r.atribuidos, 'lead atribuído', 'leads atribuídos')} a ${nomeDestino}, que receberá uma notificação.`, 'success')
      try { localStorage.setItem('crm:lastRedistribuicao', JSON.stringify({ leadIds: leadsMarcados.map(l => l.id), novoCorretorId: Number(destinoMassa), at: Date.now() })) } catch {}
      setMarcados(new Set())
      setDestinoMassa('')
      load(page)
    } catch (e) {
      const p = notificarErro(toast, `Não foi possível atribuir os leads a ${nomeDestino}`, e)
      if (p.fields?.novoCorretorId) setDestinoMassaErro(p.fields.novoCorretorId)
    } finally {
      setEnviandoMassa(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-surface p-8"><p className="text-muted motion-safe:animate-pulse" role="status">Carregando leads aguardando redistribuição...</p></div>
  if (error) return <div className="min-h-screen bg-surface p-8"><ErrorState message="Não foi possível carregar os leads aguardando redistribuição." details={error} onRetry={()=>load(page)} /></div>

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-12 rounded-xl bg-warning-bg text-warning flex items-center justify-center"><AlertTriangle size={24} /></span>
          <div>
            <h1 className="text-3xl font-bold text-ink">Aguardando Redistribuição</h1>
            <p className="text-muted">Leads que ficaram sem corretor após a desativação do responsável. Atribua cada um a um corretor ativo da mesma equipe, ou selecione vários e atribua de uma vez.</p>
          </div>
          <span className="ml-auto bg-warning-bg text-warning px-3 py-1 rounded-full text-sm font-bold">{totalElements} {totalElements === 1 ? 'pendente' : 'pendentes'}</span>
        </div>

        {leads.length===0 ? (
          <div className="bg-card border border-line rounded-card shadow-card p-12 text-center">
            <Users size={48} className="mx-auto text-muted opacity-50" aria-hidden="true" />
            <p className="text-ink font-semibold mt-3">Nenhum lead aguardando redistribuição</p>
            <p className="text-sm text-muted">Todos os leads têm um corretor responsável.</p>
          </div>
        ) : (
          <div className="bg-card border border-line rounded-card shadow-card overflow-hidden">
            {/* barra da atribuição em massa: aparece quando há leads marcados */}
            {marcados.size > 0 && (
              <div className="sticky top-0 z-10 border-b border-brand/30 bg-brand-soft px-4 py-3 flex flex-col lg:flex-row lg:items-start gap-3" role="region" aria-label="Atribuição em massa">
                <p className="text-sm text-ink lg:pt-2 flex items-center gap-2">
                  <CheckSquare size={16} className="text-brand-fg" aria-hidden="true" />
                  <strong>{plural(marcados.size, 'lead selecionado', 'leads selecionados')}</strong>
                  <button onClick={() => setMarcados(new Set())} className="text-xs text-brand-fg hover:underline">Limpar seleção</button>
                </p>
                <div className="flex-1 lg:max-w-sm">
                  <label htmlFor="destino-massa" className="sr-only">Corretor que receberá os leads selecionados</label>
                  <select id="destino-massa" value={destinoMassa}
                    onChange={e => { setDestinoMassa(e.target.value); setDestinoMassaErro(undefined) }}
                    aria-invalid={!!destinoMassaErro || undefined} aria-describedby={destinoMassaErro ? 'destino-massa-erro' : variasEquipes ? 'destino-massa-ajuda' : undefined}
                    className={`w-full p-2 border rounded-btn bg-card text-sm ${destinoMassaErro ? 'border-danger' : 'border-line'}`}>
                    <option value="">Selecione o corretor que receberá os leads</option>
                    {opcoesMassa.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.equipeNome || 's/ equipe'})</option>)}
                  </select>
                  <InlineError id="destino-massa-erro" message={destinoMassaErro} />
                  {variasEquipes && !destinoMassaErro && (
                    <p id="destino-massa-ajuda" className="text-xs text-warning mt-1">Os leads selecionados são de equipes diferentes. Só administradores podem atribuí-los a um corretor de outra equipe.</p>
                  )}
                </div>
                <button onClick={handleAtribuirEmMassa} disabled={enviandoMassa}
                  className="inline-flex items-center justify-center gap-1.5 bg-brand text-on-brand px-4 py-2 rounded-btn font-semibold shadow-btn hover:bg-brand-hover disabled:opacity-60">
                  <ArrowRight size={16} aria-hidden="true" />
                  {enviandoMassa ? 'Atribuindo leads...' : `Atribuir ${plural(marcados.size, 'lead', 'leads')}`}
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-subtle border-b border-line text-xs font-bold text-muted uppercase">
                  <tr>
                    <th className="p-3 w-10">
                      <input type="checkbox" aria-label="Selecionar todos os leads desta página"
                        checked={estadoSelecaoTodos(marcados, leads.map(l => l.id)) === 'todos'}
                        ref={el => { if (el) el.indeterminate = estadoSelecaoTodos(marcados, leads.map(l => l.id)) === 'parcial' }}
                        onChange={() => setMarcados(m => alternarTodos(m, leads.map(l => l.id)))} />
                    </th>
                    <th className="text-left p-3">Lead</th>
                    <th className="text-left p-3">Equipe</th>
                    <th className="text-left p-3">Corretor anterior</th>
                    <th className="text-left p-3">Motivo / Desde</th>
                    <th className="text-left p-3">Novo corretor</th>
                    <th className="text-center p-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {leads.map(lead=> {
                    if (lead?.id == null) return null
                    const equipeCorretores = corretoresDaEquipe(lead.equipeId)
                    const fallbackVazio = !!lead.equipeId && equipeCorretores === corretores && !corretores.some(c => c.equipeId === lead.equipeId)
                    const marcado = marcados.has(lead.id)
                    return (
                      <tr key={lead.id} className={marcado ? 'bg-brand-soft/40' : 'hover:bg-surface'}>
                        <td className="p-3 align-top">
                          <input type="checkbox" checked={marcado} aria-label={`Selecionar ${lead.nome}`}
                            onChange={() => setMarcados(m => alternarSelecao(m, lead.id))} />
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-ink">{lead.nome}</p>
                          <p className="text-xs text-muted">{[lead.email, lead.telefone].filter(Boolean).join(' • ') || 'Sem contato cadastrado'}</p>
                          <span className="inline-flex mt-1 px-2 py-0.5 bg-warning-bg text-warning rounded-full text-xs font-bold">AGUARDANDO</span>
                          {lead.responsavelRedistribuicaoNome && (
                            <p className="text-xs text-muted mt-1">Responsável: <span className="text-ink">{lead.responsavelRedistribuicaoNome}</span></p>
                          )}
                        </td>
                        <td className="p-3 text-muted">{lead.equipeNome || equipes.find(e=>e.id===lead.equipeId)?.nome || '-'}</td>
                        <td className="p-3">
                          <p className="text-ink">{lead.corretorAnteriorNome || '-'}</p>
                          <button onClick={()=>handleVerHistorico(lead)} className="text-xs text-brand-fg hover:underline inline-flex items-center gap-1 mt-1">
                            <Eye size={12} aria-hidden="true" /> {histLoading[lead.id] ? 'Carregando histórico...' : 'Ver histórico'}
                          </button>
                        </td>
                        <td className="p-3 text-xs text-muted">
                          {motivoLegivel(lead.motivoDesligamento)}<br />
                          {lead.dataDesligamento ? format(new Date(lead.dataDesligamento),'dd/MM/yyyy HH:mm') : format(new Date(lead.dataAtualizacao),'dd/MM/yyyy')}
                        </td>
                        <td className="p-3">
                          {fallbackVazio && <p className="text-xs text-warning mb-1">Nenhum corretor ativo está vinculado à equipe deste lead; a lista mostra todos os corretores. Para corrigir, use &quot;Sincronizar liderados&quot; na tela Equipes.</p>}
                          <select aria-label={`Novo corretor para ${lead.nome}`} aria-invalid={!!selecaoErro[lead.id]} value={selected[lead.id]||''} onChange={e=> { const v = e.target.value; setSelected(s=>({...s,[lead.id]:v})); setSelecaoErro(s=>({...s,[lead.id]:undefined})) }} className={`w-full p-2 border ${selecaoErro[lead.id] ? 'border-danger' : 'border-line'} rounded-btn bg-card text-sm`}>
                            <option value="">Selecione o corretor</option>
                            {equipeCorretores.map(c=> {
                              const mismatch = lead.equipeId && c.equipeId && c.equipeId!==lead.equipeId
                              return <option key={c.id} value={c.id}>{c.nome} ({c.equipeNome||'s/ equipe'}){mismatch ? ' - outra equipe (admin)' : ''}</option>
                            })}
                          </select>
                          <InlineError message={selecaoErro[lead.id]} />
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={()=>handleRedistribuir(lead)} disabled={enviando === lead.id} className="inline-flex items-center gap-1.5 bg-brand text-on-brand px-4 py-2 rounded-btn font-semibold shadow-btn hover:bg-brand-hover disabled:opacity-60">
                            <ArrowRight size={16} aria-hidden="true" /> {enviando === lead.id ? 'Atribuindo...' : 'Atribuir'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-line flex items-center justify-between bg-surface text-sm">
                <span className="text-muted">Página {page+1} de {totalPages} • {totalElements} no total</span>
                <div className="flex gap-2">
                  <button aria-label="Página anterior" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="p-2 border border-line rounded-btn bg-card disabled:opacity-50"><ChevronLeft size={16}/></button>
                  <button aria-label="Próxima página" disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)} className="p-2 border border-line rounded-btn bg-card disabled:opacity-50"><ChevronRight size={16}/></button>
                </div>
              </div>
            )}
          </div>
        )}

        {drawerLead && (
          <div className="fixed inset-0 bg-overlay/40 flex justify-end z-50" onClick={()=>setDrawerLead(null)}>
            <div className="w-full max-w-md bg-card h-full overflow-y-auto shadow-xl p-6" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ink">Histórico – {drawerLead.nome}</h2>
                <button onClick={()=>setDrawerLead(null)} aria-label="Fechar histórico" className="p-2 hover:bg-surface rounded-btn"><X size={18} aria-hidden="true"/></button>
              </div>
              <div className="space-y-3">
                {/* o painel só abre depois de carregar; lista vazia = lead sem registros (antes ficava "Carregando..." para sempre) */}
                {(historicos[drawerLead.id] || []).length===0 ? <p className="text-sm text-muted">Nenhuma troca de responsável registrada para este lead.</p> : historicos[drawerLead.id].map((h:any, idx:number)=>(
                  <div key={h.id || idx} className="border border-line rounded-btn p-3 bg-surface">
                    <p className="text-sm font-semibold text-ink">{h.corretorNome || 'Sem corretor'} <span className="text-xs text-muted">({motivoLegivel(h.motivo)})</span></p>
                    <p className="text-xs text-muted">Equipe: {h.equipeNome || '-' } • Gestor: {h.gestorId || '-'}</p>
                    <p className="text-xs text-muted">{h.dataInicio ? format(new Date(h.dataInicio),'dd/MM/yyyy HH:mm') : ''} {h.dataFim ? `→ ${format(new Date(h.dataFim),'dd/MM/yyyy HH:mm')}` : '(aberto)'}</p>
                    <p className="text-xs text-muted">Por: {h.usuarioResponsavel || '-'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
