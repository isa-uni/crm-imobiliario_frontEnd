import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'

// O toast global vive num componente React; aqui só importa se foi chamado
const toastError = vi.fn()
vi.mock('@/components/ui/ToastProvider', () => ({ getGlobalToast: () => ({ error: toastError }) }))

// window/localStorage mínimos (ambiente node)
function simularNavegador(pathname = '/leads') {
  const store = new Map<string, string>([['usuario', '{"id":1,"papel":"admin"}'], ['token', 'legado']])
  const location = { pathname, href: '' }
  vi.stubGlobal('window', { location })
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  })
  return { store, location }
}

type Resposta = { status: number; data?: any }
/** Adapter falso: responde por URL, registrando as chamadas */
function adapterFalso(respostas: Record<string, Resposta | Resposta[]>) {
  const chamadas: InternalAxiosRequestConfig[] = []
  const adapter = async (config: InternalAxiosRequestConfig) => {
    chamadas.push(config)
    const r = respostas[config.url!]
    const resp = Array.isArray(r) ? r.shift()! : r
    const response = { status: resp.status, statusText: '', headers: {}, config, data: resp.data ?? {} }
    if (resp.status >= 400) {
      throw new axios.AxiosError('erro', 'ERR_BAD_RESPONSE', config, {}, response as any)
    }
    return response
  }
  return { adapter, chamadas }
}

async function carregarApi() {
  vi.resetModules()
  return (await import('./api')).api
}

describe('cliente HTTP (service/api.ts)', () => {
  beforeEach(() => { toastError.mockReset() })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('usa cookies (withCredentials) e não envia header Authorization nem guarda token', async () => {
    const { store } = simularNavegador()
    const api = await carregarApi()
    const { adapter, chamadas } = adapterFalso({ '/usuarios/me': { status: 200, data: { id: 1 } } })
    api.defaults.adapter = adapter

    await api.get('/usuarios/me')

    expect(api.defaults.withCredentials).toBe(true)
    expect(AxiosHeaders.from(chamadas[0].headers as any).has('Authorization')).toBe(false)
    expect(store.has('token')).toBe(false) // token legado é removido ao carregar
  })

  it('401 → renova a sessão em /auth/refresh e repete a requisição original', async () => {
    simularNavegador()
    const api = await carregarApi()
    const { adapter, chamadas } = adapterFalso({
      '/dashboard/gestor': [{ status: 401, data: { code: 'AUTH_REQUIRED' } }, { status: 200, data: { kpis: {} } }],
    })
    api.defaults.adapter = adapter
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: {} })

    const resp = await api.get('/dashboard/gestor')

    expect(resp.status).toBe(200)
    expect(refresh).toHaveBeenCalledOnce()
    expect(refresh.mock.calls[0][0]).toMatch(/\/auth\/refresh$/)
    expect(chamadas).toHaveLength(2)
  })

  it('várias requisições com 401 ao mesmo tempo fazem um único refresh (fila)', async () => {
    simularNavegador()
    const api = await carregarApi()
    const { adapter } = adapterFalso({
      '/equipes': [{ status: 401 }, { status: 200 }],
      '/usuarios': [{ status: 401 }, { status: 200 }],
    })
    api.defaults.adapter = adapter
    let liberar!: () => void
    const refresh = vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise(res => { liberar = () => res({ status: 200, data: {} } as any) }))

    const p1 = api.get('/equipes')
    const p2 = api.get('/usuarios')
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled())
    liberar()
    const [r1, r2] = await Promise.all([p1, p2])

    expect(refresh).toHaveBeenCalledOnce()
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
  })

  it('refresh falhou → limpa a sessão local e vai para o login', async () => {
    const { store, location } = simularNavegador('/perfil')
    const api = await carregarApi()
    const { adapter } = adapterFalso({ '/usuarios/me': { status: 401 } })
    api.defaults.adapter = adapter
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh expirado'))

    await expect(api.get('/usuarios/me')).rejects.toBeTruthy()
    expect(store.has('usuario')).toBe(false)
    expect(location.href).toBe('/login?reason=expired')
  })

  it('403 por falta de permissão NÃO tenta refresh e devolve o erro para a tela', async () => {
    simularNavegador('/dashboard/gestor')
    const api = await carregarApi()
    const { adapter, chamadas } = adapterFalso({ '/dashboard/gestor': { status: 403, data: { code: 'FORBIDDEN' } } })
    api.defaults.adapter = adapter
    const refresh = vi.spyOn(axios, 'post')

    await expect(api.get('/dashboard/gestor')).rejects.toMatchObject({ response: { status: 403 } })
    expect(refresh).not.toHaveBeenCalled()
    expect(chamadas).toHaveLength(1)
  })

  it('403 PASSWORD_CHANGE_REQUIRED → redireciona para a troca de senha', async () => {
    const { location } = simularNavegador('/empreendimentos')
    const api = await carregarApi()
    const { adapter } = adapterFalso({ '/api/v1/empreendimentos/cards': { status: 403, data: { code: 'PASSWORD_CHANGE_REQUIRED' } } })
    api.defaults.adapter = adapter

    await expect(api.get('/api/v1/empreendimentos/cards')).rejects.toBeTruthy()
    expect(location.href).toBe('/trocar-senha')
  })

  it('erro 500 NÃO mostra toast global (a tela mostra o erro com contexto); erro de login (401) não tenta refresh', async () => {
    simularNavegador()
    const api = await carregarApi()
    const { adapter } = adapterFalso({
      '/equipes': { status: 500, data: { message: 'Erro interno no servidor.' } },
      '/login': { status: 401, data: { code: 'AUTH_INVALID_CREDENTIALS' } },
    })
    api.defaults.adapter = adapter
    const refresh = vi.spyOn(axios, 'post')
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(api.get('/equipes')).rejects.toBeTruthy()
    // antes o cliente HTTP mostrava um toast genérico E a tela mostrava outro: mensagem duplicada
    expect(toastError).not.toHaveBeenCalled()

    await expect(api.post('/login', {})).rejects.toBeTruthy()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('servidor indisponível (503) avisa o banner de conexão; a próxima resposta o encerra', async () => {
    simularNavegador()
    const eventos: string[] = []
    ;(window as any).dispatchEvent = (e: CustomEvent) => { eventos.push(`${e.type}:${e.detail}`); return true }
    vi.stubGlobal('CustomEvent', class { type: string; detail: any; constructor(t: string, o: any) { this.type = t; this.detail = o?.detail } })
    const api = await carregarApi()
    const { adapter } = adapterFalso({
      '/leads': [{ status: 503 }, { status: 200, data: [] }],
    })
    api.defaults.adapter = adapter
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(api.get('/leads')).rejects.toBeTruthy()
    await api.get('/leads')
    expect(eventos).toEqual(['crm:conexao:indisponivel', 'crm:conexao:ok'])
  })
})
