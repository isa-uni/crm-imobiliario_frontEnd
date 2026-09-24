"use client"
import React, { useEffect, useState } from "react"
import { Building2, Plus, Search } from "lucide-react"
import { empreendimentoIaService, EmpreendimentoCard } from "@/service/empreendimentoIaService"
import EmpreendimentoCardComp from "@/components/empreendimento/EmpreendimentoCard"
import EmpreendimentoUploadModal from "@/components/empreendimento/EmpreendimentoUploadModal"
import { useToast } from "@/components/ui/ToastProvider"
import { parseApiError } from "@/lib/errorHandler"
import { ErrorState } from "@/components/ui/ErrorState"

export default function EmpreendimentosPage() {
  const { toast } = useToast()
  const [cards, setCards] = useState<EmpreendimentoCard[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openUpload, setOpenUpload] = useState(false)

  const load = async (p = page) => {
    setLoading(true); setError(null)
    try {
      const res:any = await empreendimentoIaService.listarCards({ search: search || undefined, page: p, size: 12, sort: "nome,asc" })
      const content = res.content || res || []
      setCards(Array.isArray(content) ? content : [])
      setTotalPages(res.totalPages ?? 1)
      setTotalElements(res.totalElements ?? content.length)
    } catch (e:any) {
      setError(parseApiError(e).message)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load(0) }, [])
  useEffect(()=>{
    const t = setTimeout(()=>{ setPage(0); load(0)}, 500)
    return ()=>clearTimeout(t)
  }, [search])

  useEffect(()=>{ load(page) }, [page])

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-accent text-on-accent flex items-center justify-center shadow-btn"><Building2 size={24}/></span>
            <div>
              <h1 className="text-3xl font-bold text-ink">Empreendimentos</h1>
              <p className="text-muted">Cadastro com extração automática de documentos • {totalElements} empreendimento(s)</p>
            </div>
          </div>
          <button onClick={()=>setOpenUpload(true)} className="flex items-center gap-2 bg-brand text-on-brand px-6 py-2.5 rounded-btn font-semibold shadow-btn hover:bg-brand-hover">
            <Plus size={18}/> Novo empreendimento
          </button>
        </div>

        <div className="bg-card border border-line rounded-card p-4 mb-6 flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou bairro..." className="w-full pl-9 pr-3 py-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30" />
          </div>
        </div>

        {loading ? (
          <div className="bg-card border border-line rounded-card p-12 text-center text-muted animate-pulse">Carregando empreendimentos...</div>
        ) : error ? (
          <ErrorState message={error} onRetry={()=>load(page)} />
        ) : cards.length===0 ? (
          <div className="bg-card border border-line rounded-card p-12 text-center">
            <Building2 size={48} className="mx-auto text-muted mb-3"/>
            <p className="font-semibold text-ink">Nenhum empreendimento cadastrado</p>
            <p className="text-sm text-muted mt-1">Clique em “Novo empreendimento” e envie documentos para extração automática.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(emp => <EmpreendimentoCardComp key={emp.id} emp={emp} />)}
            </div>
            {totalPages>1 && (
              <div className="flex items-center justify-between mt-6 bg-card border border-line rounded-card p-4">
                <span className="text-sm text-muted">Página {page+1} de {totalPages} • {totalElements} total</span>
                <div className="flex gap-2">
                  <button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="px-3 py-1.5 border border-line rounded-btn text-sm disabled:opacity-50">Anterior</button>
                  <button disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 bg-brand text-on-brand rounded-btn text-sm disabled:opacity-50">Próxima</button>
                </div>
              </div>
            )}
          </>
        )}

        <EmpreendimentoUploadModal open={openUpload} onClose={()=>setOpenUpload(false)} />
      </div>
    </div>
  )
}
