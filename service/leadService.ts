// src/services/leadService.ts
import { api } from "./api"

export const leadService = {

  async getAll() {
    const response = await api.get("/leads")
    return response.data
  },

  async cadastrar(data: any) {
    const response = await api.post("/leads/cadastrar", data)
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

  async getMetrics() {
    const response = await api.get('/leads/metrics');
    return response.data;
  }
}