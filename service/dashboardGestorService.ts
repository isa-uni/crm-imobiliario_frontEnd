import { api } from "./api"

export interface DashboardGestorDTO {
  kpis: {
    leadsRecebidos: number
    negociosFechados: number
    valorVendido: number
    taxaConversao: number
    ticketMedio: number
    tempoMedioDias: number
    leadsRecebidosAnterior: number
    variacaoLeads: number
    negociosAnterior: number
    variacaoNegocios: number
    valorAnterior: number
    variacaoValor: number
  }
  pipeline: { status: string; label: string; quantidade: number; percentual: number; valorPotencial: number }[]
  rankingCorretores: { corretorId: number; nome: string; leads: number; contatos: number; propostas: number; negocios: number; conversao: number; statusAtencao: string }[]
  metas: {
    metaContratosTotal: number
    realizadoContratos: number
    percentualContratos: number
    faltanteContratos: number
    porCorretor: { corretorId: number; nome: string; metaContratos: number|null; realizadoContratos: number; percentualContratos: number; status: string }[]
  }
  tempoMedio: {
    mediaGeralDias: number
    porCorretor: { corretorId: number; nome: string; mediaDias: number; totalNegocios: number }[]
    evolucao: { mes: string; mediaDias: number }[]
  }
  origens: { origem: string; label: string; quantidade: number; percentual: number; conversoes: number; negocios: number; taxaConversao: number }[]
  historico: { periodo: string; recebidos: number; contratos: number; descartes: number }[]
  imoveisMaisProcurados: { imovelId: number; titulo: string; interessados: number; propostas: number; negocios: number; conversao: number }[]
  alertas: { tipo: string; corretorId: number; corretorNome: string; mensagem: string; severidade: string }[]
}

export interface DashboardFiltros {
  inicio?: string // yyyy-MM-dd
  fim?: string
  corretorId?: number
  origem?: string
  status?: string
  imovelId?: number
}

export const dashboardGestorService = {
  async getDashboard(filtros: DashboardFiltros = {}): Promise<DashboardGestorDTO> {
    const params: Record<string, string> = {}
    if (filtros.inicio) params.inicio = filtros.inicio
    if (filtros.fim) params.fim = filtros.fim
    if (filtros.corretorId) params.corretorId = String(filtros.corretorId)
    if (filtros.origem) params.origem = filtros.origem
    if (filtros.status) params.status = filtros.status
    if (filtros.imovelId) params.imovelId = String(filtros.imovelId)
    const res = await api.get("/dashboard/gestor", { params })
    return res.data
  },

  async getEquipe() {
    const res = await api.get("/dashboard/gestor/equipe")
    return res.data
  },

  async getMetas(mesReferencia: string) {
    const res = await api.get("/dashboard/gestor/metas", { params: { mesReferencia } })
    return res.data
  },

  async salvarMeta(data: { usuarioId: number; mesReferencia: string; metaContratos: number }) {
    const res = await api.post("/dashboard/gestor/metas", data)
    return res.data
  }
}
