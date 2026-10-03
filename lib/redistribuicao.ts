// Regras de tela da inativação de corretor e da redistribuição (puras, para teste).

/** Resposta de GET /usuarios/{id}/previa-inativacao */
export interface PreviaInativacao {
  usuarioId: number
  nome: string
  papel: string
  gestorId: number | null
  gestorNome: string | null
  leadsAtribuidos: number
  /** corretor sem gestor e com leads: o admin precisa vincular um gestor ou assumir a redistribuição */
  exigeDecisaoSobreGestor: boolean
}

export type FluxoInativacao = 'confirmacao-simples' | 'decidir-gestor'

export function fluxoDeInativacao(p: PreviaInativacao): FluxoInativacao {
  return p.exigeDecisaoSobreGestor ? 'decidir-gestor' : 'confirmacao-simples'
}

const leads = (n: number) => (n === 1 ? '1 lead' : `${n} leads`)

/** Texto da confirmação simples, com as consequências reais da inativação. */
export function mensagemInativacao(p: PreviaInativacao): string {
  const base = `${p.nome} perderá o acesso ao sistema imediatamente.`
  if (p.papel === 'gestor') return `${base} Ele deixará de ser o gestor das equipes que lidera. Você poderá reativá-lo depois.`
  if (p.papel !== 'corretor' || p.leadsAtribuidos === 0) return `${base} Você poderá reativá-lo depois.`
  const responsavel = p.gestorNome ? `${p.gestorNome}, gestor dele, será notificado para redistribuí-los` : 'você ficará responsável por redistribuí-los'
  return `${base} ${leads(p.leadsAtribuidos)} ficarão aguardando redistribuição e ${responsavel}. Você poderá reativá-lo depois.`
}

/** Usuários que podem ser vinculados como gestor do corretor: ativos, gestor ou admin, e não ele mesmo. */
export function gestoresElegiveis<T extends { id: number; papel: string; ativo: boolean }>(usuarios: T[], corretorId: number): T[] {
  return usuarios.filter(u => u.ativo && u.id !== corretorId && (u.papel === 'gestor' || u.papel === 'admin'))
}

// ------------------------------------------------------------------ seleção múltipla

/** Marca/desmarca um lead. Retorna um novo Set (estado imutável do React). */
export function alternarSelecao(selecionados: ReadonlySet<number>, id: number): Set<number> {
  const novo = new Set(selecionados)
  if (novo.has(id)) novo.delete(id)
  else novo.add(id)
  return novo
}

/** Caixa "selecionar todos" da página: se todos já estão marcados, desmarca; senão marca todos. */
export function alternarTodos(selecionados: ReadonlySet<number>, idsDaPagina: number[]): Set<number> {
  const novo = new Set(selecionados)
  const todos = idsDaPagina.length > 0 && idsDaPagina.every(id => novo.has(id))
  idsDaPagina.forEach(id => (todos ? novo.delete(id) : novo.add(id)))
  return novo
}

export function estadoSelecaoTodos(selecionados: ReadonlySet<number>, idsDaPagina: number[]): 'nenhum' | 'parcial' | 'todos' {
  const marcados = idsDaPagina.filter(id => selecionados.has(id)).length
  if (marcados === 0) return 'nenhum'
  return marcados === idsDaPagina.length ? 'todos' : 'parcial'
}

/** Mantém só os ids que ainda existem na lista (após recarregar, leads já atribuídos saem da seleção). */
export function podarSelecao(selecionados: ReadonlySet<number>, idsVisiveis: number[]): Set<number> {
  const visiveis = new Set(idsVisiveis)
  return new Set(Array.from(selecionados).filter(id => visiveis.has(id)))
}

/** "Ana, Bruno, Carla e mais 4" — para a confirmação da atribuição em massa. */
export function resumoNomes(nomes: string[], max = 8): string {
  if (nomes.length <= max) return nomes.join(', ')
  return `${nomes.slice(0, max).join(', ')} e mais ${nomes.length - max}`
}

export const MAX_ATRIBUICAO_EM_MASSA = 100
