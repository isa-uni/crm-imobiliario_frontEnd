'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Building2, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
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
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Painel de marca */}
      <aside className="hidden lg:flex lg:w-[46%] bg-[#0E1E3A] text-white flex-col justify-between p-12 relative overflow-hidden">
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
              Segurança da sua conta
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Uma senha segura,
            <br />
            <span className="text-blue-400">protege todo o seu trabalho.</span>
          </h1>
          <p className="text-blue-100/70 text-lg max-w-md leading-relaxed">
            Mantenha seus leads, imóveis e dados da corretora protegidos com uma senha forte e pessoal.
          </p>
        </div>

        <div className="relative flex items-center gap-3">
          <ShieldCheck size={20} className="text-blue-400" />
          <div>
            <p className="text-sm font-semibold">Acesso seguro</p>
            <p className="text-xs text-blue-200/60">recomendações aplicadas pelo sistema</p>
          </div>
        </div>
      </aside>

      {/* Formulário */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">CRM Imóveis</p>
              <p className="text-xs text-gray-500 tracking-wide">GESTÃO PARA CORRETORES</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Alterar senha</h2>
          <p className="text-gray-600 mb-8">
            {obrigatorio
              ? 'Por segurança, defina uma nova senha antes de continuar.'
              : 'Defina uma nova senha para a sua conta.'}
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700 mb-2">
                Senha atual
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="senhaAtual"
                  type={showSenhas ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-2">
                Nova senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="novaSenha"
                  type={showSenhas ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmar" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmar"
                  type={showSenhas ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowSenhas(!showSenhas)}
                  aria-label={showSenhas ? 'Ocultar senhas' : 'Mostrar senhas'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showSenhas ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  Salvando...
                </>
              ) : (
                'Salvar nova senha'
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-gray-500 text-center">
            A senha deve ter no mínimo 6 caracteres.
          </p>
        </div>
      </main>
    </div>
  );
}
