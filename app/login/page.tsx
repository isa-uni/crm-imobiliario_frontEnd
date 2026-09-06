'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Building2, Loader2, Clock } from 'lucide-react';
import { authService } from '@/service/authService';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (reason === 'inactivity') setError('Sua sessão expirou por inatividade (30 min). Faça login novamente.');
    else if (reason === 'expired') setError('Sua sessão expirou. Faça login novamente.');
    else if (reason === 'logout') setError(null);
  }, [reason]);

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

    if (!email.trim() || !senha) {
      setError('Informe seu e-mail e senha para continuar.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(email.trim(), senha);
      console.log("response ", response)
      authService.salvarSessao(response);
      console.log("Chegou até aqui")
      router.push(response.usuario.trocarSenha ? '/trocar-senha' : '/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else if (err.response?.status === 403) {
        setError('Acesso não permitido. Fale com o administrador.');
      } else if (err.response?.status === 429) {
        const data = err.response?.data;
        const headerRetry = err.response?.headers?.['retry-after'] || err.response?.headers?.['Retry-After'];
        const retry = data?.retryAfter ?? (headerRetry ? parseInt(headerRetry, 10) : null) ?? 300;
        const msg = data?.message || data?.error || 'Muitas tentativas. Tente novamente em 5 minutos.';
        const isComposite = msg.includes('e-mail');
        setError(msg);
        setRetryAfter(Number.isFinite(retry) ? retry : 300);
        // dica: bloqueio é por IP:email (5) + IP (20). Outro navegador mesmo IP mas e-mail diferente não será bloqueado.
        if (!isComposite) {
          console.warn('[Login] Bloqueio por IP (20 tentativas). Aguarde.', retry);
        }
      } else {
        setError('Não foi possível entrar agora. Tente novamente em instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-800 to-primary-700 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-card shadow-card-lg p-8">
          <div className="flex items-center gap-3 mb-7">
            <span className="w-11 h-11 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-white shadow-btn">
              <Building2 size={24} className="text-primary" />
            </span>
            <div>
              <p className="text-lg font-extrabold text-primary leading-tight tracking-tight">CRM Imóveis</p>
              <p className="text-xs text-muted">Sistema de gestão de clientes e vendas</p>
            </div>
          </div>

          {(reason === 'inactivity' || reason === 'expired') && (
            <div className="mb-4 bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 rounded-btn flex gap-2 items-center">
              <Clock size={16}/> Sessão encerrada. Faça login para continuar.
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-3 py-2.5 border border-line rounded-btn bg-white text-ink placeholder:text-muted/50 focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
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
                  className="w-full pl-10 pr-10 py-2.5 border border-line rounded-btn bg-white text-ink placeholder:text-muted/50 focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
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

            {error && (
              <div
                role="alert"
                className="bg-[#fdeceb] border border-[#f2cdc9] px-4 py-3 text-sm text-[#c0392b] rounded-btn"
              >
                <p>{error}</p>
                {retryAfter != null && retryAfter > 0 && (
                  <p className="mt-1 text-xs font-semibold">Tente novamente em {Math.floor(retryAfter/60)}:{String(retryAfter%60).padStart(2,'0')} (bloqueio por e-mail: 5 tentativas / IP: 20 em 5 min). Outro navegador com e-mail diferente no mesmo IP ainda pode entrar.</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (retryAfter != null && retryAfter > 0)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-btn font-semibold shadow-btn hover:bg-primary-700 transition-colors disabled:opacity-60"
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
