"use client"
import React, { useEffect, useState } from "react"
import { empreendimentoIaService, EmpreendimentoDetalhe } from "@/service/empreendimentoIaService"
import { parseApiError } from "@/lib/errorHandler"
import { ErrorState } from "@/components/ui/ErrorState"
import { Badge } from "@/components/ui/Badge"
import { brl, m2, faixa, dataCurta } from "@/lib/format"
import {
  Building2, MapPin, DollarSign, Layers, Sparkles, FileText, ArrowLeft, Home,
  CreditCard, Info, TreePine, ExternalLink,
} from "lucide-react"
import Link from "next/link"
import EmpreendimentoUploadModal from "@/components/empreendimento/EmpreendimentoUploadModal"
import UnidadesTable from "@/components/empreendimento/UnidadesTable"
import FontesOrigem from "@/components/empreendimento/FontesOrigem"

const SECOES = [
  { id: "sec-identificacao", label: "Identificação" },
  { id: "sec-caracteristicas", label: "Características" },
  { id: "sec-localizacao", label: "Localização" },
  { id: "sec-comercial", label: "Comercial" },
  { id: "sec-pagamento", label: "Pagamento" },
  { id: "sec-diferenciais", label: "Diferenciais" },
  { id: "sec-unidades", label: "Unidades" },
  { id: "sec-documentos", label: "Documentos" },
]

function Secao({ id, titulo, icone, children }: { id: string; titulo: string; icone?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-white border border-line rounded-card p-6 scroll-mt-20">
      <h2 className="font-semibold text-ink flex items-center gap-2 mb-4">{icone}{titulo}</h2>
      {children}
    </section>
  )
}

function Campo({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="font-medium text-ink mt-0.5">{value ?? "—"}</div>
    </div>
  )
}

