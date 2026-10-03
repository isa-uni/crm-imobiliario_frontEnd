'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Notificacao } from '@/types';
import { notificacaoService } from '@/service/notificacaoService';
import { useToast } from '@/components/ui/ToastProvider';
import { notificarErro, textoDoErro } from '@/lib/feedback';
import { parseApiError } from '@/lib/errorHandler';

const INTERVALO_MS = 30000;

/**
 * Notificações sem tela própria: o sino mostra quantas não foram lidas e abre um painel com a lista.
 * Clicar numa notificação marca como lida e leva à tela da ação (ex.: Redistribuição).
 * Fica na barra lateral; no celular, com a barra fechada, aparece ao lado do botão de menu.
 */
export default function NotificacoesSino({ ocultarGatilhoMovel = false }: { ocultarGatilhoMovel?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement | null>(null);

  const atualizarContador = useCallback(async () => {
    try { setNaoLidas(await notificacaoService.contarNaoLidas()); } catch { /* contador é secundário: mantém o último valor */ }
  }, []);

  const carregarLista = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await notificacaoService.getAll();
      setLista(dados);
      setNaoLidas(dados.filter(n => !n.lida).length);
    } catch (e) {
      const p = parseApiError(e);
      if (p.tipo !== 'sessao_expirada') setErro(textoDoErro(p));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    setMontado(true);
    atualizarContador();
    const id = setInterval(atualizarContador, INTERVALO_MS);
    const onFocus = () => atualizarContador();
    // redistribuição feita em outra aba gera notificações: atualiza na hora
    const onStorage = (e: StorageEvent) => { if (e.key === 'crm:lastRedistribuicao') atualizarContador(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); window.removeEventListener('storage', onStorage); };
  }, [atualizarContador]);

  const abrir = (e: React.MouseEvent<HTMLButtonElement>) => {
    gatilhoRef.current = e.currentTarget;
    if (aberto) { fechar(); return; }
    setAberto(true);
    carregarLista();
  };

  const fechar = useCallback(() => {
    setAberto(false);
    gatilhoRef.current?.focus();
  }, []);

  // Esc fecha; clique fora fecha; foco vai para o painel ao abrir
  useEffect(() => {
    if (!aberto) return;
    painelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    const onClick = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (painelRef.current?.contains(alvo) || gatilhoRef.current?.contains(alvo)) return;
      setAberto(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick); };
  }, [aberto, fechar]);

  const abrirNotificacao = async (n: Notificacao) => {
    if (!n.lida) {
      try {
        await notificacaoService.marcarLida(n.id);
        setLista(l => l.map(x => (x.id === n.id ? { ...x, lida: true } : x)));
        setNaoLidas(c => Math.max(0, c - 1));
      } catch (e) {
        notificarErro(toast, 'Não foi possível marcar a notificação como lida', e);
      }
    }
    if (n.link) {
      setAberto(false);
      router.push(n.link);
    }
  };

  const marcarTodas = async () => {
    const qtd = lista.filter(n => !n.lida).length;
    if (qtd === 0) return;
    try {
      await notificacaoService.marcarTodas();
      setLista(l => l.map(x => ({ ...x, lida: true })));
      setNaoLidas(0);
      toast(qtd === 1 ? '1 notificação marcada como lida.' : `${qtd} notificações marcadas como lidas.`, 'success');
    } catch (e) {
      notificarErro(toast, 'Não foi possível marcar as notificações como lidas', e);
    }
  };

  const rotulo = naoLidas === 0 ? 'Notificações, nenhuma nova' : `Notificações, ${naoLidas} ${naoLidas === 1 ? 'não lida' : 'não lidas'}`;
  const badge = naoLidas > 0 && (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center" aria-hidden="true">
      {naoLidas > 99 ? '99+' : naoLidas}
    </span>
  );

  const painel = aberto && (
    <div
      ref={painelRef}
      role="dialog"
      aria-label="Notificações"
      tabIndex={-1}
      className="fixed z-[70] inset-x-3 top-16 lg:inset-x-auto lg:left-[16.75rem] lg:top-4 lg:w-[400px] max-h-[75vh] flex flex-col bg-card border border-line rounded-card shadow-card-lg focus:outline-none motion-safe:animate-dialog-in"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
        <h2 className="font-semibold text-ink">Notificações</h2>
        <div className="flex items-center gap-1">
          <button onClick={marcarTodas} disabled={!lista.some(n => !n.lida)}
            className="text-xs font-semibold text-brand-fg hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1 px-2 py-1">
            <Check size={14} aria-hidden="true" /> Marcar todas como lidas
          </button>
          <button onClick={fechar} aria-label="Fechar notificações" className="p-1.5 rounded hover:bg-surface text-muted">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="overflow-y-auto" aria-live="polite">
        {carregando && lista.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted" role="status">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Carregando notificações...
          </p>
        ) : erro ? (
          <div className="p-4 text-sm" role="alert">
            <p className="font-semibold text-danger">Não foi possível carregar as notificações.</p>
            <p className="text-muted mt-1">{erro}</p>
            <button onClick={carregarLista} className="mt-2 text-brand-fg font-semibold hover:underline">Tentar novamente</button>
          </div>
        ) : lista.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Você não tem notificações.</p>
        ) : (
          <ul className="divide-y divide-line">
            {lista.map(n => (
              <li key={n.id}>
                <button onClick={() => abrirNotificacao(n)}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface focus:bg-surface focus:outline-none ${n.lida ? 'opacity-70' : ''}`}>
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.lida ? 'bg-transparent' : n.tipo === 'REDISTRIBUICAO_PENDENTE' ? 'bg-warning' : 'bg-brand'}`} aria-hidden="true" />
                  <span className="flex-1 min-w-0">
                    {n.titulo && <span className="block text-sm font-semibold text-ink">{n.titulo}</span>}
                    <span className="block text-sm text-muted">{n.mensagem}</span>
                    <span className="block text-xs text-muted mt-1">
                      {formatDistanceToNow(new Date(n.dataCriacao), { addSuffix: true, locale: ptBR })}
                      {n.lida ? ' • lida' : <span className="sr-only"> • não lida</span>}
                      {n.link && <span className="text-brand-fg font-semibold"> • Abrir</span>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button onClick={abrir} aria-label={rotulo} aria-expanded={aberto} aria-haspopup="dialog" title="Notificações"
        className="relative p-2 rounded-btn text-sidebar-fg hover:bg-white/10 hover:text-white">
        <Bell size={20} aria-hidden="true" />
        {badge}
      </button>
      {montado && createPortal(
        <>
          {!ocultarGatilhoMovel && (
            <button onClick={abrir} aria-label={rotulo} aria-expanded={aberto} aria-haspopup="dialog"
              className="fixed top-4 left-[4.25rem] z-50 p-2 bg-card border border-line rounded-btn shadow-card lg:hidden hover:bg-surface text-brand-fg">
              <Bell size={24} aria-hidden="true" />
              {badge}
            </button>
          )}
          {painel}
        </>,
        document.body,
      )}
    </>
  );
}
