// Regras da fila de toasts (puras, para teste): evita poluir a tela com mensagens repetidas ou demais.

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  title?: string
  duration: number
  /** quantas vezes a mesma mensagem chegou enquanto estava visível */
  repeticoes: number
}

/** No máximo 3 toasts visíveis ao mesmo tempo. */
export const MAX_TOASTS = 3

/** Rótulo textual do estado — o significado não depende só da cor/ícone (acessibilidade). */
export const ROTULO_TIPO: Record<ToastType, string> = {
  success: "Sucesso",
  error: "Erro",
  warning: "Atenção",
  info: "Informação",
}

/**
 * Tempo na tela: erros e alertas ficam mais, porque precisam ser lidos e costumam pedir uma ação.
 * Mensagens longas ganham tempo extra (≈ 60 ms por caractere acima de 90), com teto de 15 s.
 */
export function duracaoPadrao(tipo: ToastType, mensagem: string, titulo?: string): number {
  const base = { success: 4000, info: 5000, warning: 7000, error: 8000 }[tipo]
  const tamanho = mensagem.length + (titulo?.length ?? 0)
  const extra = Math.max(0, tamanho - 90) * 60
  return Math.min(base + extra, 15000)
}

/**
 * Adiciona um toast à fila:
 * - mensagem idêntica já visível (mesmo tipo, título e texto) não duplica: conta a repetição e reinicia o tempo;
 * - acima do limite, sai o mais antigo que não seja erro (erros têm prioridade para permanecer visíveis).
 * Retorna a nova lista e o id que deve ter o temporizador (re)iniciado.
 */
export function adicionarToast(lista: ToastItem[], novo: Omit<ToastItem, "repeticoes">, max = MAX_TOASTS): { lista: ToastItem[]; id: string } {
  const igual = lista.find(t => t.type === novo.type && t.message === novo.message && t.title === novo.title)
  if (igual) {
    return {
      lista: lista.map(t => (t.id === igual.id ? { ...t, repeticoes: t.repeticoes + 1, duration: novo.duration } : t)),
      id: igual.id,
    }
  }
  let resultado = [...lista, { ...novo, repeticoes: 1 }]
  while (resultado.length > max) {
    const indice = resultado.findIndex(t => t.type !== "error")
    resultado = resultado.filter((_, i) => i !== (indice >= 0 ? indice : 0))
  }
  return { lista: resultado, id: novo.id }
}
