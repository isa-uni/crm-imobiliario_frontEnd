import axios from "axios"
import { parseApiError } from "@/lib/errorHandler"

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v:any)=>void; reject: (e:any)=>void }> = []

function processQueue(error:any) {
  failedQueue.forEach(p => {
    if (error) p.reject(error)
    else p.resolve(null)
  })
  failedQueue = []
}

// Autenticação somente por cookie httpOnly (accessToken/refreshToken), enviado automaticamente
// via withCredentials — o token nunca fica acessível ao JavaScript (proteção contra roubo via XSS).
// Limpa token legado que versões anteriores gravavam no localStorage.
if (typeof window !== 'undefined') {
  try { localStorage.removeItem("token") } catch {}
}

/**
 * Estado da conexão com o servidor, para o banner de problema sistêmico (components/ui/ConexaoBanner).
 * Falha de rede/servidor fora do ar → "indisponivel"; qualquer resposta do servidor → "ok".
 * Os erros de cada AÇÃO continuam sendo informados pela própria tela, com o contexto da ação.
 */
export const EVENTO_CONEXAO = "crm:conexao"
export type EstadoConexao = "ok" | "indisponivel"
let ultimoEstado: EstadoConexao = "ok"
function sinalizarConexao(estado: EstadoConexao) {
  if (estado === ultimoEstado || typeof window === "undefined" || typeof window.dispatchEvent !== "function") return
  ultimoEstado = estado
  window.dispatchEvent(new CustomEvent(EVENTO_CONEXAO, { detail: estado }))
}

api.interceptors.response.use(
  response => { sinalizarConexao("ok"); return response },
  async error => {
    const originalRequest = error.config
    const status = error.response?.status
    const url = originalRequest?.url || ""
    const code = error.response?.data?.code

    // não tenta refresh para login/refresh/logout
    const isAuthUrl = url.includes("/login") || url.includes("/auth/refresh") || url.includes("/auth/logout")

    // 403 por falta de permissão não se resolve com refresh — só 401 (token ausente/expirado/revogado)
    if (status === 401 && !originalRequest._retry && !isAuthUrl) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // renova via cookie httpOnly refreshToken (Path=/auth); o backend devolve novos cookies
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        isRefreshing = false
        processQueue(null)
        return api(originalRequest)
      } catch (refreshErr) {
        isRefreshing = false
        processQueue(refreshErr)
        if (typeof window !== 'undefined') {
          localStorage.removeItem("usuario")
          if (!window.location.pathname.includes("/login")) {
            window.location.href = `/login?reason=expired`
          }
        }
        return Promise.reject(refreshErr)
      }
    }

    // backend exige troca de senha antes de liberar o restante da API
    if (status === 403 && code === "PASSWORD_CHANGE_REQUIRED" && typeof window !== 'undefined') {
      if (!window.location.pathname.includes("/trocar-senha")) {
        window.location.href = "/trocar-senha"
      }
      return Promise.reject(error)
    }

    if (status === 401 && isAuthUrl) {
      // falha de login não propaga refresh
      return Promise.reject(error)
    }

    // A tela que fez a requisição informa o erro com o contexto da ação (ver lib/feedback.ts).
    // Aqui só: sinaliza o estado da conexão (banner) e registra o detalhe técnico no console.
    const parsed = parseApiError(error)
    if (parsed.tipo === "sem_conexao" || parsed.tipo === "indisponivel") sinalizarConexao("indisponivel")
    else if (error.response) sinalizarConexao("ok")
    if (!error.response || (status !== undefined && status >= 500)) {
      console.error(`[API ${status ?? "SEM RESPOSTA"}] ${url}`, parsed.raw || error)
    } else if (status !== undefined && status >= 400) {
      console.warn(`[API ${status}] ${url}`, parsed.raw || error)
    }

    return Promise.reject(error)
  }
)
