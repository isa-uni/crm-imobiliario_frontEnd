'use client';

import React, { useState } from 'react';
import { Lead } from '@/types';
import { Phone, Mail, Calendar, DollarSign, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  // onDelete: (id: number) => void;
  // onStatusChange: (id: number, newStatus: Lead['status']) => void;
  onStatusChange: (id: number, newStatus: Lead['status'], motivo?: string) => void;

}

export default function LeadCard({ lead, onEdit, 
  // onDelete, 
  onStatusChange }: LeadCardProps) {
  // const [status, setStatus] = useState('');
  // const [motivo, setMotivo] = useState('');
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

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{lead.nome}</h3>
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusColors[lead.status]} mt-1`}>
            {statusLabels[lead.status]}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(lead)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          {/* <button
            onClick={() => onDelete(lead.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Excluir"
          >
            <Trash2 size={16} />
          </button> */}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Phone size={14} />
          <span>{lead.telefone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail size={14} />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={14} />
          <span>R$ {lead.valorInteresse.toLocaleString('pt-BR')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span>{format(lead.dataAtualizacao, "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        {/* <p className="text-xs text-gray-500 mb-2">
          <strong>Tipo:</strong> {lead.tipoImovel}
        </p> */}
        <p className="text-xs text-gray-500 mb-2">
          <strong>Origem:</strong> {lead.origem}
        </p>
        {lead.observacao && (
          <p className="text-xs text-gray-600 italic">
            "{lead.observacao}"
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <label className="text-xs text-gray-500 block mb-2">Alterar status:</label>
        <select
          value={lead.status}
          onChange={(e) => {
            const newStatus = e.target.value as Lead['status'];

            if (newStatus === 'descarte') {
              onEdit({ ...lead, status: newStatus }); // 👈 abre o modal
            } else {
              onStatusChange(lead.id, newStatus);
            }
          }}
          className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        {lead.status === 'descarte' && lead.motivoDescarte && (
          <p className="text-xs text-red-600 mt-2">
            <strong>Motivo do Descarte:</strong> {lead.motivoDescarte}
          </p>
        )}
      </div>
    </div>
  );
}
