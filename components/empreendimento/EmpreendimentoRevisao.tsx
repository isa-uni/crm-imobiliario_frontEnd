"use client"
import React, { useEffect, useState } from "react"
import { empreendimentoIaService, ExtracaoDTO } from "@/service/empreendimentoIaService"
import { useToast } from "@/components/ui/ToastProvider"
import { parseApiError } from "@/lib/errorHandler"
import { notificarErro, textoDoErro, plural } from "@/lib/feedback"
import { ErrorState, InlineError } from "@/components/ui/ErrorState"
import { lerNumeroBR, problemaCep, problemaUf, somenteDigitos } from "@/lib/validacao"
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

function Evidencia({ fonte, onUse }: { fonte: any; onUse?: (v:string)=>void }) {
  const confColor = fonte.confianca >=80 ? "bg-success-bg text-success" : fonte.confianca>=60 ? "bg-warning-bg text-warning" : "bg-danger-bg text-danger"
  return (
    <div className="border border-line rounded-btn p-3 bg-surface/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink truncate">{fonte.valorExtraido ?? "—"}</span>
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${confColor}`}>{fonte.confianca ?? 0}%</span>
      </div>
      <p className="text-xs text-muted mt-1">📄 {fonte.documentoNome || "—"} {fonte.pagina ? `• p.${fonte.pagina}` : ""}</p>
      {fonte.trecho && <p className="text-xs text-muted mt-1 italic line-clamp-2">“{fonte.trecho}”</p>}
      {onUse && <button onClick={()=>onUse(fonte.valorExtraido)} className="mt-2 text-xs px-2 py-1 bg-brand text-on-brand rounded-btn">Usar este valor</button>}
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
  const n = lerNumeroBR(v)
  return n === null || Number.isNaN(n) ? null : n
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
  const [nomeErro, setNomeErro] = useState<string | undefined>()
  // erros dos dados básicos (CEP, UF) e das células da tabela de unidades ("<linha>.<campo>")
  const [errosEndereco, setErrosEndereco] = useState<{ cep?: string; uf?: string }>({})
  const [errosUnidades, setErrosUnidades] = useState<Record<string, string>>({})
  const [resumoErros, setResumoErros] = useState<string | null>(null)
  const indicesEnviados = React.useRef<number[]>([])

  /** Mesmas regras do backend (UnidadeDTO): números legíveis, não negativos, nome da unidade presente. */
  const validarCelula = (linha: any, chave: string): string | null => {
    const def = CAMPOS_UNIDADE.find(c => c.chave === chave) as any
    const valor = linha[chave]
    if (chave === "nomeUnidade") {
      const temDados = CAMPOS_UNIDADE.some(c => c.chave !== "nomeUnidade" && String(linha[c.chave] ?? "").trim() !== "")
      return temDados && !String(valor ?? "").trim() ? "Informe o nome da unidade ou remova a linha." : null
    }
    if (chave === "garagem" && String(valor ?? "").length > 50) return "Máximo de 50 caracteres."
    if (def?.tipo) {
      const n = lerNumeroBR(valor)
      if (n !== null && Number.isNaN(n)) return def.tipo === "long" ? "Valor não reconhecido. Use números, ex.: 250.000,00" : "Área não reconhecida. Use números, ex.: 45,50"
      if (n !== null && n < 0) return "Não pode ser negativo."
    }
    return null
  }
  const validarUnidades = () => {
    const erros: Record<string, string> = {}
    unidades.forEach((linha, i) => CAMPOS_UNIDADE.forEach(c => {
      const p = validarCelula(linha, c.chave)
      if (p) erros[`${i}.${c.chave}`] = p
    }))
    return erros
  }
  const [reprocessando, setReprocessando] = useState(false)

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
    } catch (e:any) { setError(textoDoErro(parseApiError(e))) } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [extracaoId])

  const atualizarCelulaUnidade = (indice: number, chave: string, valor: string) => {
    setUnidades(prev => prev.map((linha, i) => i === indice ? { ...linha, [chave]: valor } : linha))
    // o aviso da célula some ao editar; volta a ser verificado ao sair da célula e ao salvar
    setErrosUnidades(({ [`${indice}.${chave}`]: _, ...resto }) => resto)
  }
  const verificarCelula = (indice: number, chave: string) => {
    const p = validarCelula(unidades[indice], chave)
    setErrosUnidades(e => {
      const { [`${indice}.${chave}`]: _, ...resto } = e
      return p ? { ...resto, [`${indice}.${chave}`]: p } : resto
    })
  }

  const removerUnidade = (indice: number) => {
    setUnidades(prev => prev.filter((_, i) => i !== indice))
    setErrosUnidades({}) // índices mudam; a próxima verificação refaz os avisos
  }

  const conflitosDeUnidade = (chaveUnidade: string, campo: string) => {
    const c = (extracao?.conflitos || []).find(c => c.campo === `unidades[${chaveUnidade}].${campo}`)
    return c?.valores || []
  }

  const handleConfirm = async () => {
    // valida tudo antes de enviar e mostra cada problema no lugar dele
    // (antes: só o nome era verificado; valores ilegíveis viravam vazio e linhas sem nome sumiam em silêncio)
    const erroNome = !form.nome?.trim() ? "Informe o nome do empreendimento."
      : form.nome.trim().length > 255 ? "O nome do empreendimento deve ter no máximo 255 caracteres." : undefined
    const errosEnd = { cep: problemaCep(form.cep) ?? undefined, uf: problemaUf(form.uf) ?? undefined }
    const errosUni = validarUnidades()
    setNomeErro(erroNome)
    setErrosEndereco(errosEnd)
    setErrosUnidades(errosUni)
    const total = (erroNome ? 1 : 0) + (errosEnd.cep ? 1 : 0) + (errosEnd.uf ? 1 : 0) + Object.keys(errosUni).length
    if (total > 0) {
      setResumoErros(total === 1 ? "Corrija o campo destacado antes de salvar." : `Corrija os ${total} campos destacados antes de salvar.`)
      const primeiro = erroNome ? "rev-nome" : errosEnd.uf ? "rev-uf" : errosEnd.cep ? "rev-cep" : `unidade-${Object.keys(errosUni)[0]}`
      const el = document.getElementById(primeiro)
      el?.scrollIntoView({ block: "center", behavior: "smooth" }); el?.focus({ preventScroll: true })
      return
    }
    setResumoErros(null)
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
        // formato padrão do banco: 00000-000 e UF em maiúsculas
        cep: form.cep?.trim() ? somenteDigitos(form.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2") : null,
        uf: form.uf?.trim() ? form.uf.trim().toUpperCase() : null,
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
          // o extrator grava no padrão brasileiro ("1.234,56"): a leitura antiga virava NaN e o valor se perdia
          metragemMin: paraNumero(c.metragem_min?.valor),
          metragemMax: paraNumero(c.metragem_max?.valor),
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
          // remover tudo que não é dígito multiplicava "250000.00" por 100
          valorMin: paraInteiro(p.valor_min?.valor),
          valorMax: paraInteiro(p.valor_max?.valor),
        }]
      }
      if (Array.isArray(r?.diferenciais)) {
        payload.diferenciais = r.diferenciais
          .map((d: any) => ({ titulo: d.titulo?.valor || "" }))
          .filter((d: any) => d.titulo.trim() !== "")
      }
      // linhas totalmente vazias são ignoradas; guarda o índice original para mapear erros do servidor
      indicesEnviados.current = unidades.map((u, i) => (u.nomeUnidade && String(u.nomeUnidade).trim() !== "" ? i : -1)).filter(i => i >= 0)
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
      const qtd = Array.isArray(payload.unidades) ? payload.unidades.length : 0
      toast(`Empreendimento "${form.nome.trim()}" salvo${qtd ? ` com ${plural(qtd, "unidade", "unidades")}` : ""}.`, "success")
      window.location.href = "/empreendimentos"
    } catch (e:any) {
      const p = notificarErro(toast, "Não foi possível salvar o empreendimento", e)
      if (p.fields?.nome) setNomeErro(p.fields.nome)
      if (p.fields?.cep || p.fields?.uf) setErrosEndereco({ cep: p.fields.cep, uf: p.fields.uf })
      // "unidades[3].preco" → célula da linha original correspondente
      const doServidor: Record<string, string> = {}
      Object.entries(p.fields ?? {}).forEach(([k, msg]) => {
        const m = /^unidades\[(\d+)\]\.(\w+)$/.exec(k)
        if (m) doServidor[`${indicesEnviados.current[Number(m[1])] ?? m[1]}.${m[2]}`] = msg
      })
      if (Object.keys(doServidor).length) setErrosUnidades(doServidor)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-12 text-center text-muted motion-safe:animate-pulse" role="status">Carregando os dados extraídos dos documentos...</div>
  if (error) return <div className="p-6"><ErrorState message="Não foi possível carregar a revisão dos documentos." details={error} onRetry={load} /></div>
  if (!extracao) return null

  if (extracao.status === "processando" || extracao.status === "pendente") {
    return (
      <div className="p-12 text-center">
        <Loader2 size={32} className="mx-auto animate-spin text-brand-fg mb-3" aria-hidden="true"/>
        <p className="font-semibold text-ink" role="status">Lendo os documentos enviados...</p>
        <p className="text-sm text-muted mt-1">Extraindo as informações e identificando conflitos entre documentos. Esta tela atualiza sozinha quando terminar.</p>
      </div>
    )
  }
  if (extracao.status === "erro") {
    return (
      <div className="p-12 text-center">
        <AlertTriangle size={32} className="mx-auto text-danger mb-3" aria-hidden="true"/>
        <p className="font-semibold text-ink" role="alert">Não foi possível ler os documentos enviados</p>
        <p className="text-sm text-muted mt-1">{extracao.erro || "A leitura terminou com erro, sem um motivo registrado."} Você pode tentar ler os mesmos documentos novamente.</p>
        <button
          disabled={reprocessando}
          onClick={async()=>{
            // antes: sem retorno nenhum se a nova tentativa falhasse
            setReprocessando(true)
            try { await empreendimentoIaService.reprocessar(extracaoId); toast("Nova leitura dos documentos iniciada.", "info"); load() }
            catch (e) { notificarErro(toast, "Não foi possível iniciar uma nova leitura", e) }
            finally { setReprocessando(false) }
          }}
          className="mt-4 px-4 py-2 bg-brand text-on-brand rounded-btn disabled:opacity-60">{reprocessando ? "Iniciando nova leitura..." : "Ler novamente"}</button>
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
      <div className="bg-warning-bg border border-warning-border rounded-card p-4 flex gap-3">
        <AlertTriangle className="text-warning" size={20}/>
        <div>
          <p className="text-sm font-semibold text-warning">Revisão necessária {extracao.status==="revisao" && "• baixa confiança ou conflitos detectados"}</p>
          <p className="text-xs text-warning mt-1">Confira os dados abaixo. Campos com ★ baixa confiança (&lt;60%) ou ⚠️ conflito precisam de atenção. Nenhum dado será salvo sem sua confirmação.</p>
        </div>
      </div>

      {conflitos.length>0 && (
        <div className="bg-card border border-danger-border rounded-card p-6">
          <h3 className="font-semibold text-danger flex items-center gap-2"><AlertTriangle size={18}/> Conflitos encontrados</h3>
          <div className="mt-4 space-y-4">
            {conflitos.map((c,i)=>(
              <div key={i} className="border border-line rounded-card p-4">
                <p className="text-sm font-medium text-ink">Campo: {c.campo}</p>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {c.valores.map((v:any, idx:number)=>(
                    <Evidencia key={idx} fonte={v} onUse={(val)=> {
                      // aplica no form
                      const campoSimples = c.campo.split(".").pop() || c.campo
                      // só confirma quando o valor foi de fato aplicado (antes dizia "aplicado" para qualquer campo)
                      const alvo = ["nome", "cidade", "regiao"].find(k => campoSimples.includes(k))
                      if (alvo) {
                        setForm((f:any)=>({...f, [alvo]: val}))
                        if (alvo === "nome") setNomeErro(undefined)
                        toast(`"${val}" aplicado no campo ${alvo === "regiao" ? "região" : alvo}.`, "success")
                      } else {
                        toast(`O campo "${campoSimples}" não é preenchido automaticamente. Copie o valor e ajuste-o no formulário abaixo.`, "info")
                      }
                    }}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-line rounded-card shadow-card p-6">
        <h3 className="font-semibold text-ink mb-4">Dados básicos</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted">Nome *</label>
            <input id="rev-nome" maxLength={255} aria-label="Nome do empreendimento" aria-invalid={!!nomeErro} aria-describedby={nomeErro ? "rev-nome-erro" : undefined} value={form.nome} onChange={e=>{ setForm({...form, nome:e.target.value}); setNomeErro(undefined) }} className={`w-full p-2.5 border ${nomeErro ? "border-danger" : "border-line"} rounded-btn mt-1`} placeholder="Residencial London Plaza"/>
            <InlineError id="rev-nome-erro" message={nomeErro} />
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
            <label htmlFor="rev-uf" className="text-xs font-semibold text-muted">UF</label>
            <input id="rev-uf" value={form.uf || ""} placeholder="PR" maxLength={2}
              onChange={e=>{ setForm({...form,uf:e.target.value}); setErrosEndereco(x=>({...x, uf: undefined})) }}
              onBlur={()=>setErrosEndereco(x=>({...x, uf: problemaUf(form.uf) ?? undefined}))}
              aria-invalid={!!errosEndereco.uf || undefined} aria-describedby={errosEndereco.uf ? "rev-uf-erro" : undefined}
              className={`w-full p-2.5 border rounded-btn mt-1 uppercase ${errosEndereco.uf ? "border-danger" : "border-line"}`}/>
            <InlineError id="rev-uf-erro" message={errosEndereco.uf} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted">Endereço</label>
            <input value={form.endereco} onChange={e=>setForm({...form,endereco:e.target.value})} className="w-full p-2.5 border border-line rounded-btn mt-1"/>
          </div>
          <div>
            <label htmlFor="rev-cep" className="text-xs font-semibold text-muted">CEP</label>
            <input id="rev-cep" value={form.cep} placeholder="00000-000" inputMode="numeric" maxLength={9}
              onChange={e=>{ setForm({...form,cep:e.target.value}); setErrosEndereco(x=>({...x, cep: undefined})) }}
              onBlur={()=>setErrosEndereco(x=>({...x, cep: problemaCep(form.cep) ?? undefined}))}
              aria-invalid={!!errosEndereco.cep || undefined} aria-describedby={errosEndereco.cep ? "rev-cep-erro" : undefined}
              className={`w-full p-2.5 border rounded-btn mt-1 ${errosEndereco.cep ? "border-danger" : "border-line"}`}/>
            <InlineError id="rev-cep-erro" message={errosEndereco.cep} />
          </div>
        </div>
      </div>

      {unidades.length > 0 && (
        <div className="bg-card border border-line rounded-card shadow-card p-6">
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
                      const erroCelula = errosUnidades[`${i}.${c.chave}`]
                      return (
                        <td key={c.chave} className="py-1 pr-3">
                          <input
                            id={`unidade-${i}.${c.chave}`}
                            aria-label={`${c.label} da unidade ${linha.nomeUnidade || i + 1}`}
                            aria-invalid={!!erroCelula || undefined}
                            aria-describedby={erroCelula ? `unidade-${i}.${c.chave}-erro` : undefined}
                            value={linha[c.chave] ?? ""}
                            onChange={e => atualizarCelulaUnidade(i, c.chave, e.target.value)}
                            onBlur={() => verificarCelula(i, c.chave)}
                            className={`w-28 p-1.5 border rounded-btn ${erroCelula ? "border-danger bg-danger-bg" : conflitosCelula.length > 1 ? "border-warning bg-warning-bg" : "border-line"}`}
                            title={conflitosCelula.length > 1 ? "Conflito entre documentos — confira os valores abaixo" : undefined}
                          />
                          {erroCelula && <p id={`unidade-${i}.${c.chave}-erro`} className="mt-0.5 w-28 text-[10px] leading-tight text-danger">{erroCelula}</p>}
                          {conflitosCelula.length > 1 && (
                            <div className="mt-1 space-y-1">
                              {conflitosCelula.map((f: any, fi: number) => (
                                <button key={fi} type="button"
                                  onClick={() => atualizarCelulaUnidade(i, c.chave, f.valorExtraido)}
                                  className="block text-[10px] px-1.5 py-0.5 rounded bg-warning-bg text-warning hover:bg-warning-border whitespace-nowrap"
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
                      <button type="button" onClick={() => removerUnidade(i)} className="text-muted hover:text-danger px-1" title="Remover esta unidade">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-card border border-line rounded-card p-6">
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

      {resumoErros && (
        <p role="alert" className="text-sm text-danger bg-danger-bg border border-danger-border rounded-btn px-4 py-2.5">{resumoErros}</p>
      )}
      <div className="flex gap-3">
        <button onClick={()=>window.history.back()} className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted">Cancelar</button>
        <button onClick={handleConfirm} disabled={saving} className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true"/> : <CheckCircle size={16} aria-hidden="true"/>} {saving ? "Salvando empreendimento..." : "Confirmar e salvar"}
        </button>
      </div>
    </div>
  )
}
