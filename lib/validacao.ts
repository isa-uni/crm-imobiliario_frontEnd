/**
 * Validadores de campo compartilhados por todos os formulários.
 * As regras e mensagens espelham o backend (anotações em util/validacao e nos DTOs): o frontend avisa
 * na hora, o backend garante a integridade. Cada função devolve a mensagem do problema ou null.
 * Vazio é tratado à parte, com a mensagem de presença do próprio campo ("Informe o CPF do usuário.").
 */

export type Validador = (valor: any) => string | null

export const somenteDigitos = (v: unknown) => String(v ?? '').replace(/\D/g, '')
// máscara sem nada digitado ("___.___.___-__") também conta como vazio: a mensagem certa é "Informe o CPF"
const vazio = (v: unknown) => v == null || String(v).replace(/[_.\-()\s/]/g, '') === ''

/** Mesma regex do backend (Documentos.EMAIL_REGEX): exige domínio com extensão (nome@empresa.com). */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** DDDs válidos no Brasil (mesma lista do backend). */
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
])

/** Limites de tamanho = tamanho das colunas no banco (V1__baseline.sql). */
export const LIMITES = {
  texto: 255,
  nomeEquipe: 100,
  nomePapel: 50,
  numeroEndereco: 20,
  garagem: 50,
} as const

// ------------------------------------------------------------------ regras de conteúdo

export function cpfValido(valor: string): boolean {
  const cpf = somenteDigitos(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  for (let posicao = 9; posicao <= 10; posicao++) {
    let soma = 0
    for (let i = 0; i < posicao; i++) soma += Number(cpf[i]) * (posicao + 1 - i)
    let digito = (soma * 10) % 11
    if (digito === 10) digito = 0
    if (digito !== Number(cpf[posicao])) return false
  }
  return true
}

/** Diferencia CPF incompleto (formato) de CPF com dígitos errados (conteúdo). */
export function problemaCpf(valor: string): string | null {
  if (vazio(valor)) return null
  if (/[^\d.\-\s_]/.test(valor)) return 'O CPF deve conter apenas números.'
  if (somenteDigitos(valor).length !== 11) return 'O CPF deve ter 11 dígitos.'
  return cpfValido(valor) ? null : 'O CPF informado não é válido. Confira os 11 dígitos.'
}

export function problemaTelefone(valor: string): string | null {
  if (vazio(valor)) return null
  if (/[^\d\s()+\-._]/.test(valor)) return 'O telefone deve conter apenas números.'
  const d = somenteDigitos(valor)
  if (d.length !== 10 && d.length !== 11) return 'Informe o telefone com DDD (10 ou 11 dígitos).'
  if (!DDDS.has(Number(d.slice(0, 2)))) return `O DDD ${d.slice(0, 2)} não existe. Confira o código de área.`
  if (d.length === 11 && d[2] !== '9') return 'Celular com 11 dígitos deve começar com 9 após o DDD.'
  if (d.length === 10 && (d[2] === '0' || d[2] === '1')) return 'Telefone fixo não pode começar com 0 ou 1 após o DDD.'
  return null
}

export function problemaEmail(valor: string): string | null {
  if (vazio(valor)) return null
  const v = String(valor).trim()
  if (v.length > LIMITES.texto) return `O e-mail deve ter no máximo ${LIMITES.texto} caracteres.`
  return EMAIL_REGEX.test(v) ? null : 'O e-mail informado não é válido. Use o formato nome@dominio.com.'
}

/** Nome de pessoa: 2 a 255 caracteres, com pelo menos uma letra (recusa "123" ou "--"). */
export function problemaNome(valor: string): string | null {
  if (vazio(valor)) return null
  const v = String(valor).trim()
  if (v.length < 2 || v.length > LIMITES.texto) return `O nome deve ter entre 2 e ${LIMITES.texto} caracteres.`
  return /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(v) ? null : 'O nome deve conter letras.'
}

/** Data ISO (yyyy-mm-dd, do input type=date). Não pode ser hoje/futura nem antes de 1900. */
export function problemaDataNascimento(valor: string): string | null {
  if (vazio(valor)) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (!m) return 'Informe uma data no formato DD/MM/AAAA.'
  const data = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (data.getMonth() !== Number(m[2]) - 1) return 'Informe uma data de nascimento que exista no calendário.'
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  if (data >= hoje) return 'A data de nascimento deve ser anterior a hoje.'
  if (Number(m[1]) < 1900) return 'A data de nascimento não pode ser anterior a 01/01/1900. Confira o ano.'
  return null
}

export function problemaCep(valor: string): string | null {
  if (vazio(valor)) return null
  return /^\d{5}-?\d{3}$/.test(String(valor).trim()) ? null : 'Informe o CEP com 8 dígitos, no formato 00000-000.'
}

export function problemaUf(valor: string): string | null {
  if (vazio(valor)) return null
  return /^[A-Za-z]{2}$/.test(String(valor).trim()) ? null : 'Informe a UF com 2 letras, por exemplo PR.'
}

export function problemaTamanho(valor: string, max: number, rotulo: string): string | null {
  return String(valor ?? '').length > max ? `${rotulo} deve ter no máximo ${max} caracteres.` : null
}

/** Mesma regra do backend (UsuarioService.validarForcaSenha). */
export function problemaSenha(valor: string): string | null {
  if (vazio(valor)) return null
  if (valor.length < 8) return 'A nova senha deve ter pelo menos 8 caracteres.'
  const tipos = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(valor)).length
  return tipos >= 3 ? null : 'A nova senha é fraca. Combine pelo menos 3 destes tipos: letra maiúscula, letra minúscula, número e caractere especial.'
}

