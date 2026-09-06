import { api } from "./api"
import type { LoginResponse, UsuarioAutenticado } from "@/types"

const TOKEN_KEY = "token"
const USUARIO_KEY = "usuario"

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    if (payload.exp) return payload.exp * 1000
    return null
  } catch { return null }
}

export const authService = {
  async login(email: string, senha: string): Promise<LoginResponse> {
    const response = await api.post("/login", { email, senha })
    return response.data
  },

  salvarSessao(loginResponse: LoginResponse) {
    // httpOnly: token fica em cookie, mas mantém em localStorage para fallback e expiração client
    if (loginResponse.token) localStorage.setItem(TOKEN_KEY, loginResponse.token)
    localStorage.setItem(USUARIO_KEY, JSON.stringify(loginResponse.usuario))
  },

  async logout(redirect = true) {
    try { await api.post("/auth/logout", {}, { withCredentials: true }) } catch {}
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USUARIO_KEY)
    if (redirect && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login?reason=logout"
    }
  },

  logoutLocal() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USUARIO_KEY)
  },

  getToken(): string | null {
    return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
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

  marcarSenhaTrocada() {
    const usuario = this.getUsuario()
    if (usuario) localStorage.setItem(USUARIO_KEY, JSON.stringify({ ...usuario, trocarSenha: false }))
  },

  atualizarUsuarioLocal(dados: { nome: string; email: string }) {
    const usuario = this.getUsuario()
    if (usuario) localStorage.setItem(USUARIO_KEY, JSON.stringify({ ...usuario, nome: dados.nome, email: dados.email }))
  },

  isExpired(): boolean {
    const t = this.getToken()
    if (!t) return true
    const exp = parseJwtExp(t)
    if (exp == null) return false
    return Date.now() >= exp
  },

  willExpireInMs(): number | null {
    const t = this.getToken()
    if (!t) return 0
    const exp = parseJwtExp(t)
    if (exp == null) return null
    return exp - Date.now()
  },

  isAuthenticated(): boolean {
    const t = this.getToken()
    if (!t) return false
    return !this.isExpired()
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
