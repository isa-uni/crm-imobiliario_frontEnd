import { api } from "./api"
import type { LoginResponse, UsuarioAutenticado } from "@/types"

const TOKEN_KEY = "token"
const USUARIO_KEY = "usuario"

export const authService = {
  async login(email: string, senha: string): Promise<LoginResponse> {
    const response = await api.post("/login", { email, senha })
    return response.data
  },

  salvarSessao(loginResponse: LoginResponse) {
    localStorage.setItem(TOKEN_KEY, loginResponse.token)
    localStorage.setItem(USUARIO_KEY, JSON.stringify(loginResponse.usuario))
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USUARIO_KEY)
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  getUsuario(): UsuarioAutenticado | null {
    const raw = localStorage.getItem(USUARIO_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  trocarSenhaObrigatoria(): boolean {
    return this.getUsuario()?.trocarSenha === true
  },

  marcarSenhaTrocada() {
    const usuario = this.getUsuario()
    if (usuario) {
      localStorage.setItem(USUARIO_KEY, JSON.stringify({ ...usuario, trocarSenha: false }))
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },
}
