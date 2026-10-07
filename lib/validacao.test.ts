import { describe, expect, it } from 'vitest'
import {
  campo, cpfValido, gerarSenhaAleatoria, lerNumeroBR, mascaraTelefone, problemaCep, problemaCpf, problemaDataNascimento,
  problemaEmail, problemaInteiroNaoNegativo, problemaNome, problemaSenha, problemaTelefone, problemaUf,
  validarFormulario,
} from './validacao'

describe('CPF', () => {
  it('válido, com ou sem máscara → sem erro', () => {
    expect(problemaCpf('529.982.247-25')).toBeNull()
    expect(cpfValido('52998224725')).toBe(true)
  })
  it('sequência repetida (111.111.111-11) não é CPF válido', () => {
    expect(problemaCpf('111.111.111-11')).toBe('O CPF informado não é válido. Confira os 11 dígitos.')
  })
  it('dígito verificador errado → conteúdo inválido', () => {
    expect(problemaCpf('529.982.247-26')).toBe('O CPF informado não é válido. Confira os 11 dígitos.')
  })
  it('incompleto (máscara preenchida pela metade) → formato', () => {
    expect(problemaCpf('529.982.2__-__')).toBe('O CPF deve ter 11 dígitos.')
  })
  it('vazio ou só a máscara → mensagem de presença do campo', () => {
    const regra = campo('Informe o CPF do usuário.', problemaCpf)
    expect(regra('')).toBe('Informe o CPF do usuário.')
    expect(regra('___.___.___-__')).toBe('Informe o CPF do usuário.')
  })
})

describe('telefone', () => {
  it('celular e fixo válidos', () => {
    expect(problemaTelefone('(43) 99999-9999')).toBeNull()
    expect(problemaTelefone('(43) 3333-4444')).toBeNull()
  })
  it('explica o motivo do erro', () => {
    expect(problemaTelefone('(43) 9999-999_')).toBe('Informe o telefone com DDD (10 ou 11 dígitos).')
    expect(problemaTelefone('(20) 99999-9999')).toBe('O DDD 20 não existe. Confira o código de área.')
    expect(problemaTelefone('(43) 89999-9999')).toBe('Celular com 11 dígitos deve começar com 9 após o DDD.')
    expect(problemaTelefone('43 9999a9999')).toBe('O telefone deve conter apenas números.')
  })
  it('máscara acompanha fixo (10) e celular (11)', () => {
    expect(mascaraTelefone('4333334444')).toBe('(99) 9999-99999')
    expect(mascaraTelefone('43999999999')).toBe('(99) 99999-9999')
  })
})

describe('e-mail, nome, datas', () => {
  it('e-mail exige domínio com extensão', () => {
    expect(problemaEmail('ana@empresa.com')).toBeNull()
    expect(problemaEmail('ana@empresa')).toContain('não é válido')
    expect(problemaEmail('ana empresa.com')).toContain('não é válido')
    expect(problemaEmail('')).toBeNull() // presença é decidida pelo campo (no lead o e-mail é opcional)
  })
  it('nome precisa de letras e 2+ caracteres', () => {
    expect(problemaNome('José')).toBeNull()
    expect(problemaNome('A')).toBe('O nome deve ter entre 2 e 255 caracteres.')
    expect(problemaNome('123')).toBe('O nome deve conter letras.')
  })
  it('data de nascimento: futura, antes de 1900 ou inexistente', () => {
    expect(problemaDataNascimento('1990-05-10')).toBeNull()
    expect(problemaDataNascimento('2999-01-01')).toBe('A data de nascimento deve ser anterior a hoje.')
    expect(problemaDataNascimento('0198-05-10')).toContain('01/01/1900')
    expect(problemaDataNascimento('1990-02-31')).toBe('Informe uma data de nascimento que exista no calendário.')
  })
})

describe('endereço e números', () => {
  it('CEP e UF', () => {
    expect(problemaCep('86020-000')).toBeNull()
    expect(problemaCep('8602000')).toBe('Informe o CEP com 8 dígitos, no formato 00000-000.')
    expect(problemaUf('PR')).toBeNull()
    expect(problemaUf('Paraná')).toBe('Informe a UF com 2 letras, por exemplo PR.')
  })
  it('lê números no padrão brasileiro sem perder valores', () => {
    expect(lerNumeroBR('250.000,50')).toBe(250000.5)
    expect(lerNumeroBR('R$ 250.000')).toBe(250000)
    expect(lerNumeroBR('250000.00')).toBe(250000)
    expect(lerNumeroBR('45,5 m²')).toBe(45.5)
    expect(lerNumeroBR('')).toBeNull()
    expect(lerNumeroBR('sob consulta')).toBeNaN()
  })
  it('quantidades inteiras e não negativas', () => {
    expect(problemaInteiroNaoNegativo(2, 'A quantidade de quartos')).toBeNull()
    expect(problemaInteiroNaoNegativo(-1, 'A quantidade de quartos')).toBe('A quantidade de quartos não pode ser menor que zero.')
    expect(problemaInteiroNaoNegativo(-2, 'A área', 'A área não pode ser negativa.')).toBe('A área não pode ser negativa.')
    expect(problemaInteiroNaoNegativo(1.5, 'A quantidade de quartos')).toBe('A quantidade de quartos deve ser um número inteiro.')
  })
})

describe('senha (mesma regra do backend)', () => {
  it('8+ caracteres e 3 dos 4 tipos', () => {
    expect(problemaSenha('Abcdef12')).toBeNull()
    expect(problemaSenha('Ab1')).toBe('A nova senha deve ter pelo menos 8 caracteres.')
    expect(problemaSenha('abcdefgh')).toContain('fraca')
  })
  it('senha gerada sempre é forte, tem o tamanho pedido e varia', () => {
    const geradas = Array.from({ length: 200 }, () => gerarSenhaAleatoria())
    for (const s of geradas) {
      expect(s).toHaveLength(12)
      expect(problemaSenha(s)).toBeNull()
      expect(s).toMatch(/[A-Z]/); expect(s).toMatch(/[a-z]/); expect(s).toMatch(/\d/); expect(s).toMatch(/[^A-Za-z0-9]/)
    }
    expect(new Set(geradas).size).toBe(geradas.length)
  })
})

describe('validarFormulario', () => {
  it('devolve todos os campos com problema de uma vez (não um por vez)', () => {
    const erros = validarFormulario(
      { nome: '', cpf: '111.111.111-11', email: 'x' },
      { nome: campo('Informe o nome do usuário.', problemaNome), cpf: campo('Informe o CPF do usuário.', problemaCpf), email: campo('Informe o e-mail do usuário.', problemaEmail) },
    )
    expect(Object.keys(erros)).toEqual(['nome', 'cpf', 'email'])
  })
  it('regra condicional: motivo do descarte só é exigido quando o status é descarte', () => {
    const regras = { motivo: (v: string, f: any) => (f.status === 'descarte' && !v ? 'Informe o motivo do descarte para descartar o lead.' : null) }
    expect(validarFormulario({ status: 'lead', motivo: '' }, regras)).toEqual({})
    expect(validarFormulario({ status: 'descarte', motivo: '' }, regras)).toHaveProperty('motivo')
  })
})
