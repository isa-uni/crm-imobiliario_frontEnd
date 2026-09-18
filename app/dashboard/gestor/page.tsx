'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Users, TrendingUp, DollarSign, Target, Clock, AlertTriangle,
  RefreshCw, Building2, Tag, Calendar, Award, ArrowUp, ArrowDown
} from 'lucide-react'
import { authService } from '@/service/authService'
import { dashboardGestorService, DashboardGestorDTO } from '@/service/dashboardGestorService'
import { origemOptions } from '@/service/origemOptions'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'

const PIPELINE_COLORS: Record<string,string> = {
  lead: '#0f2740', oportunidade: '#27506f', 'visita-agendada': '#f2a900',
  'visita-realizada': '#4a9c76', pasta: '#e8914a', aprovado: '#3fb3b3', contrato: '#7a5ca8', descarte: '#c0392b'
}
const CORES = ["#0f2740","#f2a900","#27506f","#e8914a","#4a9c76","#3fb3b3","#7a5ca8"]

function KpiCard({ icon, label, value, sub, variacao }: { icon: React.ReactNode, label: string, value: string, sub?: string, variacao?: number }) {
  return (
    <div className="bg-white border border-line rounded-card shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">{icon}</span>
          <p className="text-sm text-muted">{label}</p>
        </div>
        {variacao !== undefined && variacao !== 0 && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${variacao>0?'bg-[#e8f6ee] text-[#0f8a52]':'bg-red-50 text-[#c0392b]'}`}>
            {variacao>0?<ArrowUp size={12}/>:<ArrowDown size={12}/>} {Math.abs(variacao).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}

function Skeleton() {
  return <div className="animate-pulse bg-line rounded-card h-32" />
}

export default function DashboardGestor() {
  const [nome, setNome] = useState('')
  const [data, setData] = useState<DashboardGestorDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [equipe, setEquipe] = useState<any[]>([])
  const [filtros, setFiltros] = useState({
    inicio: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    fim: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    corretorId: '' as string,
    origem: '',
    status: '',
  })
  const [sortRanking, setSortRanking] = useState<'negocios'|'leads'|'conversao'>('negocios')
  const [metaForm, setMetaForm] = useState<{usuarioId:string, metaContratos:string}>({usuarioId:'', metaContratos:''})
  const [savingMeta, setSavingMeta] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await dashboardGestorService.getDashboard({
        inicio: filtros.inicio, fim: filtros.fim,
        corretorId: filtros.corretorId ? Number(filtros.corretorId) : undefined,
        origem: filtros.origem || undefined,
        status: filtros.status || undefined,
      })
      setData(res)
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data || e?.message || 'Erro ao carregar dashboard'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally { setLoading(false) }
  }

  useEffect(() => {
    setNome(authService.getUsuario()?.nome?.split(' ')[0] || '')
    dashboardGestorService.getEquipe().then(setEquipe).catch(()=>{})
  }, [])

  useEffect(() => { load() }, [filtros.inicio, filtros.fim, filtros.corretorId, filtros.origem, filtros.status])

  const periodoLabel = useMemo(() => {
    try {
      return `${format(new Date(filtros.inicio+'T12:00:00'), "dd MMM", {locale: ptBR})} — ${format(new Date(filtros.fim+'T12:00:00'), "dd MMM yyyy", {locale: ptBR})}`
    } catch { return `${filtros.inicio} - ${filtros.fim}` }
  }, [filtros.inicio, filtros.fim])

  const rankingSorted = useMemo(() => {
    if (!data) return []
    const arr = [...data.rankingCorretores]
    if (sortRanking === 'leads') arr.sort((a,b)=>b.leads-a.leads)
    else if (sortRanking === 'conversao') arr.sort((a,b)=>b.conversao-a.conversao)
    else arr.sort((a,b)=>b.negocios-a.negocios)
    return arr
  }, [data, sortRanking])

  const handleSalvarMeta = async () => {
    if (!metaForm.usuarioId || !metaForm.metaContratos) return
    setSavingMeta(true)
    try {
      const mesRef = filtros.inicio.slice(0,7)+'-01'
      await dashboardGestorService.salvarMeta({
        usuarioId: Number(metaForm.usuarioId),
        mesReferencia: mesRef,
        metaContratos: Number(metaForm.metaContratos)
      })
      setMetaForm({usuarioId:'', metaContratos:''})
      load()
    } catch (e:any) {
      alert(e?.response?.data || 'Erro ao salvar meta')
    } finally { setSavingMeta(false) }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="bg-primary border-b border-primary-700">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-7">
            <h1 className="text-3xl font-bold text-white">Dashboard do Gestor</h1>
            <p className="text-primary-100/70 mt-1">Carregando...</p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton/><Skeleton/><Skeleton/><Skeleton/><Skeleton/><Skeleton/>
        </main>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="bg-primary border-b border-primary-700">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-7">
            <h1 className="text-3xl font-bold text-white">Dashboard do Gestor</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-12 text-center">
          <div className="bg-white border border-line rounded-card shadow-card p-10">
            <AlertTriangle className="mx-auto text-accent mb-3" size={32}/>
            <p className="text-ink font-semibold">Erro ao carregar dados</p>
            <p className="text-sm text-muted mt-1 break-all">{error}</p>
            <p className="text-xs text-muted mt-3">Verifique se o backend está em execução e seu usuário tem papel <b>gestor</b> ou <b>admin</b>. Endereço esperado: <code>GET /dashboard/gestor</code></p>
            <button onClick={load} className="mt-6 px-6 py-2.5 bg-primary text-white rounded-btn font-semibold shadow-btn hover:bg-primary-700">Tentar novamente</button>
          </div>
        </main>
      </div>
    )
  }

  const k = data!.kpis
  const d = data!
  const fmtBRL = (v:number) => v >= 1000000 ? `R$ ${(v/1000000).toFixed(1)}M` : v >= 1000 ? `R$ ${(v/1000).toFixed(0)}k` : `R$ ${v.toLocaleString('pt-BR')}`
  const fmtBRLFloat = (v:number) => v >= 1000000 ? `R$ ${(v/1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M` : v >= 1000 ? `R$ ${(v/1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}k` : `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-primary border-b border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-primary font-black text-sm shadow-btn">G</span>
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard do Gestor</h1>
              </div>
              <p className="text-primary-100/80 mt-1 text-sm">Olá, {nome} — {periodoLabel} • {equipe.length} corretor(es) na sua equipe</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={filtros.inicio} onChange={e=>setFiltros(f=>({...f, inicio:e.target.value}))} className="px-3 py-2 rounded-btn border border-line text-sm bg-white text-ink" />
              <span className="text-primary-100">—</span>
              <input type="date" value={filtros.fim} onChange={e=>setFiltros(f=>({...f, fim:e.target.value}))} className="px-3 py-2 rounded-btn border border-line text-sm bg-white text-ink" />
              <button onClick={load} disabled={loading} className="w-9 h-9 rounded-btn bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20">
                <RefreshCw size={18} className={loading?'animate-spin':''}/>
              </button>
            </div>
          </div>

          {/* filtros */}
          <div className="mt-6 flex flex-wrap gap-3">
            <select value={filtros.corretorId} onChange={e=>setFiltros(f=>({...f, corretorId:e.target.value}))} className="px-3 py-2 rounded-btn border border-white/20 bg-white text-ink text-sm min-w-[160px]">
              <option value="">Todos corretores</option>
              {equipe.map(u=> <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
            <select value={filtros.origem} onChange={e=>setFiltros(f=>({...f, origem:e.target.value}))} className="px-3 py-2 rounded-btn border border-white/20 bg-white text-ink text-sm min-w-[160px]">
              <option value="">Todas origens</option>
              {origemOptions.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={filtros.status} onChange={e=>setFiltros(f=>({...f, status:e.target.value}))} className="px-3 py-2 rounded-btn border border-white/20 bg-white text-ink text-sm min-w-[160px]">
              <option value="">Todos status</option>
              {["lead","oportunidade","visita-agendada","visita-realizada","pasta","aprovado","contrato","descarte"].map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
            {(filtros.corretorId || filtros.origem || filtros.status) && (
              <button onClick={()=>setFiltros(f=>({...f, corretorId:'', origem:'', status:''}))} className="px-3 py-2 rounded-btn bg-accent text-primary text-sm font-semibold">Limpar filtros</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard icon={<Users size={18}/>} label="Leads recebidos" value={`${k.leadsRecebidos}`} sub={`${k.leadsRecebidosAnterior} no período anterior`} variacao={k.variacaoLeads} />
          <KpiCard icon={<Award size={18}/>} label="Negócios fechados" value={`${k.negociosFechados}`} sub={`${k.negociosAnterior} anterior`} variacao={k.variacaoNegocios} />
          <KpiCard icon={<DollarSign size={18}/>} label="Valor vendido" value={fmtBRLFloat(k.valorVendido)} sub={fmtBRL(k.valorAnterior)+' anterior'} variacao={k.variacaoValor} />
          <KpiCard icon={<Target size={18}/>} label="Taxa conversão" value={`${k.taxaConversao.toFixed(1)}%`} />
          <KpiCard icon={<Clock size={18}/>} label="Tempo médio" value={`${k.tempoMedioDias.toFixed(0)} dias`} sub="entrada → fechamento" />
        </div>

        {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-card text-sm">{error}</div>}

        {/* Ranking corretores */}
        <div className="bg-white border border-line rounded-card shadow-card p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-ink flex items-center gap-2"><Award size={18} className="text-primary"/> Corretores mais ativos</h2>
            <div className="flex gap-2">
              {(['negocios','leads','conversao'] as const).map(s=> (
                <button key={s} onClick={()=>setSortRanking(s)} className={`px-3 py-1.5 rounded-btn text-xs font-semibold border ${sortRanking===s?'bg-primary text-white border-primary':'bg-white text-muted border-line hover:bg-surface'}`}>
                  {s==='negocios'?'Negócios':s==='leads'?'Leads':'Conversão'}
                </button>
              ))}
            </div>
          </div>
          {rankingSorted.length===0 ? (
            <p className="text-sm text-muted py-8 text-center">Nenhum corretor na equipe ou sem dados no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted border-b border-line">
                    <th className="text-left py-2.5 font-semibold">Corretor</th>
                    <th className="text-right py-2.5 font-semibold">Leads</th>
                    <th className="text-right py-2.5 font-semibold">Oportunidades</th>
                    <th className="text-right py-2.5 font-semibold">Contratos</th>
                    <th className="text-right py-2.5 font-semibold">Conversão</th>
                    <th className="text-center py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingSorted.map((r,i)=> (
                    <tr key={r.corretorId} className="border-b border-line/60 hover:bg-surface/60">
                      <td className="py-3 font-medium text-ink flex items-center gap-2">
                        {i===0 && <span className="w-6 h-6 rounded-full bg-accent text-primary flex items-center justify-center text-xs font-black">1</span>}
                        {r.nome}
                      </td>
                      <td className="text-right py-3">{r.leads}</td>
                      <td className="text-right py-3">{r.propostas}</td>
                      <td className="text-right py-3 font-semibold">{r.negocios}</td>
                      <td className="text-right py-3">{r.conversao.toFixed(1)}%</td>
                      <td className="text-center py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.statusAtencao==='ok'?'bg-[#e8f6ee] text-[#0f8a52]':r.statusAtencao==='atencao'?'bg-amber-50 text-amber-700':'bg-red-50 text-[#c0392b]'}`}>
                          {r.statusAtencao==='ok'?'OK':r.statusAtencao==='atencao'?'Atenção':'Crítico'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pipeline */}
        <div className="bg-white border border-line rounded-card shadow-card p-6">
          <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-primary"/> Pipeline comercial</h2>
          {d.pipeline.length===0 ? <p className="text-sm text-muted py-6 text-center">Sem dados de pipeline no período.</p> : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {d.pipeline.filter(p=>p.quantidade>0).map(p=> (
                  <div key={p.status} className="border border-line rounded-card p-4 text-center bg-surface/50">
                    <p className="text-xs text-muted">{p.label}</p>
                    <p className="text-2xl font-bold text-ink mt-1">{p.quantidade}</p>
                    <p className="text-xs text-muted">{p.percentual.toFixed(1)}%</p>
                    {p.valorPotencial>0 && <p className="text-xs text-[#0f8a52] font-medium mt-1">{fmtBRL(p.valorPotencial)}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-6 h-10 flex rounded-full overflow-hidden border border-line">
                {d.pipeline.map(p=> (
                  <div key={p.status} style={{ width: `${p.percentual}%`, background: PIPELINE_COLORS[p.status]||'#e1e8f0' }} className="flex items-center justify-center text-[10px] font-bold text-white" title={`${p.label}: ${p.quantidade}`}>
                    {p.percentual>=8 ? p.quantidade : ''}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Metas */}
        <div className="bg-white border border-line rounded-card shadow-card p-6">
          <h2 className="text-lg font-semibold text-ink mb-2 flex items-center gap-2"><Target size={18} className="text-primary"/> Meta da equipe — {format(new Date(filtros.inicio+'T12:00:00'), 'MMMM yyyy', {locale: ptBR})}</h2>
          {d.metas.metaContratosTotal===0 ? (
            <div className="py-4">
              <p className="text-sm text-muted">Nenhuma meta cadastrada para este mês. Cadastre abaixo por corretor (contratos).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface rounded-card p-4 border border-line">
                <p className="text-xs text-muted">Meta contratos</p>
                <p className="text-xl font-bold text-ink">{d.metas.metaContratosTotal} contratos</p>
              </div>
              <div className="bg-surface rounded-card p-4 border border-line">
                <p className="text-xs text-muted">Realizado</p>
                <p className="text-xl font-bold text-[#0f8a52]">{d.metas.realizadoContratos} contratos</p>
                <p className="text-xs text-muted mt-1">{d.metas.percentualContratos.toFixed(1)}% atingido</p>
              </div>
              <div className="bg-surface rounded-card p-4 border border-line">
                <p className="text-xs text-muted">Faltante</p>
                <p className="text-xl font-bold text-ink">{d.metas.faltanteContratos} contratos</p>
                <div className="mt-2 h-2 bg-line rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, d.metas.percentualContratos)}%` }} />
                </div>
                <p className="text-xs text-muted mt-1">{d.metas.percentualContratos.toFixed(1)}% concluído</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted border-b border-line">
                  <th className="text-left py-2 font-semibold">Corretor</th>
                  <th className="text-right py-2 font-semibold">Meta gestor</th>
                  <th className="text-right py-2 font-semibold">Meta corretor</th>
                  <th className="text-right py-2 font-semibold">Meta em uso</th>
                  <th className="text-right py-2 font-semibold">Realizado</th>
                  <th className="text-right py-2 font-semibold">% contr.</th>
                  <th className="text-center py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {d.metas.porCorretor.map(m=> (
                  <tr key={m.corretorId} className="border-b border-line/60">
                    <td className="py-2.5 font-medium text-ink">{m.nome}</td>
                    <td className="text-right py-2.5">{m.metaGestor ?? <span className="text-muted">—</span>}</td>
                    <td className="text-right py-2.5">{m.metaPropria ?? <span className="text-muted">—</span>}</td>
                    <td className="text-right py-2.5 font-semibold">{m.metaContratos ?? <span className="text-muted">—</span>}</td>
                    <td className="text-right py-2.5">{m.realizadoContratos}</td>
                    <td className="text-right py-2.5">{m.percentualContratos.toFixed(0)}%</td>
                    <td className="text-center py-2.5">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${m.status==='atingida'?'bg-[#e8f6ee] text-[#0f8a52]':m.status==='proxima'?'bg-amber-50 text-amber-700':m.status==='abaixo'?'bg-red-50 text-[#c0392b]':'bg-surface text-muted border border-line'}`}>
                        {m.status==='atingida'?'Atingida':m.status==='proxima'?'Próxima':m.status==='abaixo'?'Abaixo':m.status==='sem_meta'?'Sem meta':'Sem mov.'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-surface border border-line rounded-card">
            <p className="text-sm font-semibold text-ink mb-3">Cadastrar / atualizar meta do mês</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={metaForm.usuarioId} onChange={e=>setMetaForm(f=>({...f, usuarioId:e.target.value}))} className="px-3 py-2 rounded-btn border border-line bg-white text-sm text-ink">
                <option value="">Corretor</option>
                {equipe.map(u=> <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
              <input placeholder="Meta contratos (ex 5)" type="number" value={metaForm.metaContratos} onChange={e=>setMetaForm(f=>({...f, metaContratos:e.target.value}))} className="px-3 py-2 rounded-btn border border-line bg-white text-sm text-ink" />
              <button onClick={handleSalvarMeta} disabled={savingMeta} className="px-4 py-2 rounded-btn bg-primary text-white font-semibold shadow-btn hover:bg-primary-700 disabled:opacity-50">
                {savingMeta?'Salvando...':'Salvar meta'}
              </button>
            </div>
            <p className="text-xs text-muted mt-2">Se já existir meta para o corretor no mês, será atualizada. Mês = {filtros.inicio.slice(0,7)}</p>
          </div>
        </div>

        {/* Tempo médio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-line rounded-card shadow-card p-6">
            <h3 className="font-semibold text-ink mb-2 flex items-center gap-2"><Clock size={18} className="text-primary"/> Tempo médio de conversão</h3>
            <p className="text-3xl font-bold text-ink">{d.tempoMedio.mediaGeralDias.toFixed(1)} dias</p>
            <p className="text-xs text-muted mb-4">Média entrada → fechamento</p>
            {d.tempoMedio.porCorretor.length===0 ? <p className="text-sm text-muted py-4 text-center">Sem negócios fechados no período.</p> : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.tempoMedio.porCorretor} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e1e8f0"/>
                    <XAxis type="number" tick={{fontSize:11}}/>
                    <YAxis dataKey="nome" type="category" width={110} tick={{fontSize:11}} tickFormatter={(v:string)=>v.length>14?v.slice(0,14)+'…':v}/>
                    <Tooltip formatter={(v:any)=>[`${Number(v).toFixed(1)} dias`, 'Média']} contentStyle={{borderRadius:10, border:'1px solid #e1e8f0'}}/>
                    <Bar dataKey="mediaDias" fill="#0f2740" radius={[0,6,6,0]} barSize={18}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="bg-white border border-line rounded-card shadow-card p-6">
            <h3 className="font-semibold text-ink mb-2">Evolução do tempo médio</h3>
            {d.tempoMedio.evolucao.length===0 ? <p className="text-sm text-muted py-8 text-center">Sem histórico.</p> : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.tempoMedio.evolucao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e1e8f0"/>
                    <XAxis dataKey="mes" tick={{fontSize:11}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip formatter={(v:any)=>[`${Number(v).toFixed(1)} dias`, 'Média']} contentStyle={{borderRadius:10, border:'1px solid #e1e8f0'}}/>
                    <Line type="monotone" dataKey="mediaDias" stroke="#f2a900" strokeWidth={2} dot={{r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-muted mt-2">Quanto menor, mais rápido o funil.</p>
          </div>
        </div>

        {/* Origens + Histórico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-line rounded-card shadow-card p-6">
            <h3 className="font-semibold text-ink mb-4 flex items-center gap-2"><Tag size={18} className="text-primary"/> Origem dos leads</h3>
            {d.origens.length===0 ? <p className="text-sm text-muted py-8 text-center">Sem dados.</p> : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={d.origens} dataKey="quantidade" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                        {d.origens.map((_,i)=><Cell key={i} fill={CORES[i%CORES.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v:any,_n,props:any)=>[`${v} (${props.payload.percentual.toFixed(1)}%)`, 'Leads']} contentStyle={{borderRadius:10, border:'1px solid #e1e8f0'}}/>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-muted border-b border-line"><th className="text-left py-1">Origem</th><th className="text-right py-1">Leads</th><th className="text-right py-1">Negócios</th><th className="text-right py-1">Taxa</th></tr></thead>
                    <tbody>
                      {d.origens.map(o=>(
                        <tr key={o.origem} className="border-b border-line/50"><td className="py-1.5 font-medium">{o.label}</td><td className="text-right">{o.quantidade} ({o.percentual.toFixed(1)}%)</td><td className="text-right">{o.negocios}</td><td className="text-right">{o.taxaConversao.toFixed(1)}%</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="bg-white border border-line rounded-card shadow-card p-6">
            <h3 className="font-semibold text-ink mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary"/> Histórico de leads</h3>
            {d.historico.length===0 ? <p className="text-sm text-muted py-8 text-center">Sem histórico.</p> : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.historico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e1e8f0"/>
                    <XAxis dataKey="periodo" tick={{fontSize:11}} tickFormatter={(v:string)=>v.slice(5)}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip contentStyle={{borderRadius:10, border:'1px solid #e1e8f0'}}/>
                    <Legend/>
                    <Area type="monotone" dataKey="recebidos" name="Recebidos" stroke="#0f2740" fill="#0f2740" fillOpacity={0.1}/>
                    <Area type="monotone" dataKey="contratos" name="Contratos" stroke="#0f8a52" fill="#0f8a52" fillOpacity={0.15}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Empreendimentos */}
        <div className="bg-white border border-line rounded-card shadow-card p-6">
          <h3 className="font-semibold text-ink mb-4 flex items-center gap-2"><Building2 size={18} className="text-primary"/> Empreendimentos mais procurados</h3>
          {d.empreendimentosMaisProcurados.length===0 ? <p className="text-sm text-muted py-8 text-center">Nenhum lead vinculado a empreendimento no período.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted border-b border-line"><th className="text-left py-2">Empreendimento</th><th className="text-right py-2">Interessados</th><th className="text-right py-2">Propostas</th><th className="text-right py-2">Negócios</th><th className="text-right py-2">Conversão</th></tr></thead>
                <tbody>
                  {d.empreendimentosMaisProcurados.map(im=>(
                    <tr key={im.empreendimentoId} className="border-b border-line/60"><td className="py-2.5 font-medium text-ink">{im.nome}</td><td className="text-right">{im.interessados}</td><td className="text-right">{im.propostas}</td><td className="text-right font-semibold">{im.negocios}</td><td className="text-right">{im.conversao.toFixed(1)}%</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alertas / visão da equipe */}
        <div className="bg-white border border-line rounded-card shadow-card p-6">
          <h3 className="font-semibold text-ink mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-accent"/> Pontos de atenção</h3>
          {d.alertas.length===0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted">Nenhum alerta — equipe sem pontos críticos no período.</p>
              <p className="text-xs text-muted mt-1">Critérios: conversão &lt;2% ou 0 negócios, meta distante &lt;70%.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {d.alertas.map((a,i)=>(
                <div key={i} className={`px-4 py-3 rounded-card border flex items-start gap-3 ${a.severidade==='critical'?'bg-red-50 border-red-200 text-[#7a1a1a]':a.severidade==='warning'?'bg-amber-50 border-amber-200 text-amber-900':'bg-surface border-line text-ink'}`}>
                  <AlertTriangle size={18} className="mt-0.5 shrink-0"/>
                  <div>
                    <p className="text-sm font-semibold">{a.mensagem}</p>
                    <p className="text-xs opacity-70">Tipo: {a.tipo} • {a.corretorNome}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#e8f6ee] border border-[#c8e8d5] rounded-card p-4">
              <p className="text-sm font-semibold text-[#0f3a22]">Melhores desempenhos</p>
              <ul className="mt-2 space-y-1 text-sm text-[#0f3a22]">
                {rankingSorted.slice(0,3).map(r=> <li key={r.corretorId}>• {r.nome} — {r.negocios} negócios, {r.conversao.toFixed(1)}% conversão</li>)}
                {rankingSorted.length===0 && <li className="text-muted">Sem dados</li>}
              </ul>
            </div>
            <div className="bg-surface border border-line rounded-card p-4">
              <p className="text-sm font-semibold text-ink">Como está a equipe?</p>
              <p className="text-sm text-muted mt-2">
                {k.leadsRecebidos} leads no mês • {k.negociosFechados} negócios • {k.taxaConversao.toFixed(1)}% conversão • ticket {fmtBRL(k.ticketMedio)} •
                {' '} {d.metas.percentualContratos.toFixed(0)}% da meta de contratos atingida.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
