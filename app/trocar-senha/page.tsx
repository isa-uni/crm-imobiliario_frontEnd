'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Building2, Loader2, Check, Circle } from 'lucide-react';
import { authService } from '@/service/authService';
import { usuarioService } from '@/service/usuarioService';
import { parseApiError } from '@/lib/errorHandler';
import { textoDoErro } from '@/lib/feedback';
import { InlineError } from '@/components/ui/ErrorState';
import { useValidacao, classeErro } from '@/hooks/useValidacao';
import { campo, problemaSenha, type Regras } from '@/lib/validacao';

type FormSenha = { senhaAtual: string; novaSenha: string; confirmar: string };

// requisitos exibidos enquanto a pessoa digita (mesma regra do backend: 8+ caracteres e 3 dos 4 tipos)
const REQUISITOS = [
  { texto: 'Pelo menos 8 caracteres', ok: (s: string) => s.length >= 8 },
  { texto: 'Letra maiúscula', ok: (s: string) => /[A-Z]/.test(s) },
  { texto: 'Letra minúscula', ok: (s: string) => /[a-z]/.test(s) },
  { texto: 'Número', ok: (s: string) => /\d/.test(s) },
  { texto: 'Caractere especial (ex.: ! @ #)', ok: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenhas, setShowSenhas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [obrigatorio, setObrigatorio] = useState(false);
  const form: FormSenha = { senhaAtual, novaSenha, confirmar };
  const regras = useMemo<Regras<FormSenha>>(() => ({
    senhaAtual: campo('Informe a sua senha atual.'),
    novaSenha: campo('Informe a nova senha.', problemaSenha),
    confirmar: (valor, f) => !valor ? 'Confirme a nova senha.'
      : valor !== f.novaSenha ? 'A confirmação está diferente da nova senha. Digite a mesma senha nos dois campos.' : null,
  }), []);
  const v = useValidacao<FormSenha>(regras);
  const alterar = (nome: keyof FormSenha, valor: string, set: (x: string) => void) => {
    set(valor);
    const novo = { ...form, [nome]: valor };
    v.aoAlterar(nome, novo);
    if (nome === 'novaSenha' && confirmar) v.aoAlterar('confirmar', novo);
  };
  const cls = (nome: string) => `w-full pl-10 pr-3 py-2.5 border rounded-btn bg-card text-ink placeholder:text-muted/50 focus:outline-none focus:ring-4 ${classeErro(!!v.erros[nome])}`;

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

    // antes só verificava o tamanho; a senha fraca só era recusada depois, pelo servidor
    if (!v.validarTudo(form)) return;

    setLoading(true);
    try {
      await usuarioService.trocarMinhaSenha(senhaAtual, novaSenha);
      // Sensível: backend incrementou tokenVersion, revogou refresh e limpou cookies (Path=/auth/refresh)
      // Exige nova autenticação - limpar sessão local e forçar login
      authService.logoutLocal();
      router.replace('/login?reason=senha');
    } catch (err: any) {
      // motivo real vindo do backend, junto ao campo: senha atual incorreta, senha fraca, etc.
      const p = parseApiError(err);
      if (p.fields && Object.keys(p.fields).length) v.aplicarErrosServidor(p.fields);
      else setError(textoDoErro(p));
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

          <form ref={v.formRef as any} onSubmit={handleSubmit} noValidate className="space-y-4">
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
                  onChange={(e) => alterar('senhaAtual', e.target.value, setSenhaAtual)}
                  {...v.ligar('senhaAtual', form)}
                  placeholder="Sua senha atual"
                  className={cls('senhaAtual')}
                />
              </div>
              <InlineError id="senhaAtual-erro" message={v.erros.senhaAtual} />
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
                  onChange={(e) => alterar('novaSenha', e.target.value, setNovaSenha)}
                  {...v.ligar('novaSenha', form)}
                  placeholder="Mínimo de 8 caracteres"
                  className={cls('novaSenha')}
                />
              </div>
              <InlineError id="novaSenha-erro" message={v.erros.novaSenha} />
              {novaSenha && (
                <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-xs" aria-label="Requisitos da nova senha">
                  {REQUISITOS.map(r => {
                    const ok = r.ok(novaSenha)
                    return (
                      <li key={r.texto} className={`flex items-center gap-1 ${ok ? 'text-success' : 'text-muted'}`}>
                        {ok ? <Check size={12} aria-hidden="true" /> : <Circle size={10} aria-hidden="true" />}
                        {r.texto}<span className="sr-only">{ok ? ': atendido' : ': pendente'}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
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
                  onChange={(e) => alterar('confirmar', e.target.value, setConfirmar)}
                  {...v.ligar('confirmar', form)}
                  placeholder="Repita a nova senha"
                  className={`${cls('confirmar')} pr-10`}
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
              <InlineError id="confirmar-erro" message={v.erros.confirmar} />
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
                  Alterando senha...
                </>
              ) : (
                'Salvar nova senha'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted text-center">
            A senha deve ter no mínimo 8 caracteres e combinar pelo menos 3 destes tipos: maiúscula, minúscula, número e caractere especial.
          </p>
        </div>
      </div>
    </div>
  );
}