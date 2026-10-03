'use client'

import { useCallback, useRef, useState } from 'react'
import { validarFormulario, type Regras } from '@/lib/validacao'

/**
 * Comportamento padrão de validação dos formulários:
 * - enquanto digita, nada de erro (não é agressivo);
 * - ao sair do campo (blur), valida aquele campo;
 * - depois que o campo mostrou erro, revalida a cada alteração — o aviso some assim que o valor fica certo;
 * - ao enviar, valida tudo, destaca todos os campos com problema e leva o foco ao primeiro;
 * - erros vindos do backend (`fields`) entram no mesmo lugar, junto ao campo.
 *
 * Os campos são localizados pelo atributo `name` dentro do elemento passado em `formRef`.
 */
export function useValidacao<T extends Record<string, any>>(regras: Regras<T>) {
  const [erros, setErros] = useState<Record<string, string>>({})
  const tocados = useRef<Set<string>>(new Set())
  const formRef = useRef<HTMLFormElement | HTMLDivElement | null>(null)

  const validarCampo = useCallback((nome: string, form: T) => {
    const p = regras[nome as keyof T & string]?.(form[nome], form) ?? null
    setErros(e => {
      if ((e[nome] ?? null) === p) return e
      const { [nome]: _, ...resto } = e
      return p ? { ...resto, [nome]: p } : resto
    })
    return p
  }, [regras])

  const focarPrimeiro = useCallback((lista: Record<string, string>) => {
    const nomes = Object.keys(lista)
    if (!nomes.length || !formRef.current) return
    // primeiro na ordem visual do formulário, não na ordem das regras
    const el = Array.from(formRef.current.querySelectorAll<HTMLElement>('[name]'))
      .find(x => nomes.includes(x.getAttribute('name')!))
    if (el) {
      el.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
      el.focus({ preventScroll: true })
    }
  }, [])

  /** Valida tudo no envio. Retorna true se o formulário pode ser enviado. */
  const validarTudo = useCallback((form: T) => {
    const novos = validarFormulario(form, regras)
    Object.keys(regras).forEach(n => tocados.current.add(n))
    setErros(novos)
    focarPrimeiro(novos)
    return Object.keys(novos).length === 0
  }, [regras, focarPrimeiro])

  /** Erros devolvidos pelo backend para os campos (ApiErrorResponse.fields). */
  const aplicarErrosServidor = useCallback((fields?: Record<string, string>) => {
    if (!fields || !Object.keys(fields).length) return
    setErros(e => ({ ...e, ...fields }))
    Object.keys(fields).forEach(n => tocados.current.add(n))
    focarPrimeiro(fields)
  }, [focarPrimeiro])

  const limpar = useCallback(() => { setErros({}); tocados.current = new Set() }, [])

  /**
   * Props para o input: name, aria-invalid, aria-describedby e onBlur.
   * Use `aoAlterar(nome, novoForm)` no onChange para revalidar campos que já mostraram erro.
   */
  const ligar = (nome: string, form: T) => ({
    name: nome,
    'aria-invalid': !!erros[nome] || undefined,
    'aria-describedby': erros[nome] ? `${nome}-erro` : undefined,
    onBlur: () => { tocados.current.add(nome); validarCampo(nome, form) },
  })

  const aoAlterar = (nome: string, form: T) => {
    if (tocados.current.has(nome) && (erros[nome] || regras[nome as keyof T & string])) validarCampo(nome, form)
  }

  return { erros, setErros, ligar, aoAlterar, validarTudo, aplicarErrosServidor, limpar, formRef, validarCampo }
}

/** Classe de borda/foco do campo conforme o estado de erro (não depende só de cor: há ícone e texto). */
export function classeErro(temErro: boolean) {
  return temErro
    ? 'border-danger focus:border-danger focus:ring-danger/25'
    : 'border-line focus:border-focus focus:ring-focus/30'
}
