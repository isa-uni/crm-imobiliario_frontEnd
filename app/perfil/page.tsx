'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Hash, Shield, Cake, Loader2, KeyRound, CheckCircle, ChevronLeft } from 'lucide-react';
import InputMask from 'react-input-mask';
import { authService } from '@/service/authService';
import { usuarioService } from '@/service/usuarioService';
import type { Usuario } from '@/types';

const formatarTelefone = (telefone: string) => {
  return (telefone || '')
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

const inputClass =
  'w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10';

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    genero: 'M',
    telefone: '',
    dataNascimento: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [campoErro, setCampoErro] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
    carregarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const carregarPerfil = async () => {
    try {
      const me = await usuarioService.getMe();
      setUser(me);
      setForm({
        nome: me.nome || '',
        email: me.email || '',
        genero: me.genero || 'M',
        telefone: formatarTelefone(me.telefone),
        dataNascimento: me.dataNascimento || '',
      });
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.replace('/login');
      } else {
        setError('Não foi possível carregar seus dados. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setCampoErro(null);

    if (!form.nome.trim()) {
      setCampoErro('nome');
      setError('Informe o nome.');
      return;
    }
    if (!form.email.trim()) {
      setCampoErro('email');
      setError('Informe o e-mail.');
      return;
    }
    if (!form.telefone.trim()) {
      setCampoErro('telefone');
      setError('Informe o telefone.');
      return;
    }

    const telefoneDigitos = form.telefone.replace(/\D/g, '');
    if (telefoneDigitos.length < 10 || telefoneDigitos.length > 11) {
      setCampoErro('telefone');
      setError('Informe um telefone completo (DDD + número, 10 ou 11 dígitos).');
      return;
    }
    if (!form.dataNascimento) {
      setCampoErro('dataNascimento');
      setError('Informe a data de nascimento.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        genero: form.genero,
        telefone: telefoneDigitos,
        dataNascimento: form.dataNascimento,
      };
      const atualizado = await usuarioService.atualizarMe(payload);
      setUser(atualizado);
      authService.atualizarUsuarioLocal({ nome: atualizado.nome, email: atualizado.email });
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Sua sessão expirou. Faça login novamente.');
      } else if (typeof err.response?.data === 'string') {
        setError(err.response.data);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.errors?.length) {
        setError(err.response.data.errors.map((x: any) => x.message).join('. '));
      } else {
        setError('Não foi possível salvar. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const generoLabel = (g: string) =>
    g === 'F' ? 'Feminino' : g === 'O' ? 'Outro' : 'Masculino';

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-primary border-b border-primary-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          {/* <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1.5 text-primary-100/80 hover:text-white mb-3 text-sm transition-colors"
          >
            <ChevronLeft size={18} />
            Voltar ao painel
          </button> */}
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-primary shadow-btn">
              <User size={26} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Meu Perfil</h1>
              <p className="text-primary-100/80 text-sm">Gerencie seus dados pessoais</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted">
            <Loader2 size={28} className="animate-spin mr-3" />
            Carregando perfil...
          </div>
        ) : (
          <>
            {/* Resumo / informações fixas */}
            {user && (
              <div className="bg-white border border-line rounded-card shadow-card p-6">
                <h2 className="text-lg font-semibold text-ink mb-4">Informações da conta</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                      <Hash size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">Matrícula</p>
                      <p className="font-semibold text-ink">{user.matricula}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center">
                      <Shield size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">Papel</p>
                      <p className="font-semibold text-ink capitalize">{user.papel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                      <Hash size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">CPF</p>
                      <p className="font-semibold text-ink">{user.cpf}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                      <Shield size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">Gênero</p>
                      <p className="font-semibold text-ink">{generoLabel(user.genero)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-line">
                  <button
                    type="button"
                    onClick={() => router.push('/trocar-senha')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-line rounded-btn text-muted hover:bg-surface hover:text-primary transition-colors"
                  >
                    <KeyRound size={18} />
                    Alterar senha
                  </button>
                </div>
              </div>
            )}

            {/* Formulário de dados pessoais */}
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-line rounded-card shadow-card p-6"
              noValidate
            >
              <h2 className="text-lg font-semibold text-ink mb-1">Dados pessoais</h2>
              <p className="text-sm text-muted mb-5">Atualize as suas informações pessoais.</p>

              {error && (
                <div
                  role="alert"
                  className="bg-[#fdeceb] border border-[#f2cdc9] px-4 py-3 text-sm text-[#c0392b] rounded-btn mb-5"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="bg-[#e8f6ee] border border-[#bfe3cd] px-4 py-3 text-sm text-[#0f8a52] rounded-btn mb-5 flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Dados atualizados com sucesso!
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => {
                        setForm({ ...form, nome: e.target.value });
                        setSuccess(false);
                      }}
                      className={`${inputClass} pl-10`}
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        setSuccess(false);
                      }}
                      className={`${inputClass} pl-10`}
                      placeholder="voce@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Gênero <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.genero}
                    onChange={(e) => {
                      setForm({ ...form, genero: e.target.value });
                      setSuccess(false);
                    }}
                    className={inputClass}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <InputMask
                      mask="(99) 99999-9999"
                      value={form.telefone}
                      onChange={(e) => {
                        setForm({ ...form, telefone: e.target.value });
                        setSuccess(false);
                      }}
                    >
                      {(inputProps: any) => (
                        <input
                          {...inputProps}
                          type="tel"
                          className={`${inputClass} pl-10`}
                          placeholder="(11) 98765-4321"
                        />
                      )}
                    </InputMask>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Data de nascimento <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Cake size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="date"
                      value={form.dataNascimento}
                      onChange={(e) => {
                        setForm({ ...form, dataNascimento: e.target.value });
                        setSuccess(false);
                      }}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-5 py-2.5 border border-line rounded-btn text-muted hover:bg-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 flex items-center justify-center gap-2 bg-primary text-white rounded-btn font-semibold shadow-btn hover:bg-primary-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar alterações'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
