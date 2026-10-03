'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus } from '@/types';
import { origemOptions } from '@/service/origemOptions';
import { historicoOptions } from '@/service/historicoOptions';
import { empreendimentoIaService, EmpreendimentoCard } from '@/service/empreendimentoIaService';
import { brl, faixa, formatarTelefone } from '@/lib/format';
import { X } from 'lucide-react';
import InputMask from 'react-input-mask';
import { parseApiError } from '@/lib/errorHandler';
import { textoDoErro } from '@/lib/feedback';
import { useValidacao } from '@/hooks/useValidacao';
import { campo, lerNumeroBR, mascaraTelefone, problemaEmail, problemaNome, problemaTamanho, problemaTelefone, type Regras } from '@/lib/validacao';
import { InlineError } from '@/components/ui/ErrorState';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Omit<Lead, 'id' | 'dataCriacao' | 'dataAtualizacao'> & { limparEmpreendimento?: boolean }) => Promise<boolean>;
  editingLead?: Lead | null;
  errors?: any;
}

type LeadFormData = {
  nome: string;
  telefone: string;
  email: string;
  origem: string;
  historico: string;
  status: LeadStatus;
  valorInteresse: number;
  empreendimentoId: number | null;
  observacao: string;
  motivoDescarte: string;
};

export default function LeadModal({ isOpen, onClose, onSave, editingLead, errors, }: LeadModalProps) {
  
  const [formData, setFormData] = useState<LeadFormData>({
    nome: '',
    telefone: '',
    email: '',
    origem: '',
    historico: '',
    status: 'lead' as Lead['status'],
    valorInteresse: 0,
    empreendimentoId: null,
    observacao: '',
    motivoDescarte: '',
  });

  const [empreendimentos, setEmpreendimentos] = useState<EmpreendimentoCard[]>([]);
  const [empreendimentosError, setEmpreendimentosError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // mesmas regras e mensagens do backend (LeadsDTO / LeadAtualizacaoDTO / LeadsService)
  const regras = useMemo<Regras<LeadFormData>>(() => ({
    nome: campo('Informe o nome do lead.', problemaNome),
    telefone: campo('Informe o telefone do lead.', problemaTelefone),
    email: campo(null, problemaEmail),
    origem: campo('Selecione a origem do lead.'),
    historico: campo('Selecione o histórico do lead.'),
    valorInteresse: (v) => {
      const n = lerNumeroBR(v);
      if (n !== null && Number.isNaN(n)) return 'Informe o valor de interesse usando apenas números, por exemplo 350000.';
      return n !== null && n < 0 ? 'O valor de interesse não pode ser negativo.' : null;
    },
    observacao: (v) => problemaTamanho(v, 255, 'As observações'),
    // condicional: só existe (e só é obrigatório) quando o status é "descarte"
    motivoDescarte: (v, f) => f.status !== 'descarte' ? null
      : !String(v ?? '').trim() ? 'Informe o motivo do descarte para descartar o lead.'
      : problemaTamanho(v, 255, 'O motivo do descarte'),
  }), []);
  const v = useValidacao<LeadFormData>(regras);
  const erroDe = (c: string): string | undefined => v.erros[c];
  const borda = (c: string) => (erroDe(c) ? 'border-danger' : 'border-line');
  // ao corrigir, o aviso some; ao sair do campo, a regra é verificada de novo
  const limparErro = (c: string) => v.setErros(({ [c]: _, ...resto }) => resto);
  const blur = (c: keyof LeadFormData) => v.ligar(c, formData).onBlur;


  useEffect(() => {
    if (editingLead) {
      setFormData({
        nome: editingLead.nome,
        telefone: formatarTelefone(editingLead.telefone),
        email: editingLead.email,
        origem: editingLead.origem,
        historico: editingLead.historico,
        status: editingLead.status,
        valorInteresse: editingLead.valorInteresse,
        empreendimentoId: editingLead.empreendimentoId ?? null,
        observacao: editingLead.observacao || '',
        motivoDescarte: editingLead.motivoDescarte || '',
      });
    } else {
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        origem: '',
        historico: '',
        status: 'lead',
        valorInteresse: 0,
        empreendimentoId: null,
        observacao: '',
        motivoDescarte: '',
      });
    }
    v.limpar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingLead, isOpen]);

  // erros de campo devolvidos pelo backend aparecem junto ao campo correspondente
  useEffect(() => {
    if (!errors) return;
    const { geral, ...campos } = errors;
    v.aplicarErrosServidor(campos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

  useEffect(() => {
  const carregarEmpreendimentos = async () => {
    try {
      const data = await empreendimentoIaService.listarCards({ size: 100, sort: 'nome,asc' });
      setEmpreendimentos(data?.content ?? []);
      setEmpreendimentosError(null);
    } catch (error: any) {
      // erro secundário: o lead pode ser salvo sem empreendimento, então o aviso fica junto ao campo
      // (antes aparecia também um toast, duplicando a mensagem)
      setEmpreendimentosError(`Não foi possível carregar a lista de empreendimentos. ${textoDoErro(parseApiError(error))} Você pode salvar o lead sem empreendimento e vinculá-lo depois.`);
    }
  };

  if (isOpen) {
    carregarEmpreendimentos();
  }
}, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // valida tudo, destaca cada campo com problema e leva o foco ao primeiro
    if (!v.validarTudo(formData)) return;

    setLoading(true);

    // marca a intenção explícita de remover o empreendimento vinculado quando o campo é deixado em
    // branco — sem isso, o backend não teria como distinguir "não mudei este campo" de "quero limpar"
    const sucesso = await onSave({ ...formData, limparEmpreendimento: formData.empreendimentoId === null });

    setLoading(false);

    if (sucesso) {
      onClose();
    }
  };

  const handleEmpreendimentoSelect = (empreendimentoId: number | null) => {
    if (!empreendimentoId) {
      setFormData({
        ...formData,
        empreendimentoId: null,
      });
      return;
    }

    const empreendimento = empreendimentos.find(e => e.id === empreendimentoId);

    if (empreendimento) {
      setFormData({
        ...formData,
        empreendimentoId,
        valorInteresse: empreendimento.precoMin ?? formData.valorInteresse,
      });
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-card shadow-card-lg">
        <div className="flex justify-between items-center p-6 border-b border-line">
          <h2 className="text-xl font-bold text-ink">
            {editingLead ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg hover:bg-surface"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form ref={v.formRef as any} onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {errors?.geral && (
            <div role="alert" className="bg-danger-bg border border-danger-border px-4 py-3 text-sm text-danger rounded-btn">
              <p className="font-semibold">{editingLead ? 'Não foi possível salvar as alterações do lead.' : 'Não foi possível cadastrar o lead.'}</p>
              <p className="mt-0.5">{errors.geral}</p>
            </div>
          )}
          {Object.keys(v.erros).length > 1 && (
            <p role="alert" className="text-sm text-danger">Preencha os {Object.keys(v.erros).length} campos destacados antes de continuar.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Nome <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                aria-label="Nome"
                aria-invalid={!!erroDe('nome')}
                name="nome"
                maxLength={255}
                aria-describedby={erroDe('nome') ? 'nome-erro' : undefined}
                onBlur={blur('nome')}
                value={formData.nome}
                onChange={(e) => { setFormData({ ...formData, nome: e.target.value }); limparErro('nome'); }}
                className={`w-full p-2 border ${borda('nome')} rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30`}
                placeholder="João Silva"
              />
              <InlineError id="nome-erro" message={erroDe('nome')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Telefone <span className="text-danger">*</span>
              </label>
              <InputMask
                mask={mascaraTelefone(formData.telefone)}
                onBlur={blur('telefone')}
                value={formData.telefone}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    telefone: e.target.value,
                  });
                  limparErro('telefone');
                }}
              >
                {(inputProps: any) => (
                  <input
                    {...inputProps}
                    type="tel"
                    aria-label="Telefone"
                    aria-invalid={!!erroDe('telefone')}
                name="telefone"
                aria-describedby={erroDe('telefone') ? 'telefone-erro' : undefined}
                    className={`w-full p-2 border ${borda('telefone')} rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30`}
                    placeholder="(11) 98765-4321"
                  />
                )}
              </InputMask>
              <InlineError id="telefone-erro" message={erroDe('telefone')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                E-mail
              </label>
              <input
                type="email"
                aria-label="E-mail"
                aria-invalid={!!erroDe('email')}
                name="email"
                maxLength={255}
                aria-describedby={erroDe('email') ? 'email-erro' : undefined}
                onBlur={blur('email')}
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); limparErro('email'); }}
                className={`w-full p-2 border ${borda('email')} rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30`}
                placeholder="joao@email.com"
              />
              <InlineError id="email-erro" message={erroDe('email')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Origem <span className="text-danger">*</span>
              </label>

              <select
                aria-label="Origem"
                aria-invalid={!!erroDe('origem')}
                name="origem"
                aria-describedby={erroDe('origem') ? 'origem-erro' : undefined}
                onBlur={blur('origem')}
                value={formData.origem}
                onChange={(e) => {
                  setFormData({ ...formData, origem: e.target.value });
                  limparErro('origem');
                }}
                className={`w-full p-2 border ${borda('origem')} rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30`}
              >
                <option value="">Selecione...</option>

                {origemOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <InlineError id="origem-erro" message={erroDe('origem')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Histórico <span className="text-danger">*</span>
              </label>

              <select
                aria-label="Histórico"
                aria-invalid={!!erroDe('historico')}
                name="historico"
                aria-describedby={erroDe('historico') ? 'historico-erro' : undefined}
                onBlur={blur('historico')}
                value={formData.historico}
                onChange={(e) => {
                  setFormData({ ...formData, historico: e.target.value });
                  limparErro('historico');
                }}
                className={`w-full p-2 border ${borda('historico')} rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30`}
              >
                <option value="">Selecione...</option>

                {historicoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <InlineError id="historico-erro" message={erroDe('historico')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const newStatus = e.target.value as Lead['status'];

                  setFormData({
                    ...formData,
                    status: newStatus,
                    motivoDescarte: newStatus === 'descarte' ? formData.motivoDescarte : '',
                  });
                }}
                className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
              >
                <option value="lead">Lead</option>
                <option value="oportunidade">Oportunidade</option>
                <option value="visita-agendada">Visita Agendada</option>
                <option value="visita-realizada">Visita Realizada</option>
                <option value="pasta">Pasta</option>
                <option value="aprovado">Aprovado</option>
                <option value="contrato">Contrato</option>
                <option value="descarte">Descarte</option>
              </select>
              <InlineError message={erroDe('status')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Valor de Interesse (R$) 
              </label>
              <input
                type="number"
                min="0"
                aria-label="Valor de interesse"
                aria-invalid={!!erroDe('valorInteresse')}
                name="valorInteresse"
                aria-describedby={erroDe('valorInteresse') ? 'valorInteresse-erro' : undefined}
                onBlur={blur('valorInteresse')}
                value={formData.valorInteresse}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    valorInteresse: Number(e.target.value || 0),
                  });
                  limparErro('valorInteresse');
                }}
                className={`w-full p-2.5 border ${borda('valorInteresse')} rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30 no-spinner`}
                placeholder="350000"
              />
              <InlineError id="valorInteresse-erro" message={erroDe('valorInteresse')} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Empreendimento de Interesse
            </label>
            <select
              value={formData.empreendimentoId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                handleEmpreendimentoSelect(value ? Number(value) : null);
              }}
              className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
            >
              <option value="">Nenhum empreendimento específico</option>
              {empreendimentos.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome}{(emp.precoMin != null || emp.precoMax != null) ? ` - ${faixa(emp.precoMin, emp.precoMax, brl)}` : ''}
                </option>
              ))}
            </select>
            {empreendimentosError && <InlineError message={empreendimentosError} />}
            {!empreendimentosError && empreendimentos.length === 0 && (
              <p className="text-xs text-muted mt-1">
                Nenhum empreendimento disponível. Cadastre empreendimentos em &quot;Empreendimentos&quot; primeiro.
              </p>
            )}
          </div>


          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Observações
            </label>
            <textarea
              name="observacao"
              maxLength={255}
              value={formData.observacao}
              onChange={(e) => { setFormData({ ...formData, observacao: e.target.value }); limparErro('observacao'); }}
              className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
              rows={3}
              placeholder="Informações adicionais sobre o lead..."
            />
            <div className="flex justify-between gap-2">
              <InlineError id="observacao-erro" message={erroDe('observacao')} />
              <span className="ml-auto text-xs text-muted mt-1.5">{formData.observacao.length}/255</span>
            </div>
          </div>
          {formData.status === 'descarte' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-muted">
                Motivo do descarte <span className="text-danger">*</span>
              </label>

              <textarea
                aria-label="Motivo do descarte"
                aria-invalid={!!erroDe('motivoDescarte')}
                name="motivoDescarte"
                aria-describedby={erroDe('motivoDescarte') ? 'motivoDescarte-erro' : undefined}
                onBlur={blur('motivoDescarte')}
                value={formData.motivoDescarte || ''}
                onChange={(e) => {
                  setFormData({ ...formData, motivoDescarte: e.target.value });
                  limparErro('motivoDescarte');
                }}
                placeholder="Ex.: sem interesse no momento, renda incompatível..."
                maxLength={255}
                className={`mt-1 w-full border ${borda('motivoDescarte')} rounded-btn p-2.5 focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30`}
              />
              <InlineError id="motivoDescarte-erro" message={erroDe('motivoDescarte')} />
            </div>
          )}


          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted hover:bg-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (editingLead ? 'Salvando alterações...' : 'Cadastrando lead...') : editingLead ? 'Salvar alterações' : 'Adicionar lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
