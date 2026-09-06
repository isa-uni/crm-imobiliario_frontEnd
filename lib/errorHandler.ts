import axios from "axios"

export interface ParsedApiError {
  message: string
  code?: string
  fields?: Record<string, string>
  details?: any
  status?: number
  requestId?: string
  raw?: any
}

export function parseApiError(error: any): ParsedApiError {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        return { message: "Tempo de resposta excedido. Verifique sua conexão e tente novamente.", code: "TIMEOUT", status: 0, raw: error }
      }
      if (error.message === "Network Error" || !navigator.onLine) {
        return { message: "Sem conexão com o servidor. Verifique sua internet.", code: "NETWORK_ERROR", status: 0, raw: error }
      }
      return { message: "Não foi possível conectar ao servidor. Tente novamente.", code: "NETWORK_ERROR", status: 0, raw: error }
    }

    const status = error.response.status
    const data = error.response.data

    // Backend padronizado ApiErrorResponse
    if (data && typeof data === "object") {
      if (data.fields && typeof data.fields === "object") {
        return {
          message: data.message || "Existem campos inválidos.",
          code: data.code || "VALIDATION_ERROR",
          fields: data.fields,
          details: data.details || data.errors,
          status,
          requestId: data.requestId,
          raw: data,
        }
      }
      if (data.errors && Array.isArray(data.errors)) {
        const fields: Record<string, string> = {}
        data.errors.forEach((e: any) => { if (e.field) fields[e.field] = e.message })
        return {
          message: "Existem campos inválidos.",
          code: "VALIDATION_ERROR",
          fields,
          details: data.errors,
          status,
          raw: data,
        }
      }
      if (data.message) {
        return { message: data.message, code: data.code, fields: data.fields, details: data.details, status, requestId: data.requestId, raw: data }
      }
      if (data.error) {
        // mapeia status
        const msg = typeof data.error === "string" ? data.error : "Erro ao processar a requisição."
        return { message: msg, code: data.code, status, raw: data }
      }
    }

    if (typeof data === "string" && data.trim()) {
      return { message: data, status, raw: data }
    }

    // mapeia por status quando não há body útil
    const statusMessages: Record<number, string> = {
      400: "Dados inválidos. Verifique os campos e tente novamente.",
      401: "Sessão expirada. Faça login novamente.",
      403: "Você não possui permissão para realizar esta ação.",
      404: "Registro não encontrado.",
      409: "Conflito de dados. Registro já existe.",
      422: "Dados inválidos.",
      429: "Muitas tentativas. Aguarde alguns minutos.",
      500: "Erro interno no servidor. Tente novamente mais tarde.",
      502: "Servidor temporariamente indisponível.",
      503: "Serviço indisponível. Tente novamente em instantes.",
    }
    return { message: statusMessages[status] || `Erro inesperado (${status}). Tente novamente.`, code: `HTTP_${status}`, status, raw: data }
  }

  if (error instanceof Error) {
    if (error.message && !error.message.includes("AxiosError")) {
      return { message: error.message, raw: error }
    }
  }
  return { message: "Ocorreu um erro inesperado. Tente novamente.", raw: error }
}

export function getFieldError(fields: Record<string, string> | undefined, field: string): string | undefined {
  if (!fields) return undefined
  return fields[field] || fields[field.toLowerCase()] || fields[field.toUpperCase()]
}
