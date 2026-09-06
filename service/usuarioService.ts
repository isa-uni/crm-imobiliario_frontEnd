import { api } from "./api"
import type { PerfilPayload, UsuarioPayload } from "@/types"

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

  async atualizarMe(data: PerfilPayload) {
    const response = await api.put("/usuarios/me", data)
    // Backend agora retorna DadosTokenJWT { token, usuario } sem version++ (normal)
    // com Set-Cookie httpOnly + body token para atualizar localStorage legacy
    const body = response.data
    if (body?.token && body?.usuario) {
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", body.token)
        localStorage.setItem("usuario", JSON.stringify(body.usuario))
      }
      return body.usuario
    }
    return body
  },

  async cadastrar(data: UsuarioPayload & { gestorId?: number | null }) {
    const response = await api.post("/usuarios/cadastrar", data)
    return response.data
  },

  async atualizar(id: number, data: Partial<UsuarioPayload> & { gestorId?: number | null }) {
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
