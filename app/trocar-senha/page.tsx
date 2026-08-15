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

    if (novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmar) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }

    setLoading(true);
    try {
      await usuarioService.trocarMinhaSenha(senhaAtual, novaSenha);
      authService.marcarSenhaTrocada();
      router.push('/dashboard');
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

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Alterar senha</h2>
          <p className="text-gray-600 mb-6">
            {obrigatorio
              ? 'Por segurança, defina uma nova senha antes de continuar.'
              : 'Defina uma nova senha para a sua conta.'}
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="senhaAtual" className="block text-sm text-gray-700 mb-1">
                Senha atual
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="senhaAtual"
                  type={showSenhas ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="novaSenha" className="block text-sm text-gray-700 mb-1">
                Nova senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="novaSenha"
                  type={showSenhas ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmar" className="block text-sm text-gray-700 mb-1">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmar"
                  type={showSenhas ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhas(!showSenhas)}
                  aria-label={showSenhas ? 'Ocultar senhas' : 'Mostrar senhas'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showSenhas ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  Salvando...
                </>
              ) : (
                'Salvar nova senha'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            A senha deve ter no mínimo 6 caracteres.
          </p>
        </div>
      </div>
    </div>
  );
}
