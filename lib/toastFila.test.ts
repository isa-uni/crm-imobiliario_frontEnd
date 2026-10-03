import { describe, expect, it } from 'vitest'
import { adicionarToast, duracaoPadrao, MAX_TOASTS, type ToastItem } from './toastFila'

const novo = (id: string, type: ToastItem['type'], message: string, title?: string) =>
  ({ id, type, message, title, duration: 4000 })

describe('fila de toasts', () => {
  it('erros e alertas ficam mais tempo na tela do que sucesso', () => {
    expect(duracaoPadrao('success', 'ok')).toBe(4000)
    expect(duracaoPadrao('info', 'ok')).toBe(5000)
    expect(duracaoPadrao('warning', 'ok')).toBe(7000)
    expect(duracaoPadrao('error', 'ok')).toBe(8000)
  })

  it('mensagem longa ganha tempo extra, com teto de 15 s', () => {
    expect(duracaoPadrao('success', 'x'.repeat(190))).toBe(4000 + 100 * 60)
    expect(duracaoPadrao('error', 'x'.repeat(2000))).toBe(15000)
  })

  it('a mesma mensagem não duplica: conta a repetição', () => {
    let { lista } = adicionarToast([], novo('1', 'error', 'Sem conexão'))
    ;({ lista } = adicionarToast(lista, novo('2', 'error', 'Sem conexão')))
    expect(lista).toHaveLength(1)
    expect(lista[0].repeticoes).toBe(2)
  })

  it('mesmo texto com título diferente são mensagens diferentes', () => {
    let { lista } = adicionarToast([], novo('1', 'error', 'Sem permissão', 'Não foi possível salvar'))
    ;({ lista } = adicionarToast(lista, novo('2', 'error', 'Sem permissão', 'Não foi possível excluir')))
    expect(lista).toHaveLength(2)
  })

  it(`no máximo ${MAX_TOASTS} visíveis; sai o mais antigo que não é erro`, () => {
    let lista: ToastItem[] = []
    ;({ lista } = adicionarToast(lista, novo('e1', 'error', 'erro 1')))
    ;({ lista } = adicionarToast(lista, novo('s1', 'success', 'ok 1')))
    ;({ lista } = adicionarToast(lista, novo('s2', 'success', 'ok 2')))
    ;({ lista } = adicionarToast(lista, novo('s3', 'success', 'ok 3')))
    expect(lista.map(t => t.id)).toEqual(['e1', 's2', 's3'])
  })
})
