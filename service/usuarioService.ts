import { api } from "./api"
import type { UsuarioPayload } from "@/types"

export const usuarioService = {

  async getAll() {
    const response = await api.get("/usuarios")
    return response.data
  },

  async getById(id: number) {
    const response = await api.get(`/usuarios/${id}`)
    return response.data
  },

  async getMe() {
    const response = await api.get("/usuarios/me")
    return response.data
  },

  async cadastrar(data: UsuarioPayload) {
    const response = await api.post("/usuarios/cadastrar", data)
    return response.data
  },

  async atualizar(id: number, data: Partial<UsuarioPayload>) {
    const response = await api.put(`/usuarios/atualizar/${id}`, data)
    return response.data
  },

  async trocarMinhaSenha(senhaAtual: string, novaSenha: string) {
    const response = await api.put("/usuarios/minha-senha", { senhaAtual, novaSenha })
    return response.data
  },

  async trocarSenhaAdmin(id: number, novaSenha: string) {
    const response = await api.put(`/usuarios/trocar-senha/${id}`, { novaSenha })
    return response.data
  },

  async inativar(id: number) {
    const response = await api.put(`/usuarios/inativar/${id}`)
    return response.data
  },

  async ativar(id: number) {
    const response = await api.put(`/usuarios/ativar/${id}`)
    return response.data
  },
}
