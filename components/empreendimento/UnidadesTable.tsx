"use client"
import { useEffect, useState, ReactNode } from "react"
import { Search, ArrowUpDown } from "lucide-react"
import { empreendimentoIaService, UnidadeDTO, UnidadesResumoDTO } from "@/service/empreendimentoIaService"
import { BadgeSituacao } from "@/components/ui/Badge"
import { brl, m2, naoInformado } from "@/lib/format"

const POR_PAGINA = 20

const COLUNAS: { chave: keyof UnidadeDTO | "acoes"; label: string; ordenavel?: boolean; render?: (u: UnidadeDTO) => ReactNode }[] = [
  { chave: "bloco", label: "Bloco/Torre", ordenavel: true },
  { chave: "nomeUnidade", label: "Unidade", ordenavel: true },
  { chave: "tipologia", label: "Tipologia", ordenavel: true },
  { chave: "areaPrivativa", label: "Área privativa", ordenavel: true, render: (u) => u.areaPrivativa ? m2(u.areaPrivativa) : "—" },
  { chave: "areaComum", label: "Área comum", render: (u) => u.areaComum ? m2(u.areaComum) : "—" },
  { chave: "outrasAreas", label: "Outras áreas", render: (u) => u.outrasAreas ? m2(u.outrasAreas) : "—" },
  { chave: "garagem", label: "Garagem", render: (u) => u.garagem || "—" },
  { chave: "situacao", label: "Situação", ordenavel: true, render: (u) => <BadgeSituacao situacao={u.situacao} /> },
  { chave: "preco", label: "Valor total", ordenavel: true, render: (u) => u.preco ? <span className="font-semibold text-success">{brl(u.preco)}</span> : "—" },
  { chave: "ato", label: "Ato", render: (u) => u.ato ? brl(u.ato) : "—" },
  { chave: "subsidioCohapar", label: "Subsídio COHAPAR", render: (u) => u.subsidioCohapar ? brl(u.subsidioCohapar) : "—" },
  { chave: "financiamento", label: "Financiamento", render: (u) => u.financiamento ? brl(u.financiamento) : "—" },
  { chave: "valorAvaliacao", label: "Valor avaliação", render: (u) => u.valorAvaliacao ? brl(u.valorAvaliacao) : "—" },
]

export default function UnidadesTable({ empreendimentoId, resumo }: { empreendimentoId: number; resumo?: UnidadesResumoDTO }) {
  const [unidades, setUnidades] = useState<UnidadeDTO[]>([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(0)
  const [busca, setBusca] = useState("")
  const [situacao, setSituacao] = useState("")
  const [bloco, setBloco] = useState("")
  const [tipologia, setTipologia] = useState("")
  const [sort, setSort] = useState<{ campo: string; dir: "asc" | "desc" }>({ campo: "nomeUnidade", dir: "asc" })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    empreendimentoIaService.listarUnidades(empreendimentoId, {
      situacao: situacao || undefined,
      bloco: bloco || undefined,
      tipologia: tipologia || undefined,
      busca: busca || undefined,
      page: pagina,
      size: POR_PAGINA,
      sort: `${sort.campo},${sort.dir}`,
    }).then(pag => {
      if (!ativo) return
      setUnidades(pag.content || [])
      setTotal(pag.totalElements || 0)
    }).catch(() => { if (ativo) { setUnidades([]); setTotal(0) } })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [empreendimentoId, situacao, bloco, tipologia, busca, pagina, sort])

  const alternarOrdenacao = (campo: string) => {
    setPagina(0)
    setSort(prev => prev.campo === campo ? { campo, dir: prev.dir === "asc" ? "desc" : "asc" } : { campo, dir: "asc" })
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const semFiltro = !busca && !situacao && !bloco && !tipologia

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={busca} onChange={e => { setPagina(0); setBusca(e.target.value) }} placeholder="Buscar unidade..."
            className="w-full pl-8 pr-2 py-2 text-sm border border-line rounded-btn" />
        </div>
        <select value={situacao} onChange={e => { setPagina(0); setSituacao(e.target.value) }} className="text-sm border border-line rounded-btn px-2 py-2">
          <option value="">Todas as situações</option>
          <option value="disponivel">Disponível</option>
          <option value="reservada">Reservada</option>
          <option value="vendida">Vendida</option>
          <option value="em_processo">Em processo</option>
        </select>
        {resumo?.blocos && resumo.blocos.length > 1 && (
          <select value={bloco} onChange={e => { setPagina(0); setBloco(e.target.value) }} className="text-sm border border-line rounded-btn px-2 py-2">
            <option value="">Todos os blocos/torres</option>
            {resumo.blocos.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
        {resumo?.tipologias && resumo.tipologias.length > 1 && (
          <select value={tipologia} onChange={e => { setPagina(0); setTipologia(e.target.value) }} className="text-sm border border-line rounded-btn px-2 py-2">
            <option value="">Todas as tipologias</option>
            {resumo.tipologias.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        {!semFiltro && (
          <button onClick={() => { setBusca(""); setSituacao(""); setBloco(""); setTipologia(""); setPagina(0) }} className="text-xs text-brand-fg font-semibold hover:underline">
            limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-muted">{total} unidade{total !== 1 ? "s" : ""}</span>
      </div>

      <div className="overflow-x-auto border border-line rounded-card">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-line bg-surface/60">
              {COLUNAS.map(c => (
                <th key={String(c.chave)} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  {c.ordenavel ? (
                    <button onClick={() => alternarOrdenacao(String(c.chave))} className="flex items-center gap-1 hover:text-ink">
                      {c.label} <ArrowUpDown size={12} className={sort.campo === c.chave ? "text-brand-fg" : "text-muted/50"} />
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr><td colSpan={COLUNAS.length} className="py-8 text-center text-muted">Carregando unidades...</td></tr>
            ) : unidades.length === 0 ? (
              <tr><td colSpan={COLUNAS.length} className="py-8 text-center text-muted">Nenhuma unidade encontrada com esses filtros.</td></tr>
            ) : unidades.map(u => (
              <tr key={u.id} className="border-b border-line/60 hover:bg-surface/40">
                {COLUNAS.map(c => (
                  <td key={String(c.chave)} className="py-2 px-3 whitespace-nowrap max-w-[220px] truncate" title={typeof (u as any)[c.chave] === "string" ? (u as any)[c.chave] : undefined}>
                    {c.render ? c.render(u) : naoInformado((u as any)[c.chave])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button disabled={pagina === 0} onClick={() => setPagina(p => Math.max(0, p - 1))} className="px-3 py-1.5 border border-line rounded-btn disabled:opacity-40">Anterior</button>
          <span className="text-muted">Página {pagina + 1} de {totalPaginas}</span>
          <button disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina(p => p + 1)} className="px-3 py-1.5 border border-line rounded-btn disabled:opacity-40">Próxima</button>
        </div>
      )}
    </div>
  )
}
