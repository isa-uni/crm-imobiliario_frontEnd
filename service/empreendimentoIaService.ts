import { api } from "./api"

export interface EmpreendimentoCard {
  id: number
  nome: string
  slug: string
  codigoExterno?: string
  codigoCrm?: string
  status?: string
  cidade?: string
  bairro?: string
  uf?: string
  metragemMin?: number
  metragemMax?: number
  quartosMin?: number
  quartosMax?: number
  vagasMin?: number
  vagasMax?: number
  precoMin?: number
  precoMax?: number
  imagemUrl?: string
  disponiveis?: number
  ativo?: boolean
}

export interface CaracteristicaDTO {
  metragemMin?: number; metragemMax?: number
  quartosMin?: number; quartosMax?: number
  suitesMin?: number; suitesMax?: number
  banheirosMin?: number; banheirosMax?: number
  vagasMin?: number; vagasMax?: number
  pavimentos?: number; unidadesPorAndar?: number; qtdTorres?: number
  possuiElevador?: boolean
}

export interface PrecoDTO {
  id?: number; tipo?: string; valorMin?: number; valorMax?: number
  moeda?: string; dataReferencia?: string; observacao?: string
}

export interface CondicaoDTO {
  entrada?: number; ato?: number; valorParcela?: number; subsidio?: number
  parcelas?: number; baloes?: string; financiamento?: string; correcao?: string
  condicoesEspeciais?: string; observacoes?: string; fgts?: boolean
}

export interface PlantaDTO {
  id?: number; nome?: string; tipo?: string; metragem?: number
  quartos?: number; suites?: number; banheiros?: number; vagas?: number
  descricao?: string; arquivoId?: number; ordem?: number
}

export interface AreaComumDTO { id?: number; nome: string; descricao?: string; icone?: string; ordem?: number }
export interface DiferencialDTO { id?: number; titulo: string; descricao?: string; ordem?: number }
export interface PontoReferenciaDTO {
  id?: number; nome: string; categoria?: string; unidade?: string
  distancia?: number; tempo?: number; lat?: number; lng?: number; ordem?: number
}
export interface ImagemDTO { id?: number; arquivoId?: number; tipo?: string; legenda?: string; url?: string; ordem?: number; destaque?: boolean }
export interface DocumentoDTO {
  id: number; nomeOriginal: string; tipo?: string; caminho?: string; hash?: string
  mime?: string; tamanho?: number; statusProcessamento?: string; dataUpload?: string
}

export interface UnidadesResumoDTO {
  total?: number; disponiveis?: number; reservadas?: number; vendidas?: number; emProcesso?: number
  metragemMin?: number; metragemMax?: number
  precoMin?: number; precoMax?: number
  atoMin?: number; atoMax?: number
  subsidioMin?: number; subsidioMax?: number
  financiamentoMin?: number; financiamentoMax?: number
  valorAvaliacaoMin?: number; valorAvaliacaoMax?: number
  tipologias?: string[]
  blocos?: string[]
}

export interface UnidadeDTO {
  id?: number
  nomeUnidade: string
  bloco?: string
  tipologia?: string
  areaPrivativa?: number
  areaComum?: number
  outrasAreas?: number
  garagem?: string
  situacao?: string
  preco?: number
  ato?: number
  subsidioCohapar?: number
  financiamento?: number
  valorAvaliacao?: number
  observacoes?: string
  documentoOrigemId?: number
  linhaOrigem?: number
  statusValidacao?: string
}

export interface EmpreendimentoDetalhe {
  id: number
  nome: string
  slug: string
  codigoExterno?: string
  codigoCrm?: string
  status?: string
  ativo?: boolean
  descricaoCurta?: string
  descricaoCompleta?: string
  incorporadora?: string
  construtora?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
  lat?: number
  lng?: number
  imagemUrl?: string
  dataCadastro?: string
  dataAtualizacao?: string
  caracteristica?: CaracteristicaDTO
  precos?: PrecoDTO[]
  precoAtual?: PrecoDTO
  condicao?: CondicaoDTO
  plantas?: PlantaDTO[]
  areasComuns?: AreaComumDTO[]
  diferenciais?: DiferencialDTO[]
  pontosReferencia?: PontoReferenciaDTO[]
  imagens?: ImagemDTO[]
  documentos?: DocumentoDTO[]
  unidadesResumo?: UnidadesResumoDTO
}

export interface ExtracaoResponse {
  extracaoId: number
  documentoIds: number[]
  status: string
}

export interface FonteDTO {
  id: number
  documentoId?: number
  documentoNome?: string
  campo: string
  valorExtraido?: string
  pagina?: number
  trecho?: string
  confianca?: number
}

export interface ExtracaoDTO {
  id: number
  empreendimentoId?: number
  status: string
  modeloIa?: string
  dataProcessamento?: string
  dataConclusao?: string
  erro?: string
  resultado?: any
  documentoIds?: number[]
  fontes?: FonteDTO[]
  conflitos?: { campo: string; valores: FonteDTO[] }[]
}

export const empreendimentoIaService = {
  async upload(files: File[], empreendimentoId?: number): Promise<ExtracaoResponse> {
    const fd = new FormData()
    files.forEach(f => fd.append("files", f))
    if (empreendimentoId) fd.append("empreendimentoId", String(empreendimentoId))
    const res = await api.post("/api/v1/empreendimentos/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    return res.data
  },
  async getExtracao(id: number): Promise<ExtracaoDTO> {
    const res = await api.get(`/api/v1/empreendimentos/extracoes/${id}`)
    return res.data
  },
  async confirmar(data: any) {
    const res = await api.post("/api/v1/empreendimentos/confirmar", data)
    return res.data
  },
  async listarCards(params?: { cidade?: string; bairro?: string; status?: string; search?: string; page?: number; size?: number; sort?: string }) {
    const res = await api.get("/api/v1/empreendimentos/cards", { params })
    return res.data // Page
  },
  async detalhe(id: number): Promise<EmpreendimentoDetalhe> {
    const res = await api.get(`/api/v1/empreendimentos/${id}/detalhe`)
    return res.data
  },
  async detalhePorSlug(slug: string): Promise<EmpreendimentoDetalhe> {
    const res = await api.get(`/api/v1/empreendimentos/slug/${slug}`)
    return res.data
  },
  async duplicados(params: { nome?: string; codigo?: string; endereco?: string }) {
    const res = await api.get("/api/v1/empreendimentos/duplicados", { params })
    return res.data
  },
  async reprocessar(extracaoId: number) {
    const res = await api.post(`/api/v1/empreendimentos/extracoes/${extracaoId}/reprocessar`)
    return res.data
  },
  async uploadParaExistente(id: number, files: File[]) {
    const fd = new FormData()
    files.forEach(f => fd.append("files", f))
    const res = await api.post(`/api/v1/empreendimentos/${id}/documentos`, fd, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    return res.data
  },
  async atualizar(id: number, data: any) {
    const res = await api.put(`/api/v1/empreendimentos/${id}`, data)
    return res.data
  },
  async listarUnidades(id: number, params?: {
    situacao?: string; bloco?: string; tipologia?: string; busca?: string
    precoMin?: number; precoMax?: number; areaMin?: number; areaMax?: number
    page?: number; size?: number; sort?: string
  }): Promise<{ content: UnidadeDTO[]; totalElements: number; totalPages: number }> {
    const res = await api.get(`/api/v1/empreendimentos/${id}/unidades`, { params })
    return res.data
  },
  async listarFontes(id: number): Promise<FonteDTO[]> {
    const res = await api.get(`/api/v1/empreendimentos/${id}/fontes`)
    return res.data
  }
}
