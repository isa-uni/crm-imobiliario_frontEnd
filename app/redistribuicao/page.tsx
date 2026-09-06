'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { leadService } from '@/service/leadService'
import { equipeService } from '@/service/equipeService'
import { usuarioService } from '@/service/usuarioService'
import { useToast } from '@/components/ui/ToastProvider'
import { parseApiError } from '@/lib/errorHandler'
import { ErrorState } from '@/components/ui/ErrorState'
import { Equipe, Usuario } from '@/types'
import { AlertTriangle, Users, ArrowRight, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react'
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
}

export default function RedistribuicaoPage() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<LeadAguardando[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [corretores, setCorretores] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [historicos, setHistoricos] = useState<Record<number, any[]>>({})
  const [histLoading, setHistLoading] = useState<Record<number, boolean>>({})
  const [drawerLead, setDrawerLead] = useState<LeadAguardando | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const loadingRef = useRef(false)

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
      const p = parseApiError(e); setError(p.message); toast(p.message,'error')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
    return () => controller.abort()
  }, [page, toast])

  useEffect(()=>{ load(page) }, [load, page])

  const handleRedistribuir = async (lead: LeadAguardando) => {
    if (lead?.id == null || !Number.isFinite(Number(lead.id))) { toast('Lead inválido','error'); return }
    const novoId = selected[lead.id]
    if (!novoId) { toast('Selecione um corretor','warning'); return }
    try {
      await leadService.redistribuir(lead.id, Number(novoId))
      toast(`Cliente ${lead.nome} atribuído com sucesso. O novo corretor receberá notificação e verá o cliente em Leads (página 1).`,'success')
      try { localStorage.setItem('crm:lastRedistribuicao', JSON.stringify({ leadId: lead.id, novoCorretorId: Number(novoId), at: Date.now() })) } catch {}
      load(page)
    } catch (e:any) {
      toast(parseApiError(e).message,'error')
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
      toast(parseApiError(e).message,'error')
    } finally {
      setHistLoading(s=> ({...s, [lead.id]: false}))
    }
  }

  if (loading) return <div className="min-h-screen bg-surface p-8"><p className="text-muted animate-pulse">Carregando clientes aguardando...</p></div>
  if (error) return <div className="min-h-screen bg-surface p-8"><ErrorState message={error} onRetry={()=>load(page)} /></div>

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center"><AlertTriangle size={24} /></span>
          <div>
            <h1 className="text-3xl font-bold text-ink">Aguardando Redistribuição</h1>
            <p className="text-muted">Clientes sem responsável após desligamento. Atribua a um corretor ativo da mesma equipe.</p>
          </div>
          <span className="ml-auto bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">{totalElements} pendentes</span>
        </div>

        {leads.length===0 ? (
          <div className="bg-white border border-line rounded-card shadow-card p-12 text-center">
            <Users size={48} className="mx-auto text-muted opacity-50" />
            <p className="text-ink font-semibold mt-3">Nenhum cliente aguardando</p>
            <p className="text-sm text-muted">Todos os clientes estão atribuídos.</p>
          </div>
        ) : (
          <div className="bg-white border border-line rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#eef2f7] border-b border-line text-xs font-bold text-muted uppercase">
                  <tr>
                    <th className="text-left p-3">Cliente</th>
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
                    let equipeCorretores = corretores.filter(c=> {
                      if (!lead.equipeId) return true
                      if (c.equipeId===lead.equipeId) return true
                      if (!c.equipeId && c.gestorId) {
                        const eqGestor = equipes.find(e=> e.gestorId===c.gestorId)
                        if (eqGestor && eqGestor.id===lead.equipeId) return true
                      }
                      return false
                    })
                    const fallbackVazio = equipeCorretores.length===0
                    if (fallbackVazio) equipeCorretores = corretores
                    return (
                      <tr key={lead.id} className="hover:bg-surface">
                        <td className="p-3">
                          <p className="font-semibold text-ink">{lead.nome}</p>
                          <p className="text-xs text-muted">{lead.email} • {lead.telefone}</p>
                          <span className="inline-flex mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">AGUARDANDO</span>
                        </td>
                        <td className="p-3 text-muted">{lead.equipeNome || equipes.find(e=>e.id===lead.equipeId)?.nome || '-'}</td>
                        <td className="p-3">
                          <p className="text-ink">{lead.corretorAnteriorNome || '-'}</p>
                          <button onClick={()=>handleVerHistorico(lead)} className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                            <Eye size={12} /> {histLoading[lead.id] ? 'Carregando...' : 'Ver histórico'}
                          </button>
                        </td>
                        <td className="p-3 text-xs text-muted">
                          {lead.motivoDesligamento || 'DESLIGAMENTO_CORRETOR'}<br />
                          {lead.dataDesligamento ? format(new Date(lead.dataDesligamento),'dd/MM/yyyy HH:mm') : format(new Date(lead.dataAtualizacao),'dd/MM/yyyy')}
                        </td>
                        <td className="p-3">
                          {fallbackVazio && <p className="text-xs text-amber-700 mb-1">Nenhum corretor com equipe vinculada. Sincronize a equipe em Equipes.</p>}
                          <select value={selected[lead.id]||''} onChange={e=> setSelected(s=>({...s,[lead.id]:e.target.value}))} className="w-full p-2 border border-line rounded-btn bg-white text-sm">
                            <option value="">Selecione</option>
                            {equipeCorretores.map(c=> {
                              const mismatch = lead.equipeId && c.equipeId && c.equipeId!==lead.equipeId
                              return <option key={c.id} value={c.id}>{c.nome} ({c.equipeNome||'s/ equipe'}){mismatch ? ' - outra equipe (admin)' : ''}</option>
                            })}
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={()=>handleRedistribuir(lead)} className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-btn font-semibold shadow-btn hover:bg-primary-700">
                            <ArrowRight size={16} /> Confirmar
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
                <span className="text-muted">Página {page+1} de {totalPages} • {totalElements} total</span>
                <div className="flex gap-2">
                  <button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="p-2 border border-line rounded-btn bg-white disabled:opacity-50"><ChevronLeft size={16}/></button>
                  <button disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)} className="p-2 border border-line rounded-btn bg-white disabled:opacity-50"><ChevronRight size={16}/></button>
                </div>
              </div>
            )}
          </div>
        )}

        {drawerLead && (
          <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={()=>setDrawerLead(null)}>
            <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-xl p-6" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ink">Histórico – {drawerLead.nome}</h2>
                <button onClick={()=>setDrawerLead(null)} className="p-2 hover:bg-surface rounded-btn"><X size={18}/></button>
              </div>
              <div className="space-y-3">
                {(historicos[drawerLead.id] || []).length===0 ? <p className="text-sm text-muted">Carregando...</p> : historicos[drawerLead.id].map((h:any, idx:number)=>(
                  <div key={h.id || idx} className="border border-line rounded-btn p-3 bg-surface">
                    <p className="text-sm font-semibold text-ink">{h.corretorNome || 'Sem corretor'} <span className="text-xs text-muted">({h.motivo})</span></p>
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
