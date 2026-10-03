import { api } from "./api"
import type { LoginResponse, UsuarioAutenticado } from "@/types"

const USUARIO_KEY = "usuario"

// O token de acesso fica apenas em cookie httpOnly (inacessível ao JavaScript). No navegador guardamos
// somente os dados públicos do usuário logado para montar a interface; quem decide se a sessão ainda
// é válida é o backend (401 → refresh automático em api.ts → login).
export const authService = {
  async login(email: string, senha: string): Promise<LoginResponse> {
    const response = await api.post("/login", { email, senha })
    return response.data
  },

  salvarSessao(loginResponse: LoginResponse) {
    localStorage.setItem(USUARIO_KEY, JSON.stringify(loginResponse.usuario))
  },

  async logout(redirect = true, reason = "logout") {
    // revoga refresh token e coloca o access token na blacklist no servidor
    try { await api.post("/auth/logout", {}, { withCredentials: true }) } catch {}
    localStorage.removeItem(USUARIO_KEY)
    if (redirect && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = `/login?reason=${reason}`
    }
  },

  logoutLocal() {
    localStorage.removeItem(USUARIO_KEY)
  },

  getUsuario(): UsuarioAutenticado | null {
    if (typeof window === "undefined") return null
    const raw = localStorage.getItem(USUARIO_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  },

  trocarSenhaObrigatoria(): boolean {
    return this.getUsuario()?.trocarSenha === true
  },

  atualizarUsuarioLocal(dados: { nome: string; email: string }) {
    const usuario = this.getUsuario()
    if (usuario) localStorage.setItem(USUARIO_KEY, JSON.stringify({ ...usuario, nome: dados.nome, email: dados.email }))
  },

  isAuthenticated(): boolean {
    return this.getUsuario() != null
  },

  async fetchMe(): Promise<UsuarioAutenticado | null> {
    try {
      const res = await api.get("/auth/me")
      return res.data
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 403 || status === 404) return null
      throw e
    }
  },
}
