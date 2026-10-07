import { api } from "./api"
import type { Page, PerfilPayload, Usuario, UsuarioPayload } from "@/types"
import type { PreviaInativacao } from "@/lib/redistribuicao"

export const usuarioService = {

  /** Lista completa (sem paginação), para seletores. `papel` restringe, ex.: "gestor,admin". */
  async getAll(params?: { papel?: string }): Promise<Usuario[]> {
    const response = await api.get("/usuarios", params?.papel ? { params: { papel: params.papel } } : undefined)
    return response.data
  },

  /** Uma página de usuários; busca, papel e status são aplicados no servidor antes de paginar. */
  async getPaginado(params: { page: number; size: number; search?: string; papel?: string; status?: 'ativos' | 'inativos'; sort?: string }): Promise<Page<Usuario>> {
    const q: Record<string, any> = { page: params.page, size: params.size }
    if (params.search?.trim()) q.search = params.search.trim()
    if (params.papel && params.papel !== 'all') q.papel = params.papel
    if (params.status) q.status = params.status
    if (params.sort) q.sort = params.sort
    const response = await api.get("/usuarios", { params: q })
    return response.data
  },

  /** Contadores da tela de Usuários (total, ativos, inativos, por papel) sobre todos os usuários. */
  async getResumo(): Promise<{ total: number; ativos: number; inativos: number; porPapel: Record<string, number> }> {
    const response = await api.get("/usuarios/resumo")
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
