import axios from "axios"
import { parseApiError } from "@/lib/errorHandler"
import { getGlobalToast } from "@/components/ui/ToastProvider"

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (v:any)=>void; reject: (e:any)=>void }> = []

function processQueue(error:any, token: string|null = null) {
  failedQueue.forEach(p => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  failedQueue = []
}

api.interceptors.request.use(
  config => {
    // httpOnly: cookie é enviado automaticamente via withCredentials
    // manter header se ainda houver token legacy em localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config
    const status = error.response?.status
    const url = originalRequest?.url || ""

    // não tenta refresh para login/refresh/logout
    const isAuthUrl = url.includes("/login") || url.includes("/auth/refresh") || url.includes("/auth/logout")

    if ((status === 401 || status === 403) && !originalRequest._retry && !isAuthUrl) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
            if (token && typeof token === 'string') {
              originalRequest.headers.Authorization = `Bearer ${token}`
            } else {
              const t = typeof window !== 'undefined' ? localStorage.getItem("token") : null
              if (t) originalRequest.headers.Authorization = `Bearer ${t}`
            }
            return api(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // tenta renovar via httpOnly refreshToken cookie (Path=/auth/refresh, withCredentials:true)
        const refreshResp = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        // backend retorna novo accessToken no body (DadosTokenJWT) e via Set-Cookie httpOnly
        const newToken: string | null = refreshResp.data?.token ?? refreshResp.data?.accessToken ?? null
        if (newToken && typeof window !== 'undefined') {
          localStorage.setItem("token", newToken)
          // atualiza header do request original para retry com token v1
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          // também atualiza default para próximas requisições
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        }
        isRefreshing = false
        processQueue(null, newToken)
        return api(originalRequest)
      } catch (refreshErr) {
        isRefreshing = false
        processQueue(refreshErr, null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem("token")
          localStorage.removeItem("usuario")
          const reason = status === 401 ? "expired" : "forbidden"
          if (!window.location.pathname.includes("/login")) {
            window.location.href = `/login?reason=${reason}`
          }
        }
        return Promise.reject(refreshErr)
      }
    }

    if (status === 401 && isAuthUrl) {
      // falha de login não propaga refresh
      return Promise.reject(error)
    }

    // feedback global para erros de rede e 5xx que não são tratados localmente
    // componentes que tratam 400/422/404 inline não serão afetados (apenas exibimos toast para casos genéricos)
    const parsed = parseApiError(error)
    const isNetworkOrServerError = !error.response || (status !== undefined && status >= 500)
    const isTimeout = error.code === "ECONNABORTED"
    if (isNetworkOrServerError || isTimeout) {
      const toast = getGlobalToast()
      if (toast && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // evita toast duplicado em caso de refresh já redirecionado
        toast.error(parsed.message)
      }
      // log técnico para dev
      console.error(`[API ${status ?? 'NETWORK'}] ${url}`, parsed.raw || error)
    } else if (status !== undefined && status >= 400 && status < 500) {
      // log técnico apenas, sem toast (componente decide)
      console.warn(`[API ${status}] ${url}`, parsed.raw || error)
    }

    return Promise.reject(error)
  }
)
