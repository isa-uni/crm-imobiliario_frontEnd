'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Building2, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-300 p-8">
          <div className="flex items-center gap-2 mb-6">
            <Building2 size={24} className="text-gray-800" />
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">CRM Imóveis</p>
              <p className="text-xs text-gray-500">Sistema de gestão de clientes e vendas</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesse sua conta</h2>
          <p className="text-gray-600 mb-6">
            Informe seu e-mail e senha para entrar no sistema.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="senha"
                  type={showSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 font-semibold hover:bg-blue-700 disabled:opacity-60"
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

          <p className="mt-6 text-sm text-gray-500 text-center">
            Problemas para acessar? Fale com o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
