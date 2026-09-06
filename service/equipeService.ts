import { api } from "./api"
import type { Equipe } from "@/types"

export const equipeService = {
  async getAll(): Promise<Equipe[]> {
    const res = await api.get("/equipes")
    return res.data
  },
  async criar(data: { nome: string; descricao?: string; gestorId?: number | null }): Promise<Equipe> {
    const res = await api.post("/equipes", data)
    return res.data
  },
  async atribuirGestor(equipeId: number, gestorId: number): Promise<Equipe> {
    const res = await api.put(`/equipes/${equipeId}/gestor/${gestorId}`)
    return res.data
  },
  async removerGestor(equipeId: number): Promise<Equipe> {
    const res = await api.put(`/equipes/${equipeId}/gestor/remover`)
    return res.data
  },
  async sincronizar(equipeId: number): Promise<{ migrados: number; equipeId: number }> {
    const res = await api.put(`/equipes/${equipeId}/sincronizar`)
    return res.data
  }
}
