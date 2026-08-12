'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Building2, Loader2, KeyRound, ShieldCheck, TrendingUp } from 'lucide-react';
import { authService } from '@/service/authService';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace(authService.trocarSenhaObrigatoria() ? '/trocar-senha' : '/dashboard');
    }
  }, [router]);

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
      authService.salvarSessao(response);
      router.push(response.usuario.trocarSenha ? '/trocar-senha' : '/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('E-mail ou senha incorretos. Verifique e tente novamente.');
      } else if (err.response?.status === 403) {
        setError('Acesso não permitido. Fale com o administrador.');
      } else {
        setError('Não foi possível entrar agora. Tente novamente em instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Painel de marca */}
      <aside className="hidden lg:flex lg:w-[46%] bg-[#0E1E3A] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Padrão de loteamento */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">CRM Imóveis</p>
              <p className="text-xs text-blue-200/70 tracking-wide">GESTÃO PARA CORRETORES</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-200 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <KeyRound size={14} />
              Acesso exclusivo da equipe
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Suas vendas, da
            <br />
            visita ao contrato,
            <br />
            <span className="text-blue-400">em um só lugar.</span>
          </h1>
          <p className="text-blue-100/70 text-lg max-w-md leading-relaxed">
            Organize leads, acompanhe imóveis e feche mais negócios com a gestão completa da sua corretora.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-blue-400" />
            <div>
              <p className="text-sm font-semibold">Funil de vendas</p>
              <p className="text-xs text-blue-200/60">etapas claras</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-blue-400" />
            <div>
              <p className="text-sm font-semibold">Acesso seguro</p>
              <p className="text-xs text-blue-200/60">dados protegidos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-blue-400" />
            <div>
              <p className="text-sm font-semibold">Imóveis</p>
              <p className="text-xs text-blue-200/60">sempre atualizados</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Marca (mobile) */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">CRM Imóveis</p>
              <p className="text-xs text-gray-500 tracking-wide">GESTÃO PARA CORRETORES</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Acesse sua conta</h2>
          <p className="text-gray-600 mb-8">
            Informe seu e-mail e senha para continuar no sistema.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="senha"
                  type={showSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-600/25 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

          <p className="mt-8 text-sm text-gray-500 text-center">
            Problemas para acessar? Fale com o administrador do sistema.
          </p>
        </div>
      </main>
    </div>
  );
}
