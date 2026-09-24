// src/services/leadService.ts
import { api } from "./api"

export const leadService = {

  async getAll(params?: { page?: number; size?: number; search?: string; status?: string; month?: string; sort?: string }) {
    const q: any = {}
    if (params?.page != null) q.page = params.page
    if (params?.size != null) q.size = params.size
    if (params?.search) q.search = params.search
    if (params?.status) q.status = params.status
    if (params?.month) q.month = params.month
    if (params?.sort) q.sort = params.sort
    const response = await api.get("/leads", Object.keys(q).length ? { params: q } : undefined)
    const d: any = response.data
    if (Array.isArray(d)) return d
    if (d && Array.isArray(d.content)) return d // Page<Lead>
    return d
  },

  async getMetrics() {
    const response = await api.get('/leads/metrics');
    return response.data;
  },

  async exportarExcel(filtros: { search?: string; status?: string; month?: string; origem?: string; historico?: string }) {
    const q: any = {}
    if (filtros.search) q.search = filtros.search
    if (filtros.status && filtros.status !== 'all') q.status = filtros.status
    if (filtros.month && filtros.month !== 'all') q.month = filtros.month
    if (filtros.origem && filtros.origem !== 'all') q.origem = filtros.origem
    if (filtros.historico && filtros.historico !== 'all') q.historico = filtros.historico
    const response = await api.get('/leads/exportar', { params: q, responseType: 'blob' })
    return response.data as Blob
  },

  async cadastrar(data: any) {
    const response = await api.post("/leads/cadastrar", data)
    console.log("response.data ", response.data)
    return response.data
  },

  async atualizar(id: number, data: any) {
    const response = await api.put(`/leads/atualizar/${id}`, data)
    return response.data
  },

  async inativar(id: number) {
    await api.put(`/leads/inativar/${id}`)
  },

  async ativar(id: number) {
    await api.put(`/leads/ativar/${id}`)
  },

  async getTramitacoes(id: number) {
    const response = await api.get(`/leads/${id}/tramitacoes`);
    return response.data;
  },

  async getAguardando(equipeId?: number) {
    const params: any = {}
    if (equipeId) params.equipeId = equipeId
    const res = await api.get("/leads/aguardando-redistribuicao", { params })
    return res.data
  },

  async getAguardandoResumo(params: { equipeId?: number; page?: number; size?: number } = {}) {
    const q: any = { includeResumo: true, page: params.page ?? 0, size: params.size ?? 50 }
    if (params.equipeId) q.equipeId = params.equipeId
    const res = await api.get("/leads/aguardando-redistribuicao", { params: q })
    return res.data
  },

  async redistribuir(leadId: number, novoCorretorId: number) {
    const res = await api.post("/leads/redistribuir", { leadId, novoCorretorId })
    return res.data
  },

  async redistribuirPath(leadId: number, novoCorretorId: number) {
    const res = await api.post(`/leads/${leadId}/redistribuir/${novoCorretorId}`)
    return res.data
  },

  async getHistoricoResponsaveis(leadId: number) {
    if (leadId == null || !Number.isFinite(Number(leadId))) return Promise.reject(new Error("leadId inválido"))
    const res = await api.get(`/leads/${leadId}/historico-responsaveis`)
    return res.data
  }
}