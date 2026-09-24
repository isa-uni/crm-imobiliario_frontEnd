'use client'

import { useEffect, useState } from 'react'
import { equipeService } from '@/service/equipeService'
import { usuarioService } from '@/service/usuarioService'
import { useToast } from '@/components/ui/ToastProvider'
import { parseApiError } from '@/lib/errorHandler'
import { ErrorState } from '@/components/ui/ErrorState'
import { Equipe, Usuario } from '@/types'
import { Building2, Users, Plus } from 'lucide-react'

export default function EquipesPage() {
  const { toast } = useToast()
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [gestorId, setGestorId] = useState('')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [e, u] = await Promise.all([equipeService.getAll(), usuarioService.getAll()])
      setEquipes(e); setUsuarios(u)
    } catch (e:any) { const p=parseApiError(e); setError(p.message); toast(p.message,'error')}
    finally { setLoading(false) }
  }
  useEffect(()=>{load()},[])

  const handleCriar = async () => {
    if (!nome.trim()) { toast('Nome da equipe é obrigatório','warning'); return }
    try {
      await equipeService.criar({ nome, descricao, gestorId: gestorId ? Number(gestorId) : null })
      toast('Equipe criada','success'); setNome(''); setDescricao(''); setGestorId(''); load()
    } catch (e:any){ toast(parseApiError(e).message,'error')}
  }
  const handleTrocaGestor = async (equipeId:number, novoGestorId:string) => {
    try {
      if (!novoGestorId) await equipeService.removerGestor(equipeId)
      else {
        await equipeService.atribuirGestor(equipeId, Number(novoGestorId))
        // sincroniza liderados automaticamente; backend já fez, mas garante feedback
        const r = await equipeService.sincronizar(equipeId).catch(()=>null)
        if (r && r.migrados>0) toast(`Gestor vinculado e ${r.migrados} corretor(es) migrado(s) para a equipe.`,'success')
        else toast('Gestor atualizado. Corretores da liderança sincronizados.','success')
      }
      if (!novoGestorId) toast('Gestor removido.','success')
      load()
    } catch (e:any){ toast(parseApiError(e).message,'error')}
  }
  const handleSincronizar = async (equipeId:number) => {
    try {
      const r = await equipeService.sincronizar(equipeId)
      toast(`${r.migrados} corretor(es) sincronizado(s).`,'success'); load()
    } catch (e:any){ toast(parseApiError(e).message,'error')}
  }

  const gestores = usuarios.filter(u=> u.papel==='gestor' || u.papel==='admin')

  if (loading) return <div className="min-h-screen bg-surface p-8"><p className="text-muted animate-pulse">Carregando equipes...</p></div>
  if (error) return <div className="min-h-screen bg-surface p-8"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-12 rounded-xl bg-brand text-on-brand flex items-center justify-center"><Building2 size={24} /></span>
          <div>
            <h1 className="text-3xl font-bold text-ink">Equipes</h1>
            <p className="text-muted">Gestão não altera clientes. Trocar gestor mantém corretores e clientes.</p>
          </div>
        </div>

        <div className="bg-card border border-line rounded-card shadow-card p-6 mb-6">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2"><Plus size={18}/> Nova equipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input placeholder="Nome (ex: Equipe Londrina)" value={nome} onChange={e=>setNome(e.target.value)} className="p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus" />
            <input placeholder="Descrição" value={descricao} onChange={e=>setDescricao(e.target.value)} className="p-2.5 border border-line rounded-btn" />
            <select value={gestorId} onChange={e=>setGestorId(e.target.value)} className="p-2.5 border border-line rounded-btn bg-card">
              <option value="">Sem gestor</option>
              {gestores.map(g=> <option key={g.id} value={g.id}>{g.nome} ({g.papel})</option>)}
            </select>
            <button onClick={handleCriar} className="bg-brand text-on-brand px-6 py-2.5 rounded-btn font-semibold shadow-btn hover:bg-brand-hover">Criar equipe</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipes.map(eq=> (
            <div key={eq.id} className="bg-card border border-line rounded-card shadow-card p-6">
              <h3 className="font-bold text-ink text-lg">{eq.nome}</h3>
              <p className="text-sm text-muted">{eq.descricao || 'Sem descrição'}</p>
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Users size={16} className="text-muted" />
                <span className="text-muted">Gestor:</span>
                <span className="font-semibold text-ink">{eq.gestorNome || '— Nenhum'}</span>
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold text-muted uppercase">Alterar gestor</label>
                <select value={eq.gestorId?.toString()||''} onChange={e=> handleTrocaGestor(eq.id, e.target.value)} className="mt-1 w-full p-2 border border-line rounded-btn bg-card text-sm">
                  <option value="">Remover gestor</option>
                  {gestores.map(g=> <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
                <p className="text-xs text-muted mt-1">Clientes continuam com seus corretores.</p>
                {eq.gestorId && <button onClick={()=>handleSincronizar(eq.id)} className="mt-2 text-xs font-semibold text-brand-fg hover:underline">Sincronizar liderados</button>}
                <p className="text-xs text-muted">Corretores com gestor {eq.gestorNome || ''} serão movidos para esta equipe.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
