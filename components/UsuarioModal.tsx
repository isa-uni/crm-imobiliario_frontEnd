'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Papel, Usuario, UsuarioPayload } from '@/types';
import { X } from 'lucide-react';
import InputMask from 'react-input-mask';
import { formatarTelefoneInput } from '@/lib/format';
import { Campo, inputBase } from '@/components/ui/Campo';
import { useValidacao, classeErro } from '@/hooks/useValidacao';
import {
  campo, mascaraTelefone, problemaCpf, problemaDataNascimento, problemaEmail, problemaNome, problemaTelefone,
  type Regras,
} from '@/lib/validacao';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: UsuarioPayload) => Promise<boolean>;
  editingUsuario?: Usuario | null;
  papeis: Papel[];
  /** erros devolvidos pelo backend: por campo ou { geral } */
  errors?: any;
  usuarios?: Usuario[];
}

type FormUsuario = {
  nome: string; email: string; cpf: string; genero: string; telefone: string;
  dataNascimento: string; papelId: string; gestorId: string;
};

const VAZIO: FormUsuario = { nome: '', email: '', cpf: '', genero: 'M', telefone: '', dataNascimento: '', papelId: '', gestorId: '' };

export default function UsuarioModal({
  isOpen,
  onClose,
  onSave,
  editingUsuario,
  papeis,
  errors,
  usuarios = [],
}: UsuarioModalProps) {
  const [formData, setFormData] = useState<FormUsuario>(VAZIO);
  const [loading, setLoading] = useState(false);

  // mesmas regras e mensagens do backend (UsuarioDTO); o CPF só é validado no cadastro (não é editável)
  const regras = useMemo<Regras<FormUsuario>>(() => ({
    nome: campo('Informe o nome do usuário.', problemaNome),
    email: campo('Informe o e-mail do usuário.', problemaEmail),
    ...(editingUsuario ? {} : { cpf: campo('Informe o CPF do usuário.', problemaCpf) }),
    genero: campo('Selecione o gênero.'),
    telefone: campo('Informe o telefone do usuário.', problemaTelefone),
    dataNascimento: campo('Informe a data de nascimento.', problemaDataNascimento),
    papelId: campo('Selecione o papel do usuário.'),
  }), [editingUsuario]);
  const v = useValidacao<FormUsuario>(regras);

  useEffect(() => {
    if (!isOpen) return;
    v.limpar();
    if (editingUsuario) {
      setFormData({
        nome: editingUsuario.nome,
        email: editingUsuario.email,
        cpf: editingUsuario.cpf,
        genero: editingUsuario.genero || 'M',
        telefone: formatarTelefoneInput(editingUsuario.telefone),
        dataNascimento: editingUsuario.dataNascimento || '',
        papelId: String(papeis.find((p) => p.papel === editingUsuario.papel)?.id ?? ''),
        gestorId: (editingUsuario as any).gestorId ? String((editingUsuario as any).gestorId) : '',
      });
    } else {
      setFormData({ ...VAZIO, papelId: papeis.length > 0 ? String(papeis[0].id) : '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingUsuario, papeis]);

  // erros de campo vindos do backend (ex.: "Já existe um usuário cadastrado com este CPF.") vão para o campo
  useEffect(() => {
    if (!errors) return;
    const { geral, ...campos } = errors;
    v.aplicarErrosServidor(campos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  if (!isOpen) return null;

  const alterar = (nome: keyof FormUsuario, valor: string) => {
    const novo = { ...formData, [nome]: valor };
    setFormData(novo);
    v.aoAlterar(nome, novo);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // antes: o navegador mostrava o aviso só do 1º campo vazio, e CPF/telefone inválidos não tinham aviso
    if (!v.validarTudo(formData)) return;
    setLoading(true);

    const payload: UsuarioPayload = {
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      cpf: formData.cpf,
      genero: formData.genero,
      telefone: formData.telefone,
      dataNascimento: formData.dataNascimento,
      papelId: Number(formData.papelId),
      gestorId: formData.gestorId ? Number(formData.gestorId) : null,
    };

    const sucesso = await onSave(payload);
    setLoading(false);
    if (sucesso) onClose();
  };

  const cls = (nome: string) => `${inputBase} ${classeErro(!!v.erros[nome])}`;
  const qtdErros = Object.keys(v.erros).length;

  return (
    <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="usuario-modal-titulo" className="bg-card max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-card shadow-card-lg">
        <div className="flex justify-between items-center p-6 border-b border-line">
          <h2 id="usuario-modal-titulo" className="text-xl font-bold text-ink">
            {editingUsuario ? 'Editar usuário' : 'Novo usuário'}
          </h2>
          <button onClick={onClose} aria-label="Fechar" className="p-2 rounded-lg hover:bg-surface">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form ref={v.formRef as any} onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {errors?.geral && (
            <div role="alert" className="bg-danger-bg border border-danger-border px-4 py-3 text-sm text-danger rounded-btn">
              <p className="font-semibold">{editingUsuario ? 'Não foi possível salvar as alterações.' : 'Não foi possível cadastrar o usuário.'}</p>
              <p className="mt-0.5">{errors.geral}</p>
            </div>
          )}
          {qtdErros > 1 && (
            <p role="alert" className="text-sm text-danger">Preencha os {qtdErros} campos destacados antes de continuar.</p>
          )}
          {!editingUsuario && (
            <div className="bg-info-bg border border-info-border px-4 py-3 text-sm text-info rounded-btn">
              O sistema gera uma <strong>senha temporária aleatória</strong>, exibida uma única vez após o
              cadastro. O usuário deverá trocá-la no primeiro acesso.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo nome="nome" rotulo="Nome" obrigatorio erro={v.erros.nome}>
              <input id="nome" type="text" autoComplete="name" maxLength={255} value={formData.nome}
                onChange={(e) => alterar('nome', e.target.value)} {...v.ligar('nome', formData)}
                className={cls('nome')} placeholder="João Silva" />
            </Campo>

            <Campo nome="email" rotulo="E-mail" obrigatorio erro={v.erros.email}>
              <input id="email" type="email" autoComplete="email" maxLength={255} value={formData.email}
                onChange={(e) => alterar('email', e.target.value)} {...v.ligar('email', formData)}
                className={cls('email')} placeholder="joao@empresa.com" />
            </Campo>

            {!editingUsuario ? (
              <Campo nome="cpf" rotulo="CPF" obrigatorio erro={v.erros.cpf}>
                <InputMask mask="999.999.999-99" value={formData.cpf} onChange={(e) => alterar('cpf', e.target.value)}
                  onBlur={v.ligar('cpf', formData).onBlur}>
                  {(inputProps: any) => (
                    <input {...inputProps} id="cpf" name="cpf" type="text" inputMode="numeric"
                      aria-invalid={!!v.erros.cpf || undefined} aria-describedby={v.erros.cpf ? 'cpf-erro' : undefined}
                      className={cls('cpf')} placeholder="000.000.000-00" />
                  )}
                </InputMask>
              </Campo>
            ) : (
              <Campo nome="cpf" rotulo="CPF" ajuda="O CPF não pode ser alterado depois do cadastro.">
                <input id="cpf" type="text" value={formData.cpf} disabled className={`${inputBase} border-line bg-surface`} />
              </Campo>
            )}

            <Campo nome="genero" rotulo="Gênero" obrigatorio erro={v.erros.genero}>
              <select id="genero" value={formData.genero} onChange={(e) => alterar('genero', e.target.value)}
                {...v.ligar('genero', formData)} className={cls('genero')}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </Campo>

            <Campo nome="telefone" rotulo="Telefone" obrigatorio erro={v.erros.telefone}>
              <InputMask mask={mascaraTelefone(formData.telefone)} value={formData.telefone}
                onChange={(e) => alterar('telefone', e.target.value)} onBlur={v.ligar('telefone', formData).onBlur}>
                {(inputProps: any) => (
                  <input {...inputProps} id="telefone" name="telefone" type="tel" autoComplete="tel"
                    aria-invalid={!!v.erros.telefone || undefined} aria-describedby={v.erros.telefone ? 'telefone-erro' : undefined}
                    className={cls('telefone')} placeholder="(43) 99999-9999" />
                )}
              </InputMask>
            </Campo>

            <Campo nome="dataNascimento" rotulo="Data de nascimento" obrigatorio erro={v.erros.dataNascimento}>
              <input id="dataNascimento" type="date" min="1900-01-01" value={formData.dataNascimento}
                onChange={(e) => alterar('dataNascimento', e.target.value)} {...v.ligar('dataNascimento', formData)}
                className={cls('dataNascimento')} />
            </Campo>

            <Campo nome="papelId" rotulo="Papel" obrigatorio erro={v.erros.papelId}>
              <select id="papelId" value={formData.papelId} onChange={(e) => alterar('papelId', e.target.value)}
                {...v.ligar('papelId', formData)} className={cls('papelId')}>
                <option value="">Selecione o papel</option>
                {papeis.map((p) => <option key={p.id} value={p.id}>{p.papel}</option>)}
              </select>
            </Campo>

            <Campo nome="gestorId" rotulo="Gestor responsável" erro={v.erros.gestorId}
              ajuda="Selecione o gestor deste corretor para aparecer no Dashboard do Gestor.">
              <select id="gestorId" name="gestorId" value={formData.gestorId} onChange={(e) => alterar('gestorId', e.target.value)}
                className={cls('gestorId')}>
                <option value="">Sem gestor (equipe sem vínculo)</option>
                {usuarios.filter(u => u.papel === 'gestor' || u.papel === 'admin').map(g => (
                  <option key={g.id} value={g.id}>{g.nome} ({g.papel})</option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted hover:bg-surface transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover disabled:opacity-60 transition-colors">
              {loading ? (editingUsuario ? 'Salvando alterações...' : 'Cadastrando usuário...') : editingUsuario ? 'Salvar alterações' : 'Adicionar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
