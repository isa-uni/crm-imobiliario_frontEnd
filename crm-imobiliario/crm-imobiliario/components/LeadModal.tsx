'use client';

import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '@/types';
import { origemOptions } from '@/service/origemOptions';
import { getImoveisDisponiveis } from '@/lib/imoveis';
import { X } from 'lucide-react';
import InputMask from 'react-input-mask';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Omit<Lead, 'id' | 'dataCriacao' | 'dataAtualizacao'>) => Promise<boolean>;
  editingLead?: Lead | null;
  errors?: any;
}

type LeadFormData = {
  nome: string;
  telefone: string;
  email: string;
  origem: string;
  status: LeadStatus;
  valorInteresse: number;
  imovelId: number | null;
  observacao: string;
  motivoDescarte: string;
};

export default function LeadModal({ isOpen, onClose, onSave, editingLead, errors, }: LeadModalProps) {
  
  const [formData, setFormData] = useState<LeadFormData>({
    nome: '',
    telefone: '',
    email: '',
    origem: '',
    status: 'lead' as Lead['status'],
    valorInteresse: 0,
    // tipoImovel: '',
    imovelId: null,
    observacao: '',
    motivoDescarte: '',
  });

  const [imoveis, setImoveis] = useState<any[]>([]);
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
        status: editingLead.status,
        valorInteresse: editingLead.valorInteresse,
        // tipoImovel: editingLead.tipoImovel,
        imovelId: editingLead.imovelId ?? null,
        observacao: editingLead.observacao || '',
        motivoDescarte: editingLead.motivoDescarte || '',
      });
    } else {
      setFormData({
        nome: '',
        telefone: '',
        email: '',
        origem: '',
        status: 'lead',
        valorInteresse: 0,
        // tipoImovel: '',
        imovelId: null,
        observacao: '',
        motivoDescarte: '',
      });
    }
  }, [editingLead, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    if (formData.status === 'descarte' && !formData.motivoDescarte.trim()) {
      alert('Informe o motivo do descarte');
      setLoading(false);
      return;
    }

    const sucesso = await onSave(formData);

    setLoading(false);

    if (sucesso) {
      onClose();
    }
  };

  const handleImovelSelect = (imovelId: number | null) => {
    if (!imovelId) {
      setFormData({
        ...formData,
        imovelId: null,
        valorInteresse: 0
      });
      return;
    }

    const imovel = imoveis.find(i => i.id === imovelId);

    if (imovel) {
      setFormData({
        ...formData,
        imovelId,
        valorInteresse: imovel.valorVenda,
      });
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingLead ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="João Silva"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <input
                type="tel"
                required
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(11) 98765-4321"
              />
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
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
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="joao@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origem *
              </label>

              <select
                required
                value={formData.origem}
                onChange={(e) =>
                  setFormData({ ...formData, origem: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor de Interesse (R$) *
              </label>
              <input
                type="number"
                required
                min="0"
                // step="0.01"
                value={formData.valorInteresse}
                onChange={(e) => setFormData({ ...formData, valorInteresse: Number(e.target.value || 0) })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="350000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imóvel de Interesse
            </label>
            <select
              value={formData.imovelId ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                handleImovelSelect(value ? Number(value) : null);
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhum imóvel específico</option>
              {imoveis.map(imovel => (
                <option key={imovel.id} value={imovel.id}>
                  {imovel.titulo} - R$ {imovel.valorVenda.toLocaleString('pt-BR')}
                </option>
              ))}
            </select>
            {imoveis.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Nenhum imóvel disponível. Cadastre imóveis em "Imóveis" primeiro.
              </p>
            )}
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Imóvel *
            </label>
            <input
              type="text"
              required
              value={formData.tipoImovel}
              onChange={(e) => setFormData({ ...formData, tipoImovel: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Apartamento 2 quartos"
            />
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Informações adicionais sobre o cliente..."
            />
          </div>
          {formData.status === 'descarte' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">
                Motivo do descarte *
              </label>

              <textarea
                value={formData.motivoDescarte || ''}
                onChange={(e) =>
                  setFormData({ ...formData, motivoDescarte: e.target.value })
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          )}


          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              // disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingLead ? 'Salvar Alterações' : 'Adicionar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
