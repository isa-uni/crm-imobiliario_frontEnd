import { parseApiError, parseApiErrorAsync, type ParsedApiError } from "./errorHandler"
import type { ToastOptions, ToastType } from "@/components/ui/ToastProvider"

type ToastFn = (msg: string, type?: ToastType, options?: ToastOptions) => void

/**
 * Texto final do erro: o motivo + (em erros inesperados) o código de referência para o suporte,
 * quando o servidor ainda não o incluiu na mensagem.
 */
export function textoDoErro(p: ParsedApiError): string {
  if (p.referencia && !p.message.includes(p.referencia)) {
    return `${p.message} Se o problema persistir, informe ao suporte o código de referência ${p.referencia}.`
  }
  return p.message
}

/**
 * Padrão de erro de AÇÃO do sistema (salvar, excluir, redistribuir...):
 * - título = o que não aconteceu ("Não foi possível salvar o lead")
 * - mensagem = por que (vinda do backend: "Informe o motivo do descarte para descartar o lead.")
 * Erros de validação com campos não viram toast: a tela mostra junto aos campos (retorne `fields`).
 * Sessão expirada não vira toast: o cliente HTTP já leva ao login.
 */
export function notificarErro(toast: ToastFn, titulo: string, erro: unknown): ParsedApiError {
  const p = parseApiError(erro)
  if (p.tipo === "sessao_expirada") return p
  if (p.tipo === "validacao" && p.fields && Object.keys(p.fields).length > 0) {
    toast(p.message, "warning", { title: titulo })
    return p
  }
  toast(textoDoErro(p), "error", { title: titulo })
  return p
}

/** Mesma coisa para respostas binárias (ex.: download do Excel), cujo corpo de erro chega como arquivo. */
export async function notificarErroAsync(toast: ToastFn, titulo: string, erro: unknown): Promise<ParsedApiError> {
  const p = await parseApiErrorAsync(erro)
  if (p.tipo !== "sessao_expirada") toast(textoDoErro(p), "error", { title: titulo })
  return p
}

/** Pluralização simples para mensagens com contagem: plural(3, "lead", "leads") → "3 leads". */
export function plural(n: number, singular: string, pluralTexto: string): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`
}
