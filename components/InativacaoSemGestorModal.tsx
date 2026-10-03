'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import type { Usuario } from '@/types';
import { InlineError } from '@/components/ui/ErrorState';
import { gestoresElegiveis, type PreviaInativacao } from '@/lib/redistribuicao';

export type DecisaoSemGestor = { tipo: 'vincular'; gestorId: number } | { tipo: 'assumir' };

/**
 * Corretor sem gestor e com leads: antes de inativar, o administrador escolhe quem cuidará da
 * redistribuição — um gestor vinculado agora, ou ele mesmo. Assim os leads nunca ficam sem responsável.
 */
export default function InativacaoSemGestorModal({
  previa,
  usuarios,
  meuNome,
  enviando,
  erro,
  onConfirmar,
  onCancelar,
}: {
  previa: PreviaInativacao;
  usuarios: Usuario[];
  meuNome: string;
  enviando: boolean;
  erro?: string | null;
  onConfirmar: (d: DecisaoSemGestor) => void;
  onCancelar: () => void;
}) {
  const [opcao, setOpcao] = useState<'vincular' | 'assumir'>('vincular');
  const [gestorId, setGestorId] = useState('');
  const [gestorErro, setGestorErro] = useState<string | undefined>();
  const primeiroCampo = useRef<HTMLInputElement>(null);
  const elegiveis = gestoresElegiveis(usuarios, previa.usuarioId);
  const n = previa.leadsAtribuidos;
  const leadsTxt = n === 1 ? '1 lead' : `${n} leads`;

  useEffect(() => {
    primeiroCampo.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !enviando) onCancelar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enviando, onCancelar]);

  // erro do servidor sobre o gestor escolhido aparece junto ao campo
  useEffect(() => { if (erro) setGestorErro(undefined); }, [erro]);

  const confirmar = () => {
    if (opcao === 'vincular') {
      if (!gestorId) { setGestorErro('Selecione o gestor que ficará responsável pelo corretor.'); return; }
      onConfirmar({ tipo: 'vincular', gestorId: Number(gestorId) });
    } else {
      onConfirmar({ tipo: 'assumir' });
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="sem-gestor-titulo" aria-describedby="sem-gestor-desc"
        className="bg-card max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-card shadow-card-lg">
        <div className="flex justify-between items-start gap-3 p-6 border-b border-line">
          <div className="flex gap-3">
            <span className="w-10 h-10 shrink-0 rounded-full bg-warning-bg text-warning flex items-center justify-center">
              <AlertTriangle size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 id="sem-gestor-titulo" className="text-lg font-bold text-ink">{previa.nome} não tem gestor vinculado</h2>
              <p id="sem-gestor-desc" className="text-sm text-muted mt-1">
                Ao inativar, {leadsTxt} {n === 1 ? 'ficará' : 'ficarão'} aguardando redistribuição. Escolha quem será responsável por
                {n === 1 ? ' redistribuí-lo' : ' redistribuí-los'} antes de continuar.
              </p>
            </div>
          </div>
          <button onClick={onCancelar} disabled={enviando} aria-label="Fechar" className="p-2 rounded-lg hover:bg-surface">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <fieldset className="p-6 space-y-3">
          <legend className="sr-only">Responsável pela redistribuição</legend>

          {/* div, não label: o select do gestor fica dentro do bloco e label aninhado é HTML inválido */}
          <div className={`border rounded-btn p-4 ${opcao === 'vincular' ? 'border-brand bg-brand-soft/40' : 'border-line'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input ref={primeiroCampo} type="radio" name="opcao" value="vincular" checked={opcao === 'vincular'}
                onChange={() => setOpcao('vincular')} className="mt-1" />
              <span className="flex-1">
                <span className="block font-semibold text-ink">Vincular um gestor e inativar</span>
                <span className="block text-sm text-muted">O gestor escolhido passa a ser o gestor de {previa.nome} e recebe a notificação (na plataforma e por e-mail) para redistribuir os leads.</span>
              </span>
            </label>
            {opcao === 'vincular' && (
              <div className="mt-3 pl-7">
                <label htmlFor="gestorId" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  Gestor <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <select id="gestorId" value={gestorId}
                  onChange={(e) => { setGestorId(e.target.value); setGestorErro(undefined); }}
                  aria-invalid={!!(gestorErro || erro) || undefined} aria-describedby={gestorErro || erro ? 'gestorId-erro' : undefined}
                  className={`w-full p-2.5 border rounded-btn bg-card text-ink ${gestorErro || erro ? 'border-danger' : 'border-line'}`}>
                  <option value="">Selecione o gestor</option>
                  {elegiveis.map(g => <option key={g.id} value={g.id}>{g.nome} ({g.papel === 'admin' ? 'administrador' : 'gestor'})</option>)}
                </select>
                {elegiveis.length === 0 && <p className="text-xs text-muted mt-1">Não há gestores ativos cadastrados. Use a outra opção.</p>}
                <InlineError id="gestorId-erro" message={gestorErro || erro || undefined} />
              </div>
            )}
          </div>

          <label className={`block border rounded-btn p-4 cursor-pointer ${opcao === 'assumir' ? 'border-brand bg-brand-soft/40' : 'border-line'}`}>
            <span className="flex items-start gap-3">
              <input type="radio" name="opcao" value="assumir" checked={opcao === 'assumir'} onChange={() => setOpcao('assumir')} className="mt-1" />
              <span>
                <span className="block font-semibold text-ink">Inativar sem gestor — eu cuido da redistribuição</span>
                <span className="block text-sm text-muted">Você ({meuNome}) fica responsável pelos {leadsTxt} e recebe a notificação na plataforma e por e-mail.</span>
              </span>
            </span>
          </label>
        </fieldset>

        <div className="flex flex-col-reverse sm:flex-row gap-3 p-6 pt-0">
          <button onClick={onCancelar} disabled={enviando}
            className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted hover:bg-surface">Cancelar</button>
          <button onClick={confirmar} disabled={enviando}
            className="flex-1 px-4 py-2.5 bg-danger text-white rounded-btn font-semibold shadow-btn hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
            {enviando && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {enviando ? 'Inativando...' : opcao === 'vincular' ? 'Vincular gestor e inativar' : 'Inativar e assumir redistribuição'}
          </button>
        </div>
      </div>
    </div>
  );
}