export default function EmpreendimentoDetalhePage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const [emp, setEmp] = useState<EmpreendimentoDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await empreendimentoIaService.detalhe(id)
      setEmp(data)
    } catch (e: any) { setError(parseApiError(e).message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [id])

  if (loading) return <div className="min-h-screen bg-surface p-12 text-center text-muted animate-pulse">Carregando empreendimento...</div>
  if (error) return <div className="min-h-screen bg-surface p-8 max-w-2xl mx-auto"><ErrorState message={error} onRetry={load} /></div>
  if (!emp) return null

  const resumo = emp.unidadesResumo
  const car = emp.caracteristica
  const localizacaoTexto = [emp.endereco, emp.numero].filter(Boolean).join(", ")
  const cidadeUf = [emp.cidade, emp.uf].filter(Boolean).join("/")
  const enderecoCompleto = [localizacaoTexto, emp.bairro, cidadeUf].filter(Boolean).join(" • ")
  const temLocalizacao = Boolean(emp.endereco || emp.cidade)
  const semNenhumDado = !car && !resumo && !emp.condicao && (!emp.diferenciais || emp.diferenciais.length === 0) &&
    (!emp.areasComuns || emp.areasComuns.length === 0) && (!emp.documentos || emp.documentos.length === 0)

  const googleMapsHref = temLocalizacao
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([emp.endereco, emp.bairro, cidadeUf].filter(Boolean).join(", "))}`
    : null

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        <Link href="/empreendimentos" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Voltar</Link>

        {/* Hero */}
        <div className="bg-white border border-line rounded-card shadow-card overflow-hidden">
          <div className="h-40 md:h-52 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative">
            {emp.imagemUrl ? <img src={emp.imagemUrl} alt={emp.nome} className="w-full h-full object-cover" /> : <Building2 size={48} className="text-primary" />}
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-2">
              {emp.status && <Badge tone="info">{emp.status}</Badge>}
              {emp.ativo === false && <Badge tone="danger">Inativo</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-ink">{emp.nome}</h1>
            {temLocalizacao && <p className="text-muted flex items-center gap-1 mt-1"><MapPin size={14} />{enderecoCompleto}</p>}
            {emp.descricaoCurta && <p className="text-sm text-muted mt-3">{emp.descricaoCurta}</p>}
            {emp.descricaoCompleta && <p className="text-sm text-ink mt-2 whitespace-pre-wrap">{emp.descricaoCompleta}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-primary text-white rounded-btn text-sm font-semibold hover:bg-primary-700">Adicionar documentos</button>
            </div>
          </div>

          {/* Resumo rápido */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-line border-t border-line">
            <div className="p-4 text-center">
              <div className="text-xs text-muted">A partir de</div>
              <div className="font-bold text-[#0f8a52]">{resumo?.precoMin ? brl(resumo.precoMin) : emp.precoAtual?.valorMin ? brl(emp.precoAtual.valorMin) : "—"}</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xs text-muted">Metragem</div>
              <div className="font-bold text-ink">{faixa(car?.metragemMin ?? resumo?.metragemMin, car?.metragemMax ?? resumo?.metragemMax, (v) => m2(v))}</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xs text-muted">Quartos</div>
              <div className="font-bold text-ink">{faixa(car?.quartosMin, car?.quartosMax)}</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xs text-muted">Unidades</div>
              <div className="font-bold text-ink">{resumo ? `${resumo.disponiveis ?? 0} de ${resumo.total ?? 0} disponíveis` : "—"}</div>
            </div>
          </div>
        </div>

        {/* Navegação por seções */}
        <nav className="flex flex-wrap gap-2 sticky top-2 z-10">
          {SECOES.map(s => (
            <a key={s.id} href={`#${s.id}`} className="px-3 py-1.5 bg-white border border-line rounded-full text-xs font-semibold text-muted hover:text-primary hover:border-primary-200 shadow-card">
              {s.label}
            </a>
          ))}
        </nav>

        {semNenhumDado && (
          <div className="bg-amber-50 border border-amber-200 rounded-card p-4 text-sm text-amber-800">
            Nenhum dado foi extraído dos documentos ainda. Envie um documento (tabela de preços, memorial ou book) para começar a preencher esta ficha automaticamente.
          </div>
        )}

        <Secao id="sec-identificacao" titulo="Identificação" icone={<Info size={18} className="text-primary" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Campo label="Nome" value={emp.nome} />
            <Campo label="Status" value={emp.status} />
            <Campo label="Cadastrado em" value={dataCurta(emp.dataCadastro)} />
            <Campo label="Última atualização" value={dataCurta(emp.dataAtualizacao)} />
          </div>
        </Secao>

        <Secao id="sec-caracteristicas" titulo="Características gerais" icone={<Layers size={18} className="text-primary" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <Campo label="Metragem" value={faixa(car?.metragemMin ?? resumo?.metragemMin, car?.metragemMax ?? resumo?.metragemMax, (v) => m2(v))} />
            <Campo label="Quartos" value={faixa(car?.quartosMin, car?.quartosMax)} />
            <Campo label="Suítes" value={faixa(car?.suitesMin, car?.suitesMax)} />
            <Campo label="Banheiros" value={faixa(car?.banheirosMin, car?.banheirosMax)} />
            <Campo label="Vagas" value={faixa(car?.vagasMin, car?.vagasMax)} />
            <Campo label="Torres/blocos" value={car?.qtdTorres ?? (resumo?.blocos?.length || undefined)} />
            <Campo label="Pavimentos" value={car?.pavimentos} />
            <Campo label="Unidades por andar" value={car?.unidadesPorAndar} />
            <Campo label="Elevador" value={car?.possuiElevador === true ? "Sim" : car?.possuiElevador === false ? "Não" : undefined} />
          </div>
          {resumo?.tipologias && resumo.tipologias.length > 0 && (
            <div>
              <div className="text-xs text-muted mb-2">Tipologias disponíveis</div>
              <div className="flex flex-wrap gap-2">
                {resumo.tipologias.map(t => <Badge key={t} tone="neutral">{t}</Badge>)}
              </div>
            </div>
          )}
        </Secao>

        <Secao id="sec-localizacao" titulo="Localização" icone={<MapPin size={18} className="text-primary" />}>
          {temLocalizacao ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <Campo label="Endereço" value={emp.endereco} />
                <Campo label="Número" value={emp.numero} />
                <Campo label="Complemento" value={emp.complemento} />
                <Campo label="Bairro" value={emp.bairro} />
                <Campo label="Cidade" value={emp.cidade} />
                <Campo label="UF" value={emp.uf} />
                <Campo label="CEP" value={emp.cep} />
              </div>
              {emp.pontosReferencia && emp.pontosReferencia.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-muted mb-2">Pontos de referência</div>
                  <ul className="text-sm space-y-1">
                    {emp.pontosReferencia.map(p => (
                      <li key={p.id} className="text-ink">
                        {p.nome}{p.distancia ? ` — ${p.distancia}${p.unidade || "m"}` : ""}{p.tempo ? ` (${p.tempo} min)` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {googleMapsHref && (
                <a href={googleMapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                  Abrir no Google Maps <ExternalLink size={14} />
                </a>
              )}
            </>
          ) : <p className="text-sm text-muted">Endereço ainda não informado nos documentos.</p>}
        </Secao>

        <Secao id="sec-comercial" titulo="Informações comerciais" icone={<DollarSign size={18} className="text-primary" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <Campo label="Faixa de preço" value={faixa(resumo?.precoMin ?? emp.precoAtual?.valorMin, resumo?.precoMax ?? emp.precoAtual?.valorMax, (v) => brl(v))} />
            <Campo label="Ato" value={resumo ? faixa(resumo.atoMin, resumo.atoMax, (v) => brl(v)) : undefined} />
            <Campo label="Subsídio" value={resumo ? faixa(resumo.subsidioMin, resumo.subsidioMax, (v) => brl(v)) : undefined} />
            <Campo label="Financiamento" value={resumo ? faixa(resumo.financiamentoMin, resumo.financiamentoMax, (v) => brl(v)) : undefined} />
          </div>
          {emp.precos && emp.precos.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-muted mb-2">Histórico de tabelas de preço</div>
              <div className="space-y-1.5">
                {emp.precos.map((p, i) => (
                  <div key={p.id ?? i} className="flex justify-between text-sm border-b border-line/60 py-1.5">
                    <span className="text-muted">{p.tipo || "venda"} • {p.dataReferencia || "—"}</span>
                    <span className="font-semibold text-[#0f8a52]">{faixa(p.valorMin, p.valorMax, (v) => brl(v))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!resumo && (!emp.precos || emp.precos.length === 0) && <p className="text-sm text-muted">Preço ainda não cadastrado.</p>}
        </Secao>

        <Secao id="sec-pagamento" titulo="Condições de pagamento" icone={<CreditCard size={18} className="text-primary" />}>
          {emp.condicao ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Campo label="Entrada" value={emp.condicao.entrada != null ? brl(emp.condicao.entrada) : undefined} />
              <Campo label="Ato" value={emp.condicao.ato != null ? brl(emp.condicao.ato) : undefined} />
              <Campo label="Parcelas" value={emp.condicao.parcelas} />
              <Campo label="Valor da parcela" value={emp.condicao.valorParcela != null ? brl(emp.condicao.valorParcela) : undefined} />
              <Campo label="Subsídio" value={emp.condicao.subsidio != null ? brl(emp.condicao.subsidio) : undefined} />
              <Campo label="FGTS" value={emp.condicao.fgts === true ? "Aceito" : emp.condicao.fgts === false ? "Não aceito" : undefined} />
              <Campo label="Correção" value={emp.condicao.correcao} />
              <Campo label="Balões" value={emp.condicao.baloes} />
              {emp.condicao.financiamento && <div className="col-span-2 md:col-span-4"><Campo label="Financiamento" value={emp.condicao.financiamento} /></div>}
              {emp.condicao.condicoesEspeciais && <div className="col-span-2 md:col-span-4"><Campo label="Condições especiais" value={emp.condicao.condicoesEspeciais} /></div>}
              {emp.condicao.observacoes && <div className="col-span-2 md:col-span-4"><Campo label="Observações" value={emp.condicao.observacoes} /></div>}
            </div>
          ) : <p className="text-sm text-muted">Condições de pagamento ainda não cadastradas. Consulte o setor comercial antes de informar valores ao cliente.</p>}
        </Secao>

        <Secao id="sec-diferenciais" titulo="Diferenciais e lazer" icone={<Sparkles size={18} className="text-primary" />}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-muted mb-2 flex items-center gap-1"><TreePine size={13} /> Áreas comuns / lazer</div>
              {emp.areasComuns && emp.areasComuns.length > 0 ? (
                <div className="flex flex-wrap gap-2">{emp.areasComuns.map(a => <Badge key={a.id} tone="info">{a.nome}</Badge>)}</div>
              ) : <p className="text-sm text-muted">Nenhum item de lazer informado.</p>}
            </div>
            <div>
              <div className="text-xs text-muted mb-2">Diferenciais</div>
              {emp.diferenciais && emp.diferenciais.length > 0 ? (
                <ul className="space-y-1.5">
                  {emp.diferenciais.map(d => (
                    <li key={d.id} className="text-sm"><span className="font-medium text-ink">{d.titulo}</span>{d.descricao && <span className="text-muted"> — {d.descricao}</span>}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">Nenhum diferencial informado.</p>}
            </div>
          </div>
        </Secao>

        <Secao id="sec-unidades" titulo={`Unidades${resumo ? ` (${resumo.total})` : ""}`} icone={<Home size={18} className="text-primary" />}>
          {resumo ? <UnidadesTable empreendimentoId={id} resumo={resumo} documentos={emp.documentos} /> : <p className="text-sm text-muted">Nenhuma unidade cadastrada ainda — envie uma tabela de preços para importar automaticamente.</p>}
        </Secao>

        <div id="sec-documentos" className="space-y-6 scroll-mt-20">
          <Secao id="sec-documentos-lista" titulo="Documentos de origem" icone={<FileText size={18} className="text-primary" />}>
            {emp.documentos && emp.documentos.length > 0 ? (
              <div className="space-y-2">
                {emp.documentos.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 border border-line rounded-btn bg-surface/30 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ink font-medium truncate">{d.nomeOriginal}</p>
                      <p className="text-xs text-muted">{d.tipo?.toUpperCase()} • {d.tamanho ? `${(d.tamanho / 1024 / 1024).toFixed(1)} MB` : "—"} • enviado em {dataCurta(d.dataUpload)}</p>
                    </div>
                    <Badge tone={d.statusProcessamento === "concluido" ? "success" : d.statusProcessamento === "revisao" ? "warning" : d.statusProcessamento === "erro" ? "danger" : "neutral"}>
                      {d.statusProcessamento || "—"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted">Nenhum documento anexado.</p>}
          </Secao>

          <FontesOrigem empreendimentoId={id} />
        </div>

        <div className="text-center text-xs text-muted pb-4">
          Última atualização: {dataCurta(emp.dataAtualizacao)} — dados extraídos automaticamente dos documentos anexados. Sempre confirme valores e disponibilidade com o setor comercial antes de repassar ao cliente.
        </div>
      </div>
      <EmpreendimentoUploadModal open={showUpload} onClose={() => { setShowUpload(false); load() }} empreendimentoId={id} />
    </div>
  )
}
