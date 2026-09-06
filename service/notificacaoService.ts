import { api } from "./api"
import type { Notificacao } from "@/types"

export const notificacaoService = {
  async getAll(): Promise<Notificacao[]> {
    const res = await api.get("/notificacoes")
    const d: any = res.data
    if (Array.isArray(d)) return d
    if (d && Array.isArray(d.content)) return d.content
    if (d == null || d === "") return []
    console.warn("[notificacoes] formato inesperado", d)
    return []
  },
  async contarNaoLidas(): Promise<number> {
    const res = await api.get("/notificacoes/nao-lidas")
    return res.data.count
  },
  async marcarLida(id: number): Promise<void> {
    await api.post(`/notificacoes/${id}/ler`)
  },
  async marcarTodas(): Promise<void> {
    await api.post("/notificacoes/ler-todas")
  }
}
