import axios from "axios"

/**
 * Categoria do erro, para a tela decidir COMO apresentar (campo, toast, banner, redirecionamento)
 * sem depender do texto da mensagem.
 */
export type TipoErro =
  | "validacao"        // dado de formulário inválido (400 com fields) → mostrar no campo
  | "regra"            // regra de negócio impediu a ação (400) → toast/inline com o motivo
  | "sessao_expirada"  // 401 → login
  | "sem_permissao"    // 403
  | "nao_encontrado"   // 404
  | "conflito"         // 409 (duplicidade, registro em uso)
  | "arquivo_grande"   // 413
  | "muitas_tentativas"// 429
  | "indisponivel"     // 502/503/504
  | "sem_conexao"      // sem resposta do servidor
  | "tempo_esgotado"   // timeout
  | "inesperado"       // 500 ou desconhecido

export interface ParsedApiError {
  /** Texto para o usuário: o motivo, sem detalhes técnicos. */
  message: string
  tipo: TipoErro
  code?: string
  fields?: Record<string, string>
  details?: any
  status?: number
  requestId?: string
  /** Código curto para o usuário informar ao suporte (erros inesperados). */
  referencia?: string
  raw?: any
}

/** Mensagens usadas quando o servidor não explica o motivo (corpo vazio ou ilegível). */
export const MENSAGENS_PADRAO: Record<number, string> = {
  400: "Os dados enviados não foram aceitos. Revise o formulário e tente novamente.",
  401: "Sua sessão expirou. Faça login novamente.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "O registro solicitado não foi encontrado. Ele pode ter sido removido.",
  409: "Não foi possível salvar porque os dados entram em conflito com um registro já existente.",
  413: "O arquivo enviado é maior que o permitido: até 20 MB por arquivo e 100 MB por envio.",
  422: "Os dados enviados não foram aceitos. Revise o formulário e tente novamente.",
  429: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
  500: "Não foi possível concluir a operação por um erro inesperado no servidor. Tente novamente.",
  502: "O servidor está temporariamente indisponível. Tente novamente em alguns instantes.",
  503: "O servidor está temporariamente indisponível. Tente novamente em alguns instantes.",
  504: "O servidor demorou demais para responder. Tente novamente em alguns instantes.",
}

export const MENSAGEM_SEM_CONEXAO =
  "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente; se ela estiver normal, o sistema pode estar fora do ar."
export const MENSAGEM_TEMPO_ESGOTADO =
  "O servidor demorou demais para responder e a operação foi interrompida. Tente novamente em instantes."
export const MENSAGEM_INESPERADA =
  "Não foi possível concluir a operação por um erro inesperado. Tente novamente."

function tipoPorStatus(status: number, temCampos: boolean): TipoErro {
  if (status === 400 || status === 422) return temCampos ? "validacao" : "regra"
  if (status === 401) return "sessao_expirada"
  if (status === 403) return "sem_permissao"
  if (status === 404) return "nao_encontrado"
  if (status === 409) return "conflito"
  if (status === 413) return "arquivo_grande"
  if (status === 429) return "muitas_tentativas"
  if (status === 502 || status === 503 || status === 504) return "indisponivel"
  return "inesperado"
}

/** Os 8 primeiros caracteres do requestId — o mesmo código que o backend registra no log. */
export function referenciaDe(requestId?: string): string | undefined {
  return requestId ? requestId.slice(0, 8).toUpperCase() : undefined
}

/** Descarta textos que parecem técnicos (stack trace, SQL, HTML de erro) para não exibi-los ao usuário. */
export function pareceTecnico(texto: string): boolean {
  return /<html|<!doctype|exception|sqlstate|\bsql\b|stack ?trace|at [a-z]+\.[a-z]+\(|nullpointer|org\.springframework|java\.|hibernate/i.test(texto)
}

export function parseApiError(error: any): ParsedApiError {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        return { message: MENSAGEM_TEMPO_ESGOTADO, tipo: "tempo_esgotado", code: "TIMEOUT", status: 0, raw: error }
      }
      return { message: MENSAGEM_SEM_CONEXAO, tipo: "sem_conexao", code: "NETWORK_ERROR", status: 0, raw: error }
    }

    const status = error.response.status
    const data: any = error.response.data
    const padrao = MENSAGENS_PADRAO[status] || MENSAGEM_INESPERADA

    if (data && typeof data === "object" && !(typeof Blob !== "undefined" && data instanceof Blob)) {
      // formato padrão do backend (ApiErrorResponse): { message, code, fields, requestId }
      let fields: Record<string, string> | undefined =
        data.fields && typeof data.fields === "object" ? data.fields : undefined
      if (!fields && Array.isArray(data.errors)) {
        fields = {}
        data.errors.forEach((e: any) => { if (e.field) fields![e.field] = e.message })
      }
      const temCampos = !!fields && Object.keys(fields).length > 0
      const textoServidor: string | undefined =
        typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : undefined
      const message = textoServidor && !pareceTecnico(textoServidor) ? textoServidor : padrao
      return {
        message,
        tipo: tipoPorStatus(status, temCampos),
        code: data.code || `HTTP_${status}`,
        fields,
        details: data.details || data.errors,
        status,
        requestId: data.requestId,
        referencia: status >= 500 ? referenciaDe(data.requestId) : undefined,
        raw: data,
      }
    }

    if (typeof data === "string" && data.trim() && data.length < 300 && !pareceTecnico(data)) {
      return { message: data.trim(), tipo: tipoPorStatus(status, false), code: `HTTP_${status}`, status, raw: data }
    }

    return { message: padrao, tipo: tipoPorStatus(status, false), code: `HTTP_${status}`, status, raw: data }
  }

  if (error instanceof Error && error.message && !error.message.includes("AxiosError") && !pareceTecnico(error.message)) {
    return { message: error.message, tipo: "inesperado", raw: error }
  }
  return { message: MENSAGEM_INESPERADA, tipo: "inesperado", raw: error }
}

/**
 * Para requisições com responseType "blob" (ex.: exportação Excel) o corpo do erro chega como arquivo;
 * aqui ele é lido como JSON para que a causa real enviada pelo backend não se perca.
 */
export async function parseApiErrorAsync(error: any): Promise<ParsedApiError> {
  const data = error?.response?.data
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      const texto = await data.text()
      const json = JSON.parse(texto)
      const copia = { ...error, response: { ...error.response, data: json } }
      Object.setPrototypeOf(copia, Object.getPrototypeOf(error))
      return parseApiError(copia)
    } catch {
      // corpo não é JSON: segue com a mensagem padrão do status
    }
  }
  return parseApiError(error)
}
