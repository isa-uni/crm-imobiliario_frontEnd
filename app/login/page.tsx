'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Building2, Loader2, Clock, CheckCircle, UserX } from 'lucide-react';
import { authService } from '@/service/authService';
import { parseApiError } from '@/lib/errorHandler';
import { textoDoErro } from '@/lib/feedback';
import { problemaEmail } from '@/lib/validacao';

const AVISOS_LOGIN: Record<string, { tipo: 'sucesso' | 'aviso'; texto: string }> = {
  inactivity: { tipo: 'aviso', texto: 'Sua sessão foi encerrada após 30 minutos sem atividade. Faça login para continuar.' },
  expired: { tipo: 'aviso', texto: 'Sua sessão expirou. Faça login para continuar.' },
  senha: { tipo: 'sucesso', texto: 'Senha alterada com sucesso. Entre com a nova senha.' },
  logout: { tipo: 'sucesso', texto: 'Você saiu do sistema.' },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  // usuário inativado tem um aviso próprio: não é erro de digitação, e tentar de novo não resolve
  const [inativado, setInativado] = useState<string | null>(null);
  const reason = searchParams.get('reason');
  // aviso sobre COMO o usuário chegou ao login (não é erro do formulário — por isso fica separado)
  const aviso = AVISOS_LOGIN[reason ?? ''];

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace(authService.trocarSenhaObrigatoria() ? '/trocar-senha' : '/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (retryAfter == null || retryAfter <= 0) return;
    const id = setInterval(() => {
      setRetryAfter(prev => {
        if (prev == null || prev <= 1) {
          clearInterval(id);
          setError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInativado(null);

    if (!email.trim() || !senha) {
      setError(!email.trim() && !senha ? 'Informe seu e-mail e sua senha.' : !email.trim() ? 'Informe seu e-mail.' : 'Informe sua senha.');
      document.getElementById(!email.trim() ? 'email' : 'senha')?.focus();
      return;
    }
    // e-mail mal digitado é avisado aqui, sem gastar uma das tentativas de login
    const problema = problemaEmail(email);
    if (problema) {
      setError(problema);
      document.getElementById('email')?.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(email.trim(), senha);
      authService.salvarSessao(response);
      router.push(response.usuario.trocarSenha ? '/trocar-senha' : '/dashboard');
    } catch (err: any) {
      // usa o motivo enviado pelo backend: senha errada e usuário desativado são casos diferentes
      // (antes todo 401 virava "E-mail ou senha incorretos", escondendo o usuário desativado)
      const p = parseApiError(err);
      if (p.code === 'AUTH_USER_DISABLED') {
        setInativado(p.message);
        setSenha('');
        return;
      }
      setError(textoDoErro(p));
      if (p.tipo === 'muitas_tentativas') {
        const headerRetry = err.response?.headers?.['retry-after'];
        const retry = p.details?.retryAfter ?? (headerRetry ? parseInt(headerRetry, 10) : null) ?? 300;
        setRetryAfter(Number.isFinite(retry) ? retry : 300);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-card shadow-card-lg p-8">
          <div className="flex items-center gap-3 mb-7">
            <span className="w-11 h-11 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-on-accent shadow-btn">
              <Building2 size={24} />
            </span>
            <div>
              <p className="text-lg font-extrabold text-brand-fg leading-tight tracking-tight">CRM Imóveis</p>
              <p className="text-xs text-muted">Sistema de gestão de clientes e vendas</p>
            </div>
          </div>

          {aviso && !error && !inativado && (
            <div role="status" className={`mb-4 border px-4 py-3 text-sm rounded-btn flex gap-2 items-start ${aviso.tipo === 'sucesso' ? 'bg-success-bg border-success-border text-success' : 'bg-warning-bg border-warning-border text-warning'}`}>
              {aviso.tipo === 'sucesso' ? <CheckCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> : <Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />}
              <span>{aviso.texto}</span>
            </div>
          )}
          <h2 className="text-2xl font-bold text-ink mb-1.5">Acesse sua conta</h2>
          <p className="text-muted mb-6">
            Informe seu e-mail e senha para entrar no sistema.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setInativado(null); }}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-3 py-2.5 border border-line rounded-btn bg-card text-ink placeholder:text-muted/50 focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="senha"
                  type={showSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-10 pr-10 py-2.5 border border-line rounded-btn bg-card text-ink placeholder:text-muted/50 focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {inativado && (
              <div role="alert" className="bg-warning-bg border border-warning-border px-4 py-3 text-sm text-warning rounded-btn flex gap-3 items-start">
                <UserX size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Usuário inativado</p>
                  <p className="mt-0.5 text-ink">{inativado}</p>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="bg-danger-bg border border-danger-border px-4 py-3 text-sm text-danger rounded-btn"
              >
                <p>{error}</p>
                {retryAfter != null && retryAfter > 0 && (
                  <p className="mt-1 text-xs font-semibold" aria-live="off">Você poderá tentar novamente em {Math.floor(retryAfter/60)}:{String(retryAfter%60).padStart(2,'0')}.</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (retryAfter != null && retryAfter > 0)}
              className="w-full flex items-center justify-center gap-2 bg-brand text-on-brand py-2.5 rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted text-center">
            Problemas para acessar? Fale com o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
