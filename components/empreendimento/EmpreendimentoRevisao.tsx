"use client"
import React, { useEffect, useState } from "react"
import { empreendimentoIaService, ExtracaoDTO } from "@/service/empreendimentoIaService"
import { useToast } from "@/components/ui/ToastProvider"
import { parseApiError } from "@/lib/errorHandler"
import { AlertTriangle, CheckCircle, FileText, RefreshCw, Loader2, Edit2 } from "lucide-react"

function Evidencia({ fonte, onUse }: { fonte: any; onUse?: (v:string)=>void }) {
  const confColor = fonte.confianca >=80 ? "bg-[#e8f6ee] text-[#0f8a52]" : fonte.confianca>=60 ? "bg-amber-50 text-amber-700" : "bg-[#fdeceb] text-[#c0392b]"
  return (
    <div className="border border-line rounded-btn p-3 bg-surface/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink truncate">{fonte.valorExtraido ?? "—"}</span>
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${confColor}`}>{fonte.confianca ?? 0}%</span>
      </div>
      <p className="text-xs text-muted mt-1">📄 {fonte.documentoNome || "—"} {fonte.pagina ? `• p.${fonte.pagina}` : ""}</p>
      {fonte.trecho && <p className="text-xs text-muted mt-1 italic line-clamp-2">“{fonte.trecho}”</p>}
      {onUse && <button onClick={()=>onUse(fonte.valorExtraido)} className="mt-2 text-xs px-2 py-1 bg-primary text-white rounded-btn">Usar este valor</button>}
    </div>
  )
}

const CAMPOS_UNIDADE = [
  { campo: "UNIDADE", chave: "nomeUnidade", label: "Unidade" },
  { campo: "BLOCO", chave: "bloco", label: "Bloco/Torre" },
  { campo: "TIPOLOGIA", chave: "tipologia", label: "Tipologia" },
  { campo: "AREA_PRIVATIVA", chave: "areaPrivativa", label: "Área privativa", tipo: "double" },
  { campo: "AREA_COMUM", chave: "areaComum", label: "Área comum", tipo: "double" },
  { campo: "OUTRAS_AREAS", chave: "outrasAreas", label: "Outras áreas", tipo: "double" },
  { campo: "GARAGEM", chave: "garagem", label: "Garagem" },
  { campo: "SITUACAO", chave: "situacao", label: "Situação" },
  { campo: "VALOR_TOTAL", chave: "preco", label: "Valor total", tipo: "long" },
  { campo: "ATO", chave: "ato", label: "Ato", tipo: "long" },
  { campo: "SUBSIDIO_COHAPAR", chave: "subsidioCohapar", label: "Subsídio COHAPAR", tipo: "long" },
  { campo: "FINANCIAMENTO", chave: "financiamento", label: "Financiamento", tipo: "long" },
  { campo: "VALOR_AVALIACAO", chave: "valorAvaliacao", label: "Valor avaliação", tipo: "long" },
] as const

function paraNumero(v: any): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = Number(String(v).replace(",", "."))
  return isNaN(n) ? null : n
}
function paraInteiro(v: any): number | null {
  const n = paraNumero(v)
  return n === null ? null : Math.round(n)
}

function unidadeExtraidaParaLinha(u: any) {
  const linha: any = { _chave: u.chave, documentoOrigemId: u.documentoOrigemId, linhaOrigem: u.linhaOrigem }
  for (const c of CAMPOS_UNIDADE) linha[c.chave] = u[c.campo]?.valor ?? ""
  return linha
}

export default function EmpreendimentoRevisao({ extracaoId }: { extracaoId: number }) {
  const { toast } = useToast()
  const [extracao, setExtracao] = useState<ExtracaoDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ nome: "", cidade: "", bairro: "", regiao: "", status: "" })
  const [unidades, setUnidades] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await empreendimentoIaService.getExtracao(extracaoId)
      setExtracao(data)
      // preenche form com resultado
      if (data.resultado) {
        const r:any = data.resultado
        setForm({
          nome: r.identificacao?.nome?.valor || "",
          codigoExterno: r.identificacao?.codigo_externo?.valor?.trim() || null,
          status: r.identificacao?.status?.valor || "",
          cidade: r.localizacao?.cidade?.valor || "",
          bairro: r.localizacao?.bairro?.valor || "",
          regiao: r.localizacao?.regiao?.valor || "",
          endereco: r.localizacao?.endereco?.valor || "",
          cep: r.localizacao?.cep?.valor || "",
          uf: r.localizacao?.estado?.valor || "",
          // ... outros
          _raw: r
        })
        if (Array.isArray(r.unidades)) setUnidades(r.unidades.map(unidadeExtraidaParaLinha))
      }
      if (data.status === "processando" || data.status === "pendente") {
        setTimeout(load, 3000)
      }
    } catch (e:any) { setError(parseApiError(e).message) } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [extracaoId])

  const atualizarCelulaUnidade = (indice: number, chave: string, valor: string) => {
    setUnidades(prev => prev.map((linha, i) => i === indice ? { ...linha, [chave]: valor } : linha))
  }

  const removerUnidade = (indice: number) => {
    setUnidades(prev => prev.filter((_, i) => i !== indice))
  }

  const conflitosDeUnidade = (chaveUnidade: string, campo: string) => {
    const c = (extracao?.conflitos || []).find(c => c.campo === `unidades[${chaveUnidade}].${campo}`)
    return c?.valores || []
  }

  const handleConfirm = async () => {
    if (!form.nome) { toast("Nome é obrigatório", "warning"); return }
    setSaving(true)
    try {
      // monta payload confirmacao
      const payload:any = {
        extracaoId,
        nome: form.nome,
        codigoExterno: form.codigoExterno?.trim() ? form.codigoExterno.trim() : null,
        status: form.status,
        cidade: form.cidade,
        bairro: form.bairro,
        regiao: form.regiao,
        endereco: form.endereco,
        cep: form.cep,
        uf: form.uf,
        // caracteristica etc.: preenchidos abaixo só quando a extração realmente encontrou algo —
        // nunca inventar um valor para um campo que não veio de nenhum documento
        caracteristica: null,
        precos: [],
        condicao: null,
        plantas: [],
        areasComuns: [],
        diferenciais: [],
        pontosReferencia: [],
        imagens: []
      }
      // se extracao tem precos etc., tenta mapear
      const r:any = form._raw
      if (r?.caracteristicas) {
        const c = r.caracteristicas
        payload.caracteristica = {
          metragemMin: c.metragem_min?.valor ? Number(String(c.metragem_min.valor).replace(",",".")) : null,
          metragemMax: c.metragem_max?.valor ? Number(String(c.metragem_max.valor).replace(",",".")) : null,
          quartosMin: c.quartos_min?.valor ? Number(c.quartos_min.valor) : null,
          quartosMax: c.quartos_max?.valor ? Number(c.quartos_max.valor) : null,
          pavimentos: c.pavimentos?.valor ? Number(c.pavimentos.valor) : null,
          unidadesPorAndar: c.unidades_por_andar?.valor ? Number(c.unidades_por_andar.valor) : null,
          vagasMin: c.vagas_min?.valor ? Number(c.vagas_min.valor) : null,
          vagasMax: c.vagas_max?.valor ? Number(c.vagas_max.valor) : null,
          possuiElevador: c.possui_elevador?.valor === "true" ? true : null,
        }
      }
      if (Array.isArray(r?.areas_comuns)) {
        payload.areasComuns = r.areas_comuns
          .map((a: any) => ({ nome: a.nome?.valor || "" }))
          .filter((a: any) => a.nome.trim() !== "")
      }
      if (Array.isArray(r?.pontos_referencia)) {
        payload.pontosReferencia = r.pontos_referencia
          .map((p: any) => ({
            nome: p.nome?.valor || "",
            tempo: p.tempo?.valor ? Number(p.tempo.valor) : null,
            unidade: p.tempo?.valor ? "min" : null,
          }))
          .filter((p: any) => p.nome.trim() !== "")
      }
      if (r?.precos && Array.isArray(r.precos) && r.precos[0]) {
        const p = r.precos[0]
        payload.precos = [{
          valorMin: p.valor_min?.valor ? Number(String(p.valor_min.valor).replace(/\D/g,"")) : null,
          valorMax: p.valor_max?.valor ? Number(String(p.valor_max.valor).replace(/\D/g,"")) : null,
        }]
      }
      if (Array.isArray(r?.diferenciais)) {
        payload.diferenciais = r.diferenciais
          .map((d: any) => ({ titulo: d.titulo?.valor || "" }))
          .filter((d: any) => d.titulo.trim() !== "")
      }
      payload.unidades = unidades
        .filter(u => u.nomeUnidade && String(u.nomeUnidade).trim() !== "")
        .map(u => ({
          nomeUnidade: u.nomeUnidade,
          bloco: u.bloco || null,
          tipologia: u.tipologia || null,
          areaPrivativa: paraNumero(u.areaPrivativa),
          areaComum: paraNumero(u.areaComum),
          outrasAreas: paraNumero(u.outrasAreas),
          garagem: u.garagem || null,
          situacao: u.situacao || null,
          preco: paraInteiro(u.preco),
          ato: paraInteiro(u.ato),
          subsidioCohapar: paraInteiro(u.subsidioCohapar),
          financiamento: paraInteiro(u.financiamento),
          valorAvaliacao: paraInteiro(u.valorAvaliacao),
          documentoOrigemId: u.documentoOrigemId ?? null,
          linhaOrigem: u.linhaOrigem ?? null,
        }))

      await empreendimentoIaService.confirmar(payload)
      toast("Empreendimento criado com sucesso!", "success")
      window.location.href = "/empreendimentos"
    } catch (e:any) { toast(parseApiError(e).message, "error") } finally { setSaving(false) }
  }

  if (loading) return <div className="p-12 text-center text-muted animate-pulse">Carregando extração...</div>
  if (error) return <div className="p-12 text-center"><p className="text-[#c0392b]">{error}</p><button onClick={load} className="mt-4 px-4 py-2 bg-primary text-white rounded-btn">Tentar novamente</button></div>
  if (!extracao) return null

  if (extracao.status === "processando" || extracao.status === "pendente") {
    return (
      <div className="p-12 text-center">
        <Loader2 size={32} className="mx-auto animate-spin text-primary mb-3"/>
        <p className="font-semibold text-ink">Processando documentos...</p>
        <p className="text-sm text-muted mt-1">Extraindo informações, validando e identificando conflitos</p>
      </div>
    )
  }
  if (extracao.status === "erro") {
    return (
      <div className="p-12 text-center">
        <AlertTriangle size={32} className="mx-auto text-[#c0392b] mb-3"/>
        <p className="font-semibold text-ink">Falha na extração</p>
        <p className="text-sm text-muted mt-1">{extracao.erro || "Tente novamente"}</p>
        <button onClick={async()=>{ await empreendimentoIaService.reprocessar(extracaoId); load()}} className="mt-4 px-4 py-2 bg-primary text-white rounded-btn">Reprocessar</button>
      </div>
    )
  }

  const conflitos = extracao.conflitos || []
  const fontes = extracao.fontes || []
  // agrupa fontes por campo
  const porCampo: Record<string, any[]> = {}
  fontes.forEach(f => { if (!porCampo[f.campo]) porCampo[f.campo]=[]; porCampo[f.campo].push(f)})

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-card p-4 flex gap-3">
        <AlertTriangle className="text-amber-600" size={20}/>
        <div>
          <p className="text-sm font-semibold text-amber-800">Revisão necessária {extracao.status==="revisao" && "• baixa confiança ou conflitos detectados"}</p>
          <p className="text-xs text-amber-700 mt-1">Confira os dados abaixo. Campos com ★ baixa confiança (&lt;60%) ou ⚠️ conflito precisam de atenção. Nenhum dado será salvo sem sua confirmação.</p>
        </div>
      </div>

      {conflitos.length>0 && (
        <div className="bg-white border border-[#f2cdc9] rounded-card p-6">
          <h3 className="font-semibold text-[#c0392b] flex items-center gap-2"><AlertTriangle size={18}/> Conflitos encontrados</h3>
          <div className="mt-4 space-y-4">
            {conflitos.map((c,i)=>(
              <div key={i} className="border border-line rounded-card p-4">
                <p className="text-sm font-medium text-ink">Campo: {c.campo}</p>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {c.valores.map((v:any, idx:number)=>(
                    <Evidencia key={idx} fonte={v} onUse={(val)=> {
                      // aplica no form
                      const campoSimples = c.campo.split(".").pop() || c.campo
                      if (campoSimples.includes("nome")) setForm((f:any)=>({...f, nome: val}))
                      if (campoSimples.includes("cidade")) setForm((f:any)=>({...f, cidade: val}))
                      if (campoSimples.includes("regiao")) setForm((f:any)=>({...f, regiao: val}))
                      toast(`Valor ${val} aplicado em ${campoSimples}`, "success")
                    }}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-line rounded-card shadow-card p-6">
        <h3 className="font-semibold text-ink mb-4">Dados básicos</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted">Nome *</label>
            <input value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} className="w-full p-2.5 border border-line rounded-btn mt-1" placeholder="Residencial London Plaza"/>
            {porCampo["identificacao.nome"] && <div className="mt-2 space-y-1">{porCampo["identificacao.nome"].map((f:any,i:number)=><Evidencia key={i} fonte={f}/>)}</div>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Status</label>
            <input value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="w-full p-2.5 border border-line rounded-btn mt-1" placeholder="Em obras"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Cidade</label>
            <input value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})} className="w-full p-2.5 border border-line rounded-btn mt-1"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Bairro</label>
            <input value={form.bairro} onChange={e=>setForm({...form,bairro:e.target.value})} className="w-full p-2.5 border border-line rounded-btn mt-1"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Região</label>
            <input value={form.regiao || ""} onChange={e=>setForm({...form,regiao:e.target.value})} className="w-full p-2.5 border border-line rounded-btn mt-1" placeholder="Zona Norte"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">UF</label>
            <input value={form.uf || ""} onChange={e=>setForm({...form,uf:e.target.value})} maxLength={2} className="w-full p-2.5 border border-line rounded-btn mt-1 uppercase"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Endereço</label>
            <input value={form.endereco} onChange={e=>setForm({...form,endereco:e.target.value})} className="w-full p-2.5 border border-line rounded-btn mt-1"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">CEP</label>
            <input value={form.cep} onChange={e=>setForm({...form,cep:e.target.value})} className="w-full p-2.5 border border-line rounded-btn mt-1"/>
          </div>
        </div>
      </div>

      {unidades.length > 0 && (
        <div className="bg-white border border-line rounded-card shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-ink">Unidades ({unidades.length})</h3>
            <p className="text-xs text-muted">Extraídas da(s) tabela(s) de preço. Edite qualquer célula antes de confirmar.</p>
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr className="text-left text-muted border-b border-line">
                  {CAMPOS_UNIDADE.map(c => <th key={c.chave} className="py-2 pr-3 font-semibold whitespace-nowrap">{c.label}</th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((linha, i) => (
                  <tr key={i} className="border-b border-line/60 hover:bg-surface/40">
                    {CAMPOS_UNIDADE.map(c => {
                      const conflitosCelula = conflitosDeUnidade(linha._chave, c.campo)
                      return (
                        <td key={c.chave} className="py-1 pr-3">
                          <input
                            value={linha[c.chave] ?? ""}
                            onChange={e => atualizarCelulaUnidade(i, c.chave, e.target.value)}
                            className={`w-28 p-1.5 border rounded-btn ${conflitosCelula.length > 1 ? "border-amber-400 bg-amber-50" : "border-line"}`}
                            title={conflitosCelula.length > 1 ? "Conflito entre documentos — confira os valores abaixo" : undefined}
                          />
                          {conflitosCelula.length > 1 && (
                            <div className="mt-1 space-y-1">
                              {conflitosCelula.map((f: any, fi: number) => (
                                <button key={fi} type="button"
                                  onClick={() => atualizarCelulaUnidade(i, c.chave, f.valorExtraido)}
                                  className="block text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 whitespace-nowrap"
                                  title={f.documentoNome}>
                                  {f.valorExtraido} ({f.documentoNome})
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      )
                    })}
                    <td>
                      <button type="button" onClick={() => removerUnidade(i)} className="text-muted hover:text-[#c0392b] px-1" title="Remover esta unidade">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white border border-line rounded-card p-6">
        <h3 className="font-semibold text-ink mb-2">Fontes por campo</h3>
        <p className="text-xs text-muted mb-4">Cada valor mostra documento, página e trecho original para auditoria.</p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {Object.entries(porCampo).slice(0,60).map(([campo, lista]:any)=>(
            <div key={campo} className="flex gap-2 text-xs">
              <span className="font-mono text-muted min-w-[180px]">{campo}</span>
              <span className="text-ink font-medium">{lista[0].valorExtraido?.substring(0,60) || "—"}</span>
              <span className="text-muted">({lista[0].confianca}%)</span>
            </div>
          ))}
          {Object.keys(porCampo).length===0 && <p className="text-sm text-muted">Nenhuma fonte — preencha manualmente.</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={()=>window.history.back()} className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted">Cancelar</button>
        <button onClick={handleConfirm} disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-btn font-semibold shadow-btn disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Confirmar e salvar
        </button>
      </div>
    </div>
  )
}
