import { api } from "./api"

export const papelService = {

  async getAll() {
    const response = await api.get("/papel")
    return response.data
  },

  async criar(papel: string) {
    const response = await api.post("/papel/novo", { papel })
    return response.data
  },
}
