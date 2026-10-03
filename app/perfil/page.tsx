'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Hash, Shield, Cake, Loader2, KeyRound, CheckCircle } from 'lucide-react';
import InputMask from 'react-input-mask';
import { authService } from '@/service/authService';
import { usuarioService } from '@/service/usuarioService';
import type { Usuario } from '@/types';
import { ThemeSelector } from '@/components/ui/ThemeToggle';
import { formatarTelefoneInput } from '@/lib/format';
import { parseApiError } from '@/lib/errorHandler';
import { textoDoErro } from '@/lib/feedback';
import { InlineError } from '@/components/ui/ErrorState';
import { useValidacao, classeErro } from '@/hooks/useValidacao';
import { campo, mascaraTelefone, problemaDataNascimento, problemaEmail, problemaNome, problemaTelefone, somenteDigitos, type Regras } from '@/lib/validacao';

type FormPerfil = { nome: string; email: string; genero: string; telefone: string; dataNascimento: string };


const inputClass = 'w-full p-2.5 border rounded-btn focus:outline-none focus:ring-4';

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormPerfil>({
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
  // mesmas regras e mensagens do backend (PerfilDTO)
  const regras = useMemo<Regras<FormPerfil>>(() => ({
    nome: campo('Informe o seu nome.', problemaNome),
    email: campo('Informe o seu e-mail.', problemaEmail),
    genero: campo('Selecione o gênero.'),
    telefone: campo('Informe o seu telefone.', problemaTelefone),
    dataNascimento: campo('Informe a data de nascimento.', problemaDataNascimento),
  }), []);
  const v = useValidacao<FormPerfil>(regras);
  const alterar = (nome: keyof FormPerfil, valor: string) => {
    const novo = { ...form, [nome]: valor };
    setForm(novo);
    setSuccess(false);
    v.aoAlterar(nome, novo);
  };
  const cls = (nome: string, extra = '') => `${inputClass} ${classeErro(!!v.erros[nome])} ${extra}`;

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
        telefone: formatarTelefoneInput(me.telefone),
        dataNascimento: me.dataNascimento || '',
      });
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.replace('/login');
      } else {
        setError(`Não foi possível carregar seus dados. ${textoDoErro(parseApiError(err))}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // antes: um único aviso no topo, um campo por vez; agora todos os campos com problema ficam destacados
    if (!v.validarTudo(form)) return;
    const telefoneDigitos = somenteDigitos(form.telefone);

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
      // motivo real vindo do backend (ex.: "Já existe um usuário cadastrado com este e-mail.")
      const p = parseApiError(err);
      if (p.fields && Object.keys(p.fields).length) v.aplicarErrosServidor(p.fields);
      else setError(`Não foi possível salvar seus dados. ${textoDoErro(p)}`);
    } finally {
      setSaving(false);
    }
  };

  const generoLabel = (g: string) =>
    g === 'F' ? 'Feminino' : g === 'O' ? 'Outro' : 'Masculino';

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-sidebar border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-on-accent shadow-btn">
              <User size={26} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Meu Perfil</h1>
              <p className="text-sidebar-fg/80 text-sm">Gerencie seus dados pessoais</p>
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
              <div className="bg-card border border-line rounded-card shadow-card p-6">
                <h2 className="text-lg font-semibold text-ink mb-4">Informações da conta</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-brand-soft text-brand-fg flex items-center justify-center">
                      <Hash size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">Matrícula</p>
                      <p className="font-semibold text-ink">{user.matricula}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-accent-soft text-accent-hover flex items-center justify-center">
                      <Shield size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">Papel</p>
                      <p className="font-semibold text-ink capitalize">{user.papel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-brand-soft text-brand-fg flex items-center justify-center">
                      <Hash size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">CPF</p>
                      <p className="font-semibold text-ink">{user.cpf}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-brand-soft text-brand-fg flex items-center justify-center">
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
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-line rounded-btn text-muted hover:bg-surface hover:text-brand-fg transition-colors"
                  >
                    <KeyRound size={18} />
                    Alterar senha
                  </button>
                </div>
              </div>
            )}

            {/* Formulário de dados pessoais */}
            <form
              ref={v.formRef as any}
              onSubmit={handleSubmit}
              className="bg-card border border-line rounded-card shadow-card p-6"
              noValidate
            >
              <h2 className="text-lg font-semibold text-ink mb-1">Dados pessoais</h2>
              <p className="text-sm text-muted mb-5">Atualize as suas informações pessoais.</p>

              {error && (
                <div
                  role="alert"
                  className="bg-danger-bg border border-danger-border px-4 py-3 text-sm text-danger rounded-btn mb-5"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="bg-success-bg border border-success-border px-4 py-3 text-sm text-success rounded-btn mb-5 flex items-center gap-2"
                >
                  <CheckCircle size={18} aria-hidden="true" />
                  Seus dados foram atualizados com sucesso.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="nome" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Nome <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="nome"
                      type="text"
                      autoComplete="name"
                      maxLength={255}
                      value={form.nome}
                      onChange={(e) => alterar('nome', e.target.value)}
                      {...v.ligar('nome', form)}
                      className={cls('nome', 'pl-10')}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <InlineError id="nome-erro" message={v.erros.nome} />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    E-mail <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      maxLength={255}
                      value={form.email}
                      onChange={(e) => alterar('email', e.target.value)}
                      {...v.ligar('email', form)}
                      className={cls('email', 'pl-10')}
                      placeholder="voce@empresa.com"
                    />
                  </div>
                  <InlineError id="email-erro" message={v.erros.email} />
                </div>

                <div>
                  <label htmlFor="genero" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Gênero <span className="text-danger">*</span>
                  </label>
                  <select
                    id="genero"
                    value={form.genero}
                    onChange={(e) => alterar('genero', e.target.value)}
                    {...v.ligar('genero', form)}
                    className={cls('genero')}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </select>
                  <InlineError id="genero-erro" message={v.erros.genero} />
                </div>

                <div>
                  <label htmlFor="telefone" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Telefone <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <InputMask
                      mask={mascaraTelefone(form.telefone)}
                      value={form.telefone}
                      onChange={(e) => alterar('telefone', e.target.value)}
                      onBlur={v.ligar('telefone', form).onBlur}
                    >
                      {(inputProps: any) => (
                        <input
                          {...inputProps}
                          id="telefone"
                          name="telefone"
                          type="tel"
                          autoComplete="tel"
                          aria-invalid={!!v.erros.telefone || undefined}
                          aria-describedby={v.erros.telefone ? 'telefone-erro' : undefined}
                          className={cls('telefone', 'pl-10')}
                          placeholder="(43) 99999-9999"
                        />
                      )}
                    </InputMask>
                  </div>
                  <InlineError id="telefone-erro" message={v.erros.telefone} />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="dataNascimento" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Data de nascimento <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <Cake size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="dataNascimento"
                      type="date"
                      min="1900-01-01"
                      value={form.dataNascimento}
                      onChange={(e) => alterar('dataNascimento', e.target.value)}
                      {...v.ligar('dataNascimento', form)}
                      className={cls('dataNascimento', 'pl-10')}
                    />
                  </div>
                  <InlineError id="dataNascimento-erro" message={v.erros.dataNascimento} />
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
                  className="px-5 py-2.5 flex items-center justify-center gap-2 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover disabled:opacity-60 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Salvando dados...
                    </>
                  ) : (
                    'Salvar alterações'
                  )}
                </button>
              </div>
            </form>

            <div className="bg-card border border-line rounded-card shadow-card p-6">
              <h2 className="text-lg font-semibold text-ink">Aparência</h2>
              <p className="text-sm text-muted mt-1 mb-4">Escolha o tema do CRM. A preferência fica salva neste navegador.</p>
              <ThemeSelector />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
