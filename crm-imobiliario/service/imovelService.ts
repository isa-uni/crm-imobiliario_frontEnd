// src/services/leadService.ts
import { api } from "./api"

export const imovelService = {

  async getAll() {
    const response = await api.get("/imovel")
    return response.data
  },

  async getDisponivel() {
    const response = await api.get("/imovel/disponivel")
    return response.data
  },

  async cadastrar(data: any) {
    const response = await api.post("/imovel/cadastrar", data)
    return response.data
  },

  async atualizar(id: number, data: any) {
    const response = await api.put(`/imovel/atualizar/${id}`, data)
    return response.data
  },

  async inativar(id: number) {
    await api.put(`/imovel/inativar/${id}`)
  },

  async ativar(id: number) {
    await api.put(`/imovel/ativar/${id}`)
  }
}