'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const TAMANHOS_PAGINA = [10, 20, 50, 100] as const;

interface PaginacaoProps {
  /** Página atual, base 0 (como o Page do backend). */
  page: number;
  totalPages: number;
  totalElements: number;
  /** Registros da página atual. */
  quantidadeNaPagina: number;
  size: number;
  onPageChange: (page: number) => void;
  /** Sem este callback o seletor de "por página" não aparece. */
  onSizeChange?: (size: number) => void;
  /** "lead"/"leads", "usuário"/"usuários". */
  rotulo: [singular: string, plural: string];
}

/**
 * Rodapé de paginação: os dados vêm paginados do backend (Page: content, totalElements, totalPages, number);
 * cada troca de página/tamanho dispara uma nova requisição na tela.
 */
export default function Paginacao({
  page, totalPages, totalElements, quantidadeNaPagina, size, onPageChange, onSizeChange, rotulo,
}: PaginacaoProps) {
  if (totalElements === 0) return null;

  const inicio = page * size + 1;
  const fim = page * size + quantidadeNaPagina;
  const primeira = page === 0;
  const ultima = page + 1 >= totalPages;
  const botao = 'p-2 border border-line rounded-btn text-ink hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent flex items-center justify-center';

  return (
    <nav aria-label="Paginação" className="px-4 py-3 border-t border-line flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted text-xs sm:text-sm">
        <span aria-live="polite">
          Mostrando {inicio}–{fim} de {totalElements} {totalElements === 1 ? rotulo[0] : rotulo[1]}
        </span>
        {onSizeChange && (
          <label className="flex items-center gap-2">
            Por página
            <select
              value={size}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-line rounded-btn bg-card text-ink focus:outline-none focus:border-focus"
            >
              {TAMANHOS_PAGINA.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onPageChange(0)} disabled={primeira} className={botao} aria-label="Primeira página" title="Primeira página">
            <ChevronsLeft size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onPageChange(page - 1)} disabled={primeira} className={`${botao} gap-1 px-3`}>
            <ChevronLeft size={16} aria-hidden="true" /> <span className="hidden sm:inline">Anterior</span>
          </button>
          <span className="px-2 text-ink whitespace-nowrap">
            Página <strong>{page + 1}</strong> de {totalPages}
          </span>
          <button type="button" onClick={() => onPageChange(page + 1)} disabled={ultima} className={`${botao} gap-1 px-3`}>
            <span className="hidden sm:inline">Próxima</span> <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onPageChange(totalPages - 1)} disabled={ultima} className={botao} aria-label="Última página" title="Última página">
            <ChevronsRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  );
}
