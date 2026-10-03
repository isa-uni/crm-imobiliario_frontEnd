import { api } from "./api"

export interface MetaDTO {
  id: number
  usuarioId: number
  usuarioNome: string
  mesReferencia: string // yyyy-MM-01
  metaContratos: number
  origem: 'GESTOR' | 'CORRETOR'
  dataCriacao: string
  dataAtualizacao: string
}

export interface MetaResumoDTO {
  metaPropria: MetaDTO | null
  metaGestor: MetaDTO | null
  metaEfetiva: MetaDTO | null
}

export const metaService = {
  async getMinhaMeta(mesReferencia: string): Promise<MetaResumoDTO> {
    const res = await api.get("/metas/me", { params: { mesReferencia } })
    return res.data ?? { metaPropria: null, metaGestor: null, metaEfetiva: null }
  },

  async salvarMeta(data: { usuarioId: number; mesReferencia: string; metaContratos: number }): Promise<MetaDTO> {
    const res = await api.post("/metas", data)
    return res.data
  },

}
