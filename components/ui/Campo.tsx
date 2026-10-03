'use client'

import React from 'react'
import { InlineError } from './ErrorState'

/**
 * Moldura padrão de um campo de formulário: rótulo (com * quando obrigatório), o input, texto de ajuda
 * e o erro logo abaixo. O input deve usar `id={nome}` e as props de `useValidacao().ligar(nome, form)`,
 * que apontam aria-describedby para o erro ("<nome>-erro").
 */
export function Campo({
  nome,
  rotulo,
  obrigatorio = false,
  erro,
  ajuda,
  className,
  children,
}: {
  nome: string
  rotulo: string
  obrigatorio?: boolean
  erro?: string
  ajuda?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={nome} className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
        {rotulo} {obrigatorio && <span className="text-danger" aria-hidden="true">*</span>}
        {obrigatorio && <span className="sr-only">(obrigatório)</span>}
      </label>
      {children}
      {ajuda && !erro && <p className="text-xs text-muted mt-1">{ajuda}</p>}
      <InlineError id={`${nome}-erro`} message={erro} />
    </div>
  )
}

/** Base visual dos inputs; a borda vem de classeErro() (useValidacao). */
export const inputBase = 'w-full p-2.5 border rounded-btn bg-card text-ink focus:outline-none focus:ring-4'
