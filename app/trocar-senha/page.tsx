'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Building2, Loader2 } from 'lucide-react';
import { authService } from '@/service/authService';
import { usuarioService } from '@/service/usuarioService';

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenhas, setShowSenhas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [obrigatorio, setObrigatorio] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setObrigatorio(authService.trocarSenhaObrigatoria());
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senhaAtual || !novaSenha || !confirmar) {
      setError('Preencha todos os campos para continuar.');
      return;
    }

    if (novaSenha.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres (com maiúscula, minúscula, número e caractere especial).');
      return;
    }

    if (novaSenha !== confirmar) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }

    setLoading(true);
    try {
      await usuarioService.trocarMinhaSenha(senhaAtual, novaSenha);
      // Sensível: backend incrementou tokenVersion, revogou refresh e limpou cookies (Path=/auth/refresh)
      // Exige nova autenticação - limpar sessão local e forçar login
      authService.logoutLocal();
      router.replace('/login?reason=senha');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Sua sessão expirou. Faça login novamente.');
      } else if (err.response?.data && typeof err.response.data === 'string') {
        setError(err.response.data);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Não foi possível alterar a senha. Tente novamente.');
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

          <h2 className="text-2xl font-bold text-ink mb-1.5">Alterar senha</h2>
          <p className="text-muted mb-6">
            {obrigatorio
              ? 'Por segurança, defina uma nova senha antes de continuar.'
              : 'Defina uma nova senha para a sua conta.'}
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="senhaAtual" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Senha atual
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="senhaAtual"
                  type={showSenhas ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full pl-10 pr-3 py-2.5 border border-line rounded-btn bg-card text-ink placeholder:text-muted/50 focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="novaSenha" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Nova senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="novaSenha"
                  type={showSenhas ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full pl-10 pr-3 py-2.5 border border-line rounded-btn bg-card text-ink placeholder:text-muted/50 focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmar" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="confirmar"
                  type={showSenhas ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-10 py-2.5 border border-line rounded-btn bg-card text-ink placeholder:text-muted/50 focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhas(!showSenhas)}
                  aria-label={showSenhas ? 'Ocultar senhas' : 'Mostrar senhas'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  {showSenhas ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-danger-bg border border-danger-border px-4 py-3 text-sm text-danger rounded-btn"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand text-on-brand py-2.5 rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar nova senha'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted text-center">
            A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número ou especial.
          </p>
        </div>
      </div>
    </div>
  );
}