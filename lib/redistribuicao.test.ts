import { describe, expect, it } from 'vitest'
import {
  alternarSelecao, alternarTodos, estadoSelecaoTodos, fluxoDeInativacao, gestoresElegiveis, mensagemInativacao,
  podarSelecao, resumoNomes, type PreviaInativacao,
} from './redistribuicao'

const previa = (p: Partial<PreviaInativacao>): PreviaInativacao => ({
  usuarioId: 10, nome: 'Carla', papel: 'corretor', gestorId: null, gestorNome: null,
  leadsAtribuidos: 0, exigeDecisaoSobreGestor: false, ...p,
})

describe('inativação de corretor', () => {
  it('corretor com gestor: confirmação simples, informando que o gestor será notificado', () => {
    const p = previa({ gestorId: 2, gestorNome: 'Gustavo', leadsAtribuidos: 3 })
    expect(fluxoDeInativacao(p)).toBe('confirmacao-simples')
    expect(mensagemInativacao(p)).toContain('3 leads ficarão aguardando redistribuição')
    expect(mensagemInativacao(p)).toContain('Gustavo, gestor dele, será notificado')
  })

  it('corretor sem gestor e com leads: identifica e exige decidir o responsável', () => {
    expect(fluxoDeInativacao(previa({ leadsAtribuidos: 2, exigeDecisaoSobreGestor: true }))).toBe('decidir-gestor')
  })

  it('corretor sem leads: não pergunta sobre gestor', () => {
    const p = previa({ leadsAtribuidos: 0 })
    expect(fluxoDeInativacao(p)).toBe('confirmacao-simples')
    expect(mensagemInativacao(p)).not.toContain('redistribuição')
  })

  it('opção de vincular gestor lista só gestores/admins ativos, nunca o próprio corretor', () => {
    const usuarios = [
      { id: 1, nome: 'Gestor ativo', papel: 'gestor', ativo: true },
      { id: 2, nome: 'Gestor inativo', papel: 'gestor', ativo: false },
      { id: 3, nome: 'Admin', papel: 'admin', ativo: true },
      { id: 4, nome: 'Outro corretor', papel: 'corretor', ativo: true },
      { id: 10, nome: 'Carla', papel: 'gestor', ativo: true },
    ]
    expect(gestoresElegiveis(usuarios, 10).map(u => u.id)).toEqual([1, 3])
  })
})

describe('seleção de vários leads', () => {
  it('marca e desmarca leads individualmente', () => {
    let s = alternarSelecao(new Set(), 1)
    s = alternarSelecao(s, 2)
    expect(Array.from(s)).toEqual([1, 2])
    s = alternarSelecao(s, 1)
    expect(Array.from(s)).toEqual([2])
  })

  it('"selecionar todos" marca a página inteira e, se já estava toda marcada, desmarca', () => {
    const pagina = [1, 2, 3]
    let s = alternarTodos(new Set([2]), pagina)
    expect(estadoSelecaoTodos(s, pagina)).toBe('todos')
    s = alternarTodos(s, pagina)
    expect(estadoSelecaoTodos(s, pagina)).toBe('nenhum')
    expect(estadoSelecaoTodos(new Set([1]), pagina)).toBe('parcial')
  })

  it('após recarregar, leads já atribuídos saem da seleção', () => {
    expect(Array.from(podarSelecao(new Set([1, 2, 3]), [2, 3, 4]))).toEqual([2, 3])
  })

  it('resume os nomes na confirmação', () => {
    expect(resumoNomes(['Ana', 'Bruno'])).toBe('Ana, Bruno')
    expect(resumoNomes(['A', 'B', 'C', 'D'], 2)).toBe('A, B e mais 2')
  })
})
