'use client'

import { useEffect, useState } from 'react'
import { notificacaoService } from '@/service/notificacaoService'
import { useToast } from '@/components/ui/ToastProvider'
import { Notificacao } from '@/types'
import { Bell, Check } from 'lucide-react'
import { format } from 'date-fns'

export default function NotificacoesPage() {
  const { toast } = useToast()
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const load = async () => {
    try {
      const data = await notificacaoService.getAll()
      const arr = Array.isArray(data) ? data : []
      setNotifs(arr)
    } catch (e) {
      setNotifs([])
    }
  }
  useEffect(()=>{
    load()
    const onFocus = () => load()
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    const onStorage = (e: StorageEvent) => { if (e.key === 'crm:lastRedistribuicao') load() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('storage', onStorage)
    const id = setInterval(load, 30000)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('storage', onStorage)
      clearInterval(id)
    }
  }, [])
  const marcarLida = async (id:number) => {
    await notificacaoService.marcarLida(id)
    load()
  }
  const marcarTodas = async () => {
    await notificacaoService.marcarTodas()
    toast('Todas marcadas como lidas','success')
    load()
  }
  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-brand text-on-brand flex items-center justify-center"><Bell size={24}/></span>
            <h1 className="text-3xl font-bold text-ink">Notificações</h1>
          </div>
          <button onClick={marcarTodas} className="text-sm text-brand-fg hover:underline flex items-center gap-1"><Check size={16}/> Marcar todas como lidas</button>
        </div>
        <div className="space-y-3">
          {!Array.isArray(notifs) || notifs.length===0 ? <p className="text-center text-muted py-12">Nenhuma notificação</p> : notifs.map(n=> (
            <div key={n.id} className={`bg-card border rounded-card p-4 flex gap-3 ${n.lida ? 'opacity-60' : 'border-focus'}`}>
              <div className={`w-2 h-2 rounded-full mt-2 ${n.tipo==='CLIENTE_RECEBIDO' ? 'bg-success' : 'bg-warning'}`} />
              <div className="flex-1">
                <p className="text-sm text-ink">{n.mensagem}</p>
                <p className="text-xs text-muted">{format(new Date(n.dataCriacao),'dd/MM/yyyy HH:mm')} {n.lida ? '• lida' : '• nova'}</p>
              </div>
              {!n.lida && <button onClick={()=>marcarLida(n.id)} className="text-xs text-brand-fg font-semibold">Marcar lida</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
