// Regras de acesso às telas por papel — fonte única usada pelo menu (Sidebar) e pela guarda de
// rotas (RouteShell). Antes cada um tinha sua própria lista, e elas divergiam (ex.: /equipes e
// /redistribuicao eram escondidas no menu mas não protegidas na rota).
//
// Isto é só experiência do usuário: a autorização real é feita no backend (SecurityFilterChain).
// Os papéis exigidos aqui espelham as regras do backend para as APIs que cada tela chama.

export type Papel = 'admin' | 'gestor' | 'corretor' | string

export interface RegraTela {
  /** papéis que podem abrir a tela; ausente = qualquer usuário logado */
  papeis?: Papel[]
  /** só esconde do menu (não bloqueia a rota) — usado onde a tela é útil a um papel específico */
  somenteMenu?: boolean
}

export const ADMIN: Papel[] = ['admin']
export const ADMIN_GESTOR: Papel[] = ['admin', 'gestor']

/** Rotas que exigem papel específico. Rotas não listadas: qualquer usuário logado. */
export const REGRAS_ROTAS: Record<string, RegraTela> = {
  '/usuarios': { papeis: ADMIN },
  '/equipes': { papeis: ADMIN },
  '/dashboard/gestor': { papeis: ADMIN_GESTOR },
  '/redistribuicao': { papeis: ADMIN_GESTOR },
  // exportação é pensada para o corretor (os próprios leads); admin/gestor não veem no menu,
  // mas a rota não é bloqueada (o backend já restringe os dados ao escopo de cada um)
  '/leads/exportar': { papeis: ['corretor'], somenteMenu: true },
}

export const ROTAS_PUBLICAS = ['/login', '/trocar-senha']

/** Regra aplicável a um caminho (a própria rota ou a rota-pai mais específica). */
export function regraDaRota(pathname: string): RegraTela | undefined {
  const candidatas = Object.keys(REGRAS_ROTAS)
    .filter(r => pathname === r || pathname.startsWith(r + '/'))
    .sort((a, b) => b.length - a.length)
  return candidatas.length ? REGRAS_ROTAS[candidatas[0]] : undefined
}

/** O item de menu desta rota deve aparecer para o papel? */
export function podeVerNoMenu(path: string, papel?: Papel | null): boolean {
  const regra = regraDaRota(path)
  if (!regra?.papeis) return true
  return !!papel && regra.papeis.includes(papel)
}

/** O usuário com este papel pode abrir a rota (guarda de rota)? */
export function podeAcessarRota(pathname: string, papel?: Papel | null): boolean {
  if (ROTAS_PUBLICAS.includes(pathname)) return true
  const regra = regraDaRota(pathname)
  if (!regra?.papeis || regra.somenteMenu) return true
  return !!papel && regra.papeis.includes(papel)
}
