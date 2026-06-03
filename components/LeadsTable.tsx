'use client';

import React, { useState, useMemo } from 'react';
import { origemOptions } from '@/service/origemOptions';
import { Lead } from '@/types';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Archive,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  // onDelete: (id: number) => void;
  onView: (lead: Lead) => void;
  onStatusChange: (id: number, status: Lead['status']) => void;
}

export default function LeadsTable({ 
  leads, 
  onEdit, 
  // onDelete, 
  onView,
  onStatusChange 
}: LeadsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  //const [monthFilter, setMonthFilter] = useState<string>('current');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Status colors
  const statusConfig = {
    'lead': { label: 'Lead', color: 'bg-gray-100 text-gray-800', icon: Clock },
    'oportunidade': { label: 'Oportunidade', color: 'bg-blue-100 text-blue-800', icon: Eye },
    'visita-agendada': { label: 'Visita Agendada', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    'visita-realizada': { label: 'Visita Realizada', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
    'pasta': { label: 'Pasta', color: 'bg-orange-100 text-orange-800', icon: DollarSign },
    'aprovado': { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    'contrato': { label: 'Contrato', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'descarte': { label: 'Descarte', color: 'bg-red-100 text-red-800', icon: XCircle },
  };

  // Filtros
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Busca
    if (searchTerm) {
      result = result.filter(lead => 
        lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.telefone.includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status (ativo/arquivado)
    if (statusFilter === 'active') {
      result = result.filter(lead => 
        lead.status !== 'contrato' && lead.status !== 'descarte'
      );
    } else if (statusFilter === 'archived') {
      result = result.filter(lead => 
        lead.status === 'contrato' || lead.status === 'descarte'
      );
    }

    // Mês
    if (monthFilter === 'current') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      result = result.filter(lead => {
        const leadDate = new Date(lead.dataCriacao);
        return leadDate.getMonth() === currentMonth && 
               leadDate.getFullYear() === currentYear;
      });
    } else if (monthFilter !== 'all') {
      const [year, month] = monthFilter.split('-').map(Number);
      result = result.filter(lead => {
        const leadDate = new Date(lead.dataCriacao);
        return leadDate.getMonth() === month - 1 && 
               leadDate.getFullYear() === year;
      });
    }

    return result;
  }, [leads, searchTerm, statusFilter, monthFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Opções de meses (últimos 6 meses)
  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: format(date, 'yyyy-M'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    
    return months;
  }, []);

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
    <div className="space-y-4">
      {/* Barra de ações */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Busca */}
        {/* <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div> */}

        {/* Filtros rápidos */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ativos ({leads.filter(l => l.status !== 'contrato' && l.status !== 'descarte').length})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'archived'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Archive size={16} className="inline mr-1" />
            Arquivados ({leads.filter(l => l.status === 'contrato' || l.status === 'descarte').length})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Filtro de mês */}
      {/* <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm text-gray-700 font-medium">Período:</span>
        </div>
        <select
          value={monthFilter}
          onChange={(e) => {
            setMonthFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="current">Mês atual</option>
          <option value="all">Todos os períodos</option>
          <optgroup label="Meses anteriores">
            {monthOptions.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </optgroup>
        </select>

        <div className="ml-auto text-sm text-gray-600">
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} encontrado{filteredLeads.length !== 1 ? 's' : ''}
        </div>
      </div> */}

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Origem
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <Search size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Nenhum lead encontrado</p>
                      <p className="text-sm mt-1">Tente ajustar os filtros ou busca</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const status = statusConfig[lead.status];

                  if (!status) {
                    console.error("Status inválido:", lead.status);
                    return null;
                  }

                  const StatusIcon = status.icon;
                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{lead.nome}</div>
                          {/* <div className="text-sm text-gray-500">{lead.tipoImovel}</div> */}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone size={14} className="text-gray-400" />
                            {formatarTelefone(lead.telefone)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail size={14} className="text-gray-400" />
                            {lead.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as Lead['status']
                            if (newStatus === 'descarte') {
                              if (confirm('Tem certeza que deseja descartar este lead?')) {
                                onEdit({ ...lead, status: newStatus }); // 👈 abre o modal
                              }
                            } else {
                              onStatusChange(lead.id, newStatus);
                            }
                          }}
                          className={`
                            px-3 py-1 rounded-full text-xs font-medium
                            border-0 cursor-pointer
                            ${statusConfig[lead.status].color}
                          `}
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
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          R$ {(lead.valorInteresse ?? 0).toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700">{getOrigemLabel(lead.origem)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-500">
                          {format(new Date(lead.dataAtualizacao), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onView(lead)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => onEdit(lead)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          {/* <button
                            onClick={() => onDelete(lead.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages} • 
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredLeads.length)} de {filteredLeads.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
