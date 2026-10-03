import { api } from "./api"
import type { PerfilPayload, UsuarioPayload } from "@/types"
import type { PreviaInativacao } from "@/lib/redistribuicao"

export const usuarioService = {

  async getAll() {
    const response = await api.get("/usuarios")
    return response.data
  },

  async getMe() {
    const response = await api.get("/usuarios/me")
    return response.data
  },

  async atualizarMe(data: PerfilPayload) {
    // backend renova o cookie httpOnly do access token (claims com nome/e-mail novos) e devolve o usuário
    const response = await api.put("/usuarios/me", data)
    return response.data
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

  /**
   * Inativa o usuário. Corretor sem gestor e com leads exige uma decisão:
   * `gestorId` vincula um gestor antes (ele assume a redistribuição) ou `semGestor` faz quem inativa assumir.
   */
  async inativar(id: number, opcoes: { gestorId?: number; semGestor?: boolean } = {}) {
    const params: Record<string, any> = {}
    if (opcoes.gestorId) params.gestorId = opcoes.gestorId
    if (opcoes.semGestor) params.semGestor = true
    const response = await api.put(`/usuarios/inativar/${id}`, null, { params })
    return response.data
  },

  /** Dados para confirmar a inativação: gestor vinculado e leads que irão para redistribuição. */
  async previaInativacao(id: number): Promise<PreviaInativacao> {
    const response = await api.get(`/usuarios/${id}/previa-inativacao`)
    return response.data
  },

  async ativar(id: number) {
    const response = await api.put(`/usuarios/ativar/${id}`)
    return response.data
  },
}
