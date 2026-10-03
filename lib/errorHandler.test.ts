import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { parseApiError, parseApiErrorAsync, pareceTecnico, referenciaDe } from './errorHandler'

function erroHttp(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() } as any
  return new AxiosError('falha', 'ERR_BAD_RESPONSE', config, {}, {
    status, statusText: '', headers: {}, config, data,
  } as any)
}

describe('parseApiError', () => {
  it('lê o formato padrão ApiErrorResponse com erros por campo', () => {
    const r = parseApiError(erroHttp(400, {
      success: false, message: 'Existem campos inválidos.', code: 'VALIDATION_ERROR',
      fields: { nome: 'O nome é obrigatória' }, requestId: 'abc',
    }))
    expect(r.status).toBe(400)
    expect(r.code).toBe('VALIDATION_ERROR')
    expect(r.fields).toEqual({ nome: 'O nome é obrigatória' })
    expect(r.requestId).toBe('abc')
  })

  it('mantém a mensagem e o código de 403 (sem permissão / troca de senha pendente)', () => {
    const r = parseApiError(erroHttp(403, { message: 'Troque sua senha antes de continuar.', code: 'PASSWORD_CHANGE_REQUIRED' }))
    expect(r.status).toBe(403)
    expect(r.code).toBe('PASSWORD_CHANGE_REQUIRED')
    expect(r.message).toBe('Troque sua senha antes de continuar.')
  })

  it('usa mensagem padrão por status quando o corpo vem vazio', () => {
    expect(parseApiError(erroHttp(404, '')).message).toBe('O registro solicitado não foi encontrado. Ele pode ter sido removido.')
    expect(parseApiError(erroHttp(429, null)).message).toContain('Muitas tentativas')
    expect(parseApiError(erroHttp(500, undefined)).message).toContain('erro inesperado no servidor')
  })

  it('reconhece timeout e erro de rede (sem resposta do servidor)', () => {
    const timeout = new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED', { headers: new AxiosHeaders() } as any)
    expect(parseApiError(timeout).code).toBe('TIMEOUT')
    const rede = new AxiosError('Network Error', 'ERR_NETWORK', { headers: new AxiosHeaders() } as any)
    expect(parseApiError(rede).code).toBe('NETWORK_ERROR')
  })

  it('aceita erro que não é do Axios', () => {
    expect(parseApiError(new Error('falhou')).message).toBe('falhou')
    expect(parseApiError('???').message).toContain('inesperado')
  })

  it('classifica o tipo do erro para a tela decidir como apresentar', () => {
    expect(parseApiError(erroHttp(400, { message: 'Informe o nome.', fields: { nome: 'Informe o nome.' } })).tipo).toBe('validacao')
    expect(parseApiError(erroHttp(400, { message: 'Informe o motivo do descarte.' })).tipo).toBe('regra')
    expect(parseApiError(erroHttp(401, {})).tipo).toBe('sessao_expirada')
    expect(parseApiError(erroHttp(403, {})).tipo).toBe('sem_permissao')
    expect(parseApiError(erroHttp(404, {})).tipo).toBe('nao_encontrado')
    expect(parseApiError(erroHttp(409, { message: 'Já existe um usuário cadastrado com este e-mail.', code: 'DUPLICATE_EMAIL' })).tipo).toBe('conflito')
    expect(parseApiError(erroHttp(413, {})).tipo).toBe('arquivo_grande')
    expect(parseApiError(erroHttp(503, {})).tipo).toBe('indisponivel')
    expect(parseApiError(erroHttp(500, {})).tipo).toBe('inesperado')
    const rede = new AxiosError('Network Error', 'ERR_NETWORK', { headers: new AxiosHeaders() } as any)
    expect(parseApiError(rede).tipo).toBe('sem_conexao')
  })

  it('não exibe texto técnico vindo do servidor (stack trace, SQL, HTML)', () => {
    const r = parseApiError(erroHttp(500, { message: 'org.springframework.dao.DataIntegrityViolationException: could not execute statement; SQL [n/a]' }))
    expect(r.message).not.toMatch(/springframework|SQL/)
    expect(r.message).toContain('erro inesperado')
    expect(parseApiError(erroHttp(502, '<html><body>Bad Gateway</body></html>')).message).toContain('temporariamente indisponível')
    expect(pareceTecnico('java.lang.NullPointerException')).toBe(true)
    expect(pareceTecnico('Informe o telefone com DDD (10 ou 11 dígitos).')).toBe(false)
  })

  it('erro 500 traz o código de referência (8 primeiros caracteres do requestId)', () => {
    const r = parseApiError(erroHttp(500, { message: 'Erro', requestId: 'a1b2c3d4-e5f6-7890' }))
    expect(r.referencia).toBe('A1B2C3D4')
    expect(referenciaDe(undefined)).toBeUndefined()
    // erros de regra não precisam de referência
    expect(parseApiError(erroHttp(400, { message: 'x', requestId: 'a1b2c3d4' })).referencia).toBeUndefined()
  })

  it('lê o motivo real de um erro de download (corpo em Blob)', async () => {
    const blob = new Blob([JSON.stringify({ message: 'Você não tem permissão para exportar estes leads.', code: 'ACCESS_DENIED' })], { type: 'application/json' })
    const r = await parseApiErrorAsync(erroHttp(403, blob))
    expect(r.message).toBe('Você não tem permissão para exportar estes leads.')
    expect(r.tipo).toBe('sem_permissao')
  })
})
