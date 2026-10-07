import { describe, expect, it } from 'vitest'
import { podeAcessarRota, podeVerNoMenu, regraDaRota } from './acesso'

// Telas citadas no problema de acesso + as demais do menu
const TELAS_TODOS = ['/dashboard', '/leads', '/relogio-vendas', '/empreendimentos', '/perfil']

describe('regras de acesso às telas (menu e guarda de rotas)', () => {
  describe('telas abertas a qualquer usuário logado', () => {
    for (const papel of ['admin', 'gestor', 'corretor']) {
      it(`${papel} vê e acessa Perfil, Empreendimentos e demais telas comuns`, () => {
        for (const tela of TELAS_TODOS) {
          expect(podeVerNoMenu(tela, papel), `${papel} deveria ver ${tela} no menu`).toBe(true)
          expect(podeAcessarRota(tela, papel), `${papel} deveria acessar ${tela}`).toBe(true)
        }
      })
    }

    it('empreendimentos: detalhe e revisão também são acessíveis (sub-rotas)', () => {
      expect(podeAcessarRota('/empreendimentos/12', 'corretor')).toBe(true)
      expect(podeAcessarRota('/empreendimentos/revisao/5', 'gestor')).toBe(true)
    })
  })

  describe('Dashboard Gestor e Redistribuição (admin e gestor)', () => {
    for (const tela of ['/dashboard/gestor', '/redistribuicao']) {
      it(`${tela}: admin e gestor acessam`, () => {
        expect(podeVerNoMenu(tela, 'admin')).toBe(true)
        expect(podeAcessarRota(tela, 'admin')).toBe(true)
        expect(podeVerNoMenu(tela, 'gestor')).toBe(true)
        expect(podeAcessarRota(tela, 'gestor')).toBe(true)
      })
      it(`${tela}: corretor não vê no menu e é redirecionado`, () => {
        expect(podeVerNoMenu(tela, 'corretor')).toBe(false)
        expect(podeAcessarRota(tela, 'corretor')).toBe(false)
      })
    }
  })

  describe('Equipes e Usuários (somente admin)', () => {
    for (const tela of ['/equipes', '/usuarios']) {
      it(`${tela}: só admin`, () => {
        expect(podeAcessarRota(tela, 'admin')).toBe(true)
        expect(podeAcessarRota(tela, 'gestor')).toBe(false)
        expect(podeAcessarRota(tela, 'corretor')).toBe(false)
        expect(podeVerNoMenu(tela, 'admin')).toBe(true)
        expect(podeVerNoMenu(tela, 'gestor')).toBe(false)
      })
    }
  })

  it('menu e guarda de rota concordam para todas as telas restritas (evita item visível que redireciona)', () => {
    for (const tela of ['/dashboard/gestor', '/redistribuicao', '/equipes', '/usuarios']) {
      for (const papel of ['admin', 'gestor', 'corretor']) {
        expect(podeVerNoMenu(tela, papel)).toBe(podeAcessarRota(tela, papel))
      }
    }
  })

  it('Exportar Leads aparece só para o corretor, mas a rota não é bloqueada', () => {
    expect(podeVerNoMenu('/leads/exportar', 'corretor')).toBe(true)
    expect(podeVerNoMenu('/leads/exportar', 'admin')).toBe(false)
    expect(podeAcessarRota('/leads/exportar', 'admin')).toBe(true)
  })

  it('não confunde /dashboard com /dashboard/gestor nem /leads com /leads/exportar', () => {
    expect(regraDaRota('/dashboard')).toBeUndefined()
    expect(regraDaRota('/leads')).toBeUndefined()
    expect(regraDaRota('/dashboard/gestor')?.papeis).toEqual(['admin', 'gestor'])
  })

  it('papel desconhecido ou ausente não acessa telas restritas, mas acessa as comuns', () => {
    expect(podeAcessarRota('/dashboard/gestor', 'recepcionista')).toBe(false)
    expect(podeAcessarRota('/equipes', undefined)).toBe(false)
    expect(podeAcessarRota('/perfil', 'recepcionista')).toBe(true)
  })

  it('rotas públicas são sempre acessíveis', () => {
    expect(podeAcessarRota('/login', undefined)).toBe(true)
    expect(podeAcessarRota('/trocar-senha', undefined)).toBe(true)
  })
})