/**
 * Senha aleatória (crypto) que sempre passa em problemaSenha: um caractere de cada tipo + o resto sorteado.
 * Sem caracteres ambíguos (0/O, 1/l/I) — o admin vai ditar ou colar a senha para o usuário.
 */
export function gerarSenhaAleatoria(tamanho = 12): string {
  const grupos = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%&*?']
  const todos = grupos.join('')
  const sorteio = (max: number) => {
    // rejeição para não favorecer os primeiros caracteres (viés do módulo)
    const limite = Math.floor(0x100000000 / max) * max
    const buf = new Uint32Array(1)
    do crypto.getRandomValues(buf); while (buf[0] >= limite)
    return buf[0] % max
  }
  const chars = grupos.map(g => g[sorteio(g.length)])
  while (chars.length < Math.max(tamanho, grupos.length)) chars.push(todos[sorteio(todos.length)])
  for (let i = chars.length - 1; i > 0; i--) {
    const j = sorteio(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

/**
 * Lê um número digitado no padrão brasileiro: "250.000,50", "R$ 250.000", "45,5 m²" ou "250000.50".
 * Devolve null para vazio e NaN quando o texto não é um número — para a tela avisar, em vez de
 * descartar o valor em silêncio (antes "250.000,00" virava vazio e "250.000" virava 250).
 */
export function lerNumeroBR(valor: unknown): number | null {
  if (valor == null) return null
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : NaN
  let t = String(valor).trim().replace(/^R\$\s*/i, '').replace(/\s*m[²2]$/i, '').replace(/\s/g, '')
  if (t === '') return null
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '')
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN
}

/** Número inteiro >= 0 (quantidades: quartos, vagas, contratos). */
export function problemaInteiroNaoNegativo(valor: unknown, rotulo: string, mensagemNegativo = `${rotulo} não pode ser menor que zero.`): string | null {
  if (vazio(valor)) return null
  const n = Number(valor)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return `${rotulo} deve ser um número inteiro.`
  return n < 0 ? mensagemNegativo : null
}

/**
 * Máscara de telefone que acompanha o que foi digitado: fixo "(43) 3333-4444" ou celular "(43) 99999-9999".
 * (Uma máscara fixa de 11 dígitos deixava o fixo como "(43) 33334-444_".)
 */
export function mascaraTelefone(valor: string): string {
  return somenteDigitos(valor).length > 10 ? '(99) 99999-9999' : '(99) 9999-99999'
}

// ------------------------------------------------------------------ montagem de regras por campo

/**
 * Compõe as regras de um campo: presença (se obrigatório) e depois formato/conteúdo.
 * Ex.: campo('Informe o CPF do usuário.', problemaCpf)
 */
export function campo(mensagemSeVazio: string | null, ...regras: Validador[]): Validador {
  return (valor: any) => {
    if (vazio(valor)) return mensagemSeVazio
    for (const r of regras) {
      const p = r(valor)
      if (p) return p
    }
    return null
  }
}

export type Regras<T> = Partial<Record<keyof T & string, (valor: any, form: T) => string | null>>

/** Valida todos os campos e devolve só os que têm problema. */
export function validarFormulario<T extends Record<string, any>>(form: T, regras: Regras<T>): Record<string, string> {
  const erros: Record<string, string> = {}
  for (const [nome, regra] of Object.entries(regras)) {
    const p = regra?.(form[nome], form)
    if (p) erros[nome] = p
  }
  return erros
}
