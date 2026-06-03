'use client';

import React from 'react';
import { Lead } from '@/types';
import { X, Phone, Mail, Calendar, DollarSign, Building2, MapPin, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { origemOptions } from '@/service/origemOptions';


interface LeadViewModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export default function LeadViewModal({ lead, isOpen, onClose, onEdit }: LeadViewModalProps) {
  if (!isOpen || !lead) return null;

  const statusLabels = {
    'lead': 'Lead',
    'oportunidade': 'Oportunidade',
    'visita-agendada': 'Visita Agendada',
    'visita-realizada': 'Visita Realizada', 
    'pasta': 'Pasta', 
    'aprovado': 'Aprovado', 
    'contrato': 'Contrato', 
    'descarte': 'Descarte',
  };

  const statusColors = {
    'lead': 'bg-slate-100 text-gray-800',
    'oportunidade': 'bg-blue-100 text-blue-800',
    'visita-agendada': 'bg-amber-100 text-yellow-800',
    'visita-realizada': 'bg-purple-100 text-indigo-800',
    'pasta': 'bg-fuchsia-100 text-slate-800',
    'aprovado': 'bg-teal-100 text-emerald-800',
    'contrato': 'bg-green-100 text-green-800',
    'descarte': 'bg-red-100 text-red-800',
  };

  const formatarTelefone = (telefone: string) => {
    return telefone
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const getOrigemLabel = (value: string) => {
    return origemOptions.find(o => o.value === value)?.label || value;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{lead.nome}</h2>
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-2 ${statusColors[lead.status]}`}>
              {statusLabels[lead.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações de Contato */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Informações de Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Phone size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Telefone</p>
                  <p className="text-sm font-medium text-gray-900">{formatarTelefone(lead.telefone)}</p>
                  <a 
                    href={`tel:${formatarTelefone(lead.telefone)}`} 
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                  >
                    Ligar agora
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Mail size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900 break-all">{lead.email}</p>
                  <a 
                    href={`mailto:${lead.email}`} 
                    className="text-xs text-purple-600 hover:text-purple-700 mt-1 inline-block"
                  >
                    Enviar email
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes do Imóvel */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Interesse de Compra
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Valor de Interesse</p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {lead.valorInteresse.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Building2 size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Imóvel de Interesse</p>
                  <p className="text-sm font-medium text-gray-900">{lead.imovel?.titulo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Origem e Datas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Informações Adicionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <MapPin size={20} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Origem do Lead</p>
                  <p className="text-sm font-medium text-gray-900">{getOrigemLabel(lead.origem)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Calendar size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Data de Criação</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(lead.dataCriacao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Atualizado em {format(lead.dataAtualizacao, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          {lead.observacao && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Observações
              </h3>
              <div className="flex gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg h-fit">
                  <FileText size={20} className="text-yellow-600" />
                </div>
                <div className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {lead.observacao}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline (Futuro) */}
          {/* <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Histórico de Atividades
            </h3>
            <div className="text-center py-8 text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Em breve: histórico completo de interações</p>
            </div>
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Editar Lead
          </button>
        </div>
      </div>
    </div>
  );
}
