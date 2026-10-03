import { describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { notificarErro, plural, textoDoErro } from './feedback'
import { parseApiError } from './errorHandler'

function erroHttp(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() } as any
  return new AxiosError('falha', 'ERR_BAD_RESPONSE', config, {}, { status, statusText: '', headers: {}, config, data } as any)
}

describe('feedback', () => {
  it('erro inesperado inclui o código de referência quando o servidor não o colocou na mensagem', () => {
    const p = parseApiError(erroHttp(500, { requestId: 'abcdef123456' }))
    expect(textoDoErro(p)).toContain('ABCDEF12')
    // não repete a referência se ela já está no texto do servidor
    const ja = parseApiError(erroHttp(500, { message: 'Erro inesperado. Código de referência ABCDEF12.', requestId: 'abcdef123456' }))
    expect(textoDoErro(ja).match(/ABCDEF12/g)).toHaveLength(1)
  })

  it('erro de ação vira toast de erro com título (o que falhou) e mensagem (por quê)', () => {
    const toast = vi.fn()
    notificarErro(toast, 'Não foi possível descartar o lead', erroHttp(400, { message: 'Informe o motivo do descarte para descartar o lead.' }))
    expect(toast).toHaveBeenCalledWith('Informe o motivo do descarte para descartar o lead.', 'error', { title: 'Não foi possível descartar o lead' })
  })

  it('validação de campos vira alerta (warning), não erro', () => {
    const toast = vi.fn()
    notificarErro(toast, 'Não foi possível salvar', erroHttp(400, { message: 'Informe o nome.', fields: { nome: 'Informe o nome.' } }))
    expect(toast.mock.calls[0][1]).toBe('warning')
  })

  it('sessão expirada não gera toast (o cliente HTTP leva ao login)', () => {
    const toast = vi.fn()
    notificarErro(toast, 'Não foi possível salvar', erroHttp(401, {}))
    expect(toast).not.toHaveBeenCalled()
  })

  it('plural para contagens nas mensagens de sucesso', () => {
    expect(plural(1, 'lead', 'leads')).toBe('1 lead')
    expect(plural(3, 'lead', 'leads')).toBe('3 leads')
    expect(plural(0, 'lead', 'leads')).toBe('0 leads')
  })
})
