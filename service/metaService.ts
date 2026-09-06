import { api } from "./api"

export interface MetaDTO {
  id: number
  usuarioId: number
  usuarioNome: string
  mesReferencia: string // yyyy-MM-01
  metaContratos: number
  dataCriacao: string
  dataAtualizacao: string
}

export const metaService = {
  async getMinhaMeta(mesReferencia: string): Promise<MetaDTO | null> {
    try {
      const res = await api.get("/metas/me", { params: { mesReferencia } })
      if (res.status === 204 || !res.data) return null
      return res.data
    } catch (e: any) {
      if (e?.response?.status === 204 || e?.response?.status === 404) return null
      throw e
    }
  },

  async salvarMeta(data: { usuarioId: number; mesReferencia: string; metaContratos: number }): Promise<MetaDTO> {
    const res = await api.post("/metas", data)
    return res.data
  },

  async getByUsuarioEMes(usuarioId: number, mesReferencia: string): Promise<MetaDTO | null> {
    try {
      const res = await api.get("/dashboard/gestor/metas", { params: { mesReferencia } })
      const lista: MetaDTO[] = res.data
      return lista.find(m => m.usuarioId === usuarioId) || null
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 404 || status === 204) return null
      throw e
    }
  }
}
