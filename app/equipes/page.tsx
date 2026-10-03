'use client'

import { useEffect, useState } from 'react'
import { equipeService } from '@/service/equipeService'
import { usuarioService } from '@/service/usuarioService'
import { useToast } from '@/components/ui/ToastProvider'
import { parseApiError } from '@/lib/errorHandler'
import { ErrorState, InlineError } from '@/components/ui/ErrorState'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { notificarErro, textoDoErro, plural } from '@/lib/feedback'
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
  const [nomeErro, setNomeErro] = useState<string | undefined>()
  const [criando, setCriando] = useState(false)
  const confirmar = useConfirm()

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [e, u] = await Promise.all([equipeService.getAll(), usuarioService.getAll()])
      setEquipes(e); setUsuarios(u)
    } catch (e:any) { setError(textoDoErro(parseApiError(e))) } // exibido uma vez, no lugar da tela, com "Tentar novamente"
    finally { setLoading(false) }
  }
  useEffect(()=>{load()},[])

  const handleCriar = async () => {
    if (!nome.trim()) { setNomeErro('Informe o nome da equipe.'); document.getElementById('equipe-nome')?.focus(); return }
    if (nome.trim().length > 100) { setNomeErro('O nome da equipe deve ter no máximo 100 caracteres.'); return }
    setCriando(true)
    try {
      await equipeService.criar({ nome, descricao, gestorId: gestorId ? Number(gestorId) : null })
      const gestor = gestores.find(g => String(g.id) === gestorId)?.nome
      toast(`Equipe "${nome.trim()}" criada${gestor ? ` com ${gestor} como gestor` : ' sem gestor'}.`,'success')
      setNome(''); setDescricao(''); setGestorId(''); load()
    } catch (e:any){
      // nome duplicado aparece junto ao campo; outros erros em toast com o motivo
      const p = parseApiError(e)
      if (p.fields?.nome) setNomeErro(p.fields.nome)
      else notificarErro(toast, 'Não foi possível criar a equipe', e)
    } finally { setCriando(false) }
  }
  const handleTrocaGestor = async (eq: Equipe, novoGestorId:string) => {
    const novoGestor = gestores.find(g => String(g.id) === novoGestorId)?.nome
    if (!novoGestorId) {
      const ok = await confirmar({
        titulo: `Remover ${eq.gestorNome ?? 'o gestor'} da equipe ${eq.nome}?`,
        mensagem: 'A equipe ficará sem gestor. Os corretores e os leads continuam como estão.',
        confirmarLabel: 'Remover gestor',
        perigo: true,
      })
      if (!ok) return
    }
    try {
      if (!novoGestorId) {
        await equipeService.removerGestor(eq.id)
        toast(`A equipe ${eq.nome} está sem gestor agora.`,'success')
      } else {
        await equipeService.atribuirGestor(eq.id, Number(novoGestorId))
        // sincroniza liderados automaticamente; backend já fez, mas garante feedback
        const r = await equipeService.sincronizar(eq.id).catch(()=>null)
        if (r && r.migrados>0) toast(`${novoGestor} agora é o gestor da equipe ${eq.nome}. ${plural(r.migrados, 'corretor liderado por ele foi movido', 'corretores liderados por ele foram movidos')} para a equipe.`,'success')
        else toast(`${novoGestor} agora é o gestor da equipe ${eq.nome}.`,'success')
      }
      load()
    } catch (e:any){
      notificarErro(toast, novoGestorId ? `Não foi possível definir ${novoGestor} como gestor de ${eq.nome}` : `Não foi possível remover o gestor da equipe ${eq.nome}`, e)
    }
  }
  const handleSincronizar = async (eq: Equipe) => {
    try {
      const r = await equipeService.sincronizar(eq.id)
      toast(r.migrados > 0
        ? `${plural(r.migrados, 'corretor foi movido', 'corretores foram movidos')} para a equipe ${eq.nome}.`
        : `Nenhum corretor precisou ser movido: os liderados de ${eq.gestorNome ?? 'o gestor'} já estão na equipe ${eq.nome}.`, r.migrados > 0 ? 'success' : 'info'); load()
    } catch (e:any){ notificarErro(toast, `Não foi possível sincronizar os liderados da equipe ${eq.nome}`, e) }
  }

  const gestores = usuarios.filter(u=> u.papel==='gestor' || u.papel==='admin')

  if (loading) return <div className="min-h-screen bg-surface p-8"><p className="text-muted motion-safe:animate-pulse" role="status">Carregando equipes...</p></div>
  if (error) return <div className="min-h-screen bg-surface p-8"><ErrorState message="Não foi possível carregar as equipes." details={error} onRetry={load} /></div>

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-12 rounded-xl bg-brand text-on-brand flex items-center justify-center"><Building2 size={24} /></span>
          <div>
            <h1 className="text-3xl font-bold text-ink">Equipes</h1>
            <p className="text-muted">Trocar o gestor de uma equipe não altera os leads: corretores e leads continuam como estão.</p>
          </div>
        </div>

        <div className="bg-card border border-line rounded-card shadow-card p-6 mb-6">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2"><Plus size={18}/> Nova equipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <input id="equipe-nome" maxLength={100} aria-label="Nome da equipe" aria-invalid={!!nomeErro} aria-describedby={nomeErro ? 'equipe-nome-erro' : undefined} placeholder="Nome (ex.: Equipe Londrina)" value={nome} onChange={e=>{ setNome(e.target.value); setNomeErro(undefined) }} className={`w-full p-2.5 border ${nomeErro ? 'border-danger' : 'border-line'} rounded-btn focus:outline-none focus:border-focus`} />
              <InlineError id="equipe-nome-erro" message={nomeErro} />
            </div>
            <input aria-label="Descrição da equipe" placeholder="Descrição" value={descricao} onChange={e=>setDescricao(e.target.value)} className="p-2.5 border border-line rounded-btn" />
            <select aria-label="Gestor da nova equipe" value={gestorId} onChange={e=>setGestorId(e.target.value)} className="p-2.5 border border-line rounded-btn bg-card">
              <option value="">Sem gestor</option>
              {gestores.map(g=> <option key={g.id} value={g.id}>{g.nome} ({g.papel})</option>)}
            </select>
            <button onClick={handleCriar} disabled={criando} className="self-start bg-brand text-on-brand px-6 py-2.5 rounded-btn font-semibold shadow-btn hover:bg-brand-hover disabled:opacity-60">{criando ? 'Criando equipe...' : 'Criar equipe'}</button>
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
                <select value={eq.gestorId?.toString()||''} aria-label={`Gestor da equipe ${eq.nome}`} onChange={e=> handleTrocaGestor(eq, e.target.value)} className="mt-1 w-full p-2 border border-line rounded-btn bg-card text-sm">
                  <option value="">Remover gestor</option>
                  {gestores.map(g=> <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
                <p className="text-xs text-muted mt-1">Os leads continuam com os seus corretores.</p>
                {eq.gestorId && <button onClick={()=>handleSincronizar(eq)} className="mt-2 text-xs font-semibold text-brand-fg hover:underline">Sincronizar liderados</button>}
                <p className="text-xs text-muted">Corretores com gestor {eq.gestorNome || ''} serão movidos para esta equipe.</p>
              </div>
            </div>
          ))}
          {equipes.length === 0 && (
            <p className="text-muted md:col-span-2 lg:col-span-3">Nenhuma equipe cadastrada ainda. Crie a primeira equipe no formulário acima.</p>
          )}
        </div>
      </div>
    </div>
  )
}
