'use client';

import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '@/types';
import { origemOptions } from '@/service/origemOptions';
import { historicoOptions } from '@/service/historicoOptions';
import { empreendimentoIaService, EmpreendimentoCard } from '@/service/empreendimentoIaService';
import { brl, faixa } from '@/lib/format';
import { X } from 'lucide-react';
import InputMask from 'react-input-mask';
import { useToast } from '@/components/ui/ToastProvider';
import { parseApiError } from '@/lib/errorHandler';
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
    // tipoImovel: '',
    empreendimentoId: null,
    observacao: '',
    motivoDescarte: '',
  });

  const { toast } = useToast();
  const [empreendimentos, setEmpreendimentos] = useState<EmpreendimentoCard[]>([]);
  const [empreendimentosError, setEmpreendimentosError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formatarTelefone = (telefone: string) => {
    return telefone
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

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
        // tipoImovel: editingLead.tipoImovel,
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
        // tipoImovel: '',
        empreendimentoId: null,
        observacao: '',
        motivoDescarte: '',
      });
    }
  }, [editingLead, isOpen]);

  useEffect(() => {
  const carregarEmpreendimentos = async () => {
    try {
      const data = await empreendimentoIaService.listarCards({ size: 100, sort: 'nome,asc' });
      setEmpreendimentos(data?.content ?? []);
      setEmpreendimentosError(null);
    } catch (error: any) {
      const parsed = parseApiError(error);
      const msg = 'Não foi possível carregar empreendimentos';
      setEmpreendimentosError(msg);
      toast(parsed.message || msg, 'error');
      console.error(error);
    }
  };

  if (isOpen) {
    carregarEmpreendimentos();
  }
}, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("formData antes de salvar 3", formData);
    
    e.preventDefault();

    setLoading(true);

    if (formData.status === 'descarte' && !formData.motivoDescarte.trim()) {
      alert('Informe o motivo do descarte');
      setLoading(false);
      return;
    }

    // marca a intenção explícita de remover o empreendimento vinculado quando o campo é deixado em
    // branco — sem isso, o backend não teria como distinguir "não mudei este campo" de "quero limpar"
    const sucesso = await onSave({ ...formData, limparEmpreendimento: formData.empreendimentoId === null });
    console.log('Sucesso no salvamento: ', sucesso);


    setLoading(false);

    if (sucesso) {
      onClose();
    }
  };

  //console.log("formData antes de salvar 1", formData);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-card shadow-card-lg">
        <div className="flex justify-between items-center p-6 border-b border-line">
          <h2 className="text-xl font-bold text-ink">
            {editingLead ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
                placeholder="João Silva"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Telefone *
              </label>
              <input
                type="tel"
                required
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
                placeholder="(11) 98765-4321"
              />
            </div> */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Telefone <span className="text-red-500">*</span>
              </label>
              <InputMask
                mask="(99) 99999-9999"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    telefone: e.target.value,
                  })
                }
              >
                {(inputProps: any) => (
                  <input
                    {...inputProps}
                    type="tel"
                    required
                    className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
                    placeholder="(11) 98765-4321"
                  />
                )}
              </InputMask>
              {errors?.telefone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.telefone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
                placeholder="joao@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Origem <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={formData.origem}
                onChange={(e) =>
                  setFormData({ ...formData, origem: e.target.value })
                }
                className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Selecione...</option>

                {origemOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Histórico <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={formData.historico}
                onChange={(e) =>
                  setFormData({ ...formData, historico: e.target.value })
                }
                className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Selecione...</option>

                {historicoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
                // onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead['status'] })}
                className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Valor de Interesse (R$) 
              </label>
              <input
                type="number"
                required
                min="0"
                // step="0.01"
                value={formData.valorInteresse}
                onChange={(e) => setFormData({
                  ...formData, 
                  valorInteresse: Number(e.target.value || 0),
                })}
                className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10 no-spinner"
                placeholder="350000"
              />
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
              className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
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

          {/* <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Tipo de Imóvel *
            </label>
            <input
              type="text"
              required
              value={formData.tipoImovel}
              onChange={(e) => setFormData({ ...formData, tipoImovel: e.target.value })}
              className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
              placeholder="Apartamento 2 quartos"
            />
          </div> */}

          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              className="w-full p-2 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
              rows={3}
              placeholder="Informações adicionais sobre o cliente..."
            />
          </div>
          {formData.status === 'descarte' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">
                Motivo do descarte <span className="text-red-500">*</span>
              </label>

              <textarea
                value={formData.motivoDescarte || ''}
                onChange={(e) =>
                  setFormData({ ...formData, motivoDescarte: e.target.value })
                }
                className="mt-1 w-full border border-line rounded-btn p-2.5 focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
              />
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
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-btn font-semibold shadow-btn hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : editingLead ? 'Salvar Alterações' : 'Adicionar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
