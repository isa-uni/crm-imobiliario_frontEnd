'use client';

import React, { useState, useMemo } from 'react';
import { origemOptions } from '@/service/origemOptions';
import { historicoOptions } from '@/service/historicoOptions';
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
  onView: (lead: Lead) => void;
  onStatusChange: (id: number, status: Lead['status']) => void;
  // server-side pagination
  page?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
  serverSide?: boolean;
  // filtros controlados pelo pai quando serverSide
  searchTerm?: string;
  onSearchChange?: (v: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (v: string) => void;
  monthFilter?: string;
  onMonthFilterChange?: (v: string) => void;
}

export default function LeadsTable({ 
  leads, 
  onEdit, 
  onView,
  onStatusChange,
  page = 0,
  totalPages: totalPagesProp,
  totalElements: totalElementsProp,
  onPageChange,
  serverSide = false,
  searchTerm: searchTermProp,
  onSearchChange,
  statusFilter: statusFilterProp,
  onStatusFilterChange,
  monthFilter: monthFilterProp,
  onMonthFilterChange
}: LeadsTableProps) {
  const [searchTermLocal, setSearchTermLocal] = useState('');
  const [statusFilterLocal, setStatusFilterLocal] = useState<'all' | 'active' | 'archived'>('active');
  const [monthFilterLocal, setMonthFilterLocal] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const searchTerm = serverSide ? (searchTermProp ?? '') : searchTermLocal;
  const setSearchTerm = serverSide ? (onSearchChange ?? (() => {})) : setSearchTermLocal;
  const statusFilter = serverSide ? (statusFilterProp ?? 'all') : statusFilterLocal;
  const setStatusFilter: any = serverSide ? (onStatusFilterChange ?? (() => {})) : setStatusFilterLocal;
  const monthFilter = serverSide ? (monthFilterProp ?? 'all') : monthFilterLocal;
  const setMonthFilter = serverSide ? (onMonthFilterChange ?? (() => {})) : setMonthFilterLocal;

  const safeLeads = useMemo(() => Array.isArray(leads) ? leads : [], [leads]);

  // Status colors
  const statusConfig = {
    'lead': { label: 'Lead', color: 'bg-[#eef2f7] text-[#5f7488]', icon: Clock },
    'oportunidade': { label: 'Oportunidade', color: 'bg-[#eaf1f8] text-[#27506f]', icon: Eye },
    'visita-agendada': { label: 'Visita Agendada', color: 'bg-[#fdf3e0] text-[#b8790a]', icon: Clock },
    'visita-realizada': { label: 'Visita Realizada', color: 'bg-[#eef1fd] text-[#5258a8]', icon: Clock },
    'pasta': { label: 'Pasta', color: 'bg-[#fdf1ec] text-[#c05621]', icon: DollarSign },
    'aprovado': { label: 'Aprovado', color: 'bg-[#e8f6ee] text-[#0f8a52]', icon: CheckCircle },
    'contrato': { label: 'Contrato', color: 'bg-[#e8f6ee] text-[#0f7a45]', icon: CheckCircle },
    'descarte': { label: 'Descarte', color: 'bg-[#fdeceb] text-[#c0392b]', icon: XCircle },
  };

  // Filtros
  const filteredLeads = useMemo(() => {
    if (serverSide) return safeLeads; // já filtrado no backend via ?search&status&month
    let result = safeLeads;

    if (searchTerm) {
      result = result.filter(lead => 
        lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.telefone.includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter === 'active') {
      result = result.filter(lead => 
        lead.status !== 'contrato' && lead.status !== 'descarte'
      );
    } else if (statusFilter === 'archived') {
      result = result.filter(lead => 
        lead.status === 'contrato' || lead.status === 'descarte'
      );
    }

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
  }, [safeLeads, searchTerm, statusFilter, monthFilter, serverSide]);

  // Paginação
  const totalPages = serverSide ? (totalPagesProp ?? 0) : Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = serverSide ? filteredLeads : filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleServerPageChange = (newPage: number) => {
    if (serverSide && onPageChange) {
      onPageChange(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };

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

    const getHistoricoLabel = (value: string) => {
    return historicoOptions.find(o => o.value === value)?.label || value;
  };

  const currentPageDisplay = serverSide ? page + 1 : currentPage;
  const totalForDisplay = serverSide ? (totalElementsProp ?? filteredLeads.length) : filteredLeads.length;

  return (
    <div className="space-y-4">
      {/* Barra de ações */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { (setStatusFilter as any)('active'); if(serverSide) handleServerPageChange(0); else setCurrentPage(1); }}
            className={`px-4 py-2 text-sm font-semibold rounded-btn transition-colors ${
              statusFilter === 'active'
                ? 'bg-primary text-white shadow-btn'
                : 'bg-white text-muted border border-line hover:bg-surface'
            }`}
          >
            Ativos ({safeLeads.filter(l => l.status !== 'contrato' && l.status !== 'descarte').length})
          </button>
          <button
            onClick={() => { (setStatusFilter as any)('archived'); if(serverSide) handleServerPageChange(0); else setCurrentPage(1); }}
            className={`px-4 py-2 text-sm font-semibold rounded-btn transition-colors ${
              statusFilter === 'archived'
                ? 'bg-primary text-white shadow-btn'
                : 'bg-white text-muted border border-line hover:bg-surface'
            }`}
          >
            <Archive size={16} className="inline mr-1" />
            Arquivados ({safeLeads.filter(l => l.status === 'contrato' || l.status === 'descarte').length})
          </button>
          <button
            onClick={() => { (setStatusFilter as any)('all'); if(serverSide) handleServerPageChange(0); else setCurrentPage(1); }}
            className={`px-4 py-2 text-sm font-semibold rounded-btn transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-btn'
                : 'bg-white text-muted border border-line hover:bg-surface'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-line rounded-card shadow-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#eef2f7] border-b border-line">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Origem</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Responsável</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wide">Data</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-muted uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="text-muted">
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
                    <tr key={lead.id} className="hover:bg-surface">
                      <td className="px-4 py-4"><div className="font-medium text-ink">{lead.nome}</div></td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-ink"><Phone size={14} className="text-muted" />{formatarTelefone(lead.telefone)}</div>
                          <div className="flex items-center gap-2 text-sm text-muted"><Mail size={14} className="text-muted" />{lead.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select value={lead.status} onChange={(e) => {
                            const newStatus = e.target.value as Lead['status']
                            if (newStatus === 'descarte') {
                              if (confirm('Tem certeza que deseja descartar este lead?')) onEdit({ ...lead, status: newStatus });
                            } else onStatusChange(lead.id, newStatus);
                          }} className={`px-3 py-1 text-xs font-bold border-0 cursor-pointer rounded-full ${statusConfig[lead.status].color}`}>
                          <option value="lead">Lead</option><option value="oportunidade">Oportunidade</option><option value="visita-agendada">Visita Agendada</option><option value="visita-realizada">Visita Realizada</option><option value="pasta">Pasta</option><option value="aprovado">Aprovado</option><option value="contrato">Contrato</option><option value="descarte">Descarte</option>
                        </select>
                        {lead.status === 'descarte' && lead.motivoDescarte && (<p className="text-xs text-[#c0392b] mt-2"><strong>Motivo:</strong> {lead.motivoDescarte}</p>)}
                      </td>
                      <td className="px-4 py-4"><div className="text-sm font-medium text-ink">R$ {(lead.valorInteresse ?? 0).toLocaleString('pt-BR')}</div></td>
                      <td className="px-4 py-4"><div className="space-y-1"><span className="text-sm font-medium text-ink">{getOrigemLabel(lead.origem)}</span>{lead.historico && (<span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-[#eef2f7] text-muted">{getHistoricoLabel(lead.historico)}</span>)}</div></td>
                      <td className="px-4 py-4"><div className="text-xs"><p className="font-medium text-ink">{(lead as any).corretor?.nome || (lead as any).corretorNome || lead.corretorNome || '-'}</p><p className="text-muted">{(lead as any).equipe?.nome || (lead as any).equipeNome || lead.equipeNome || '-'}</p>{(lead.statusAtribuicao === 'AGUARDANDO_REDISTRIBUICAO' || (lead as any).statusAtribuicao==='AGUARDANDO_REDISTRIBUICAO') && (<span className="inline-flex mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">AGUARDANDO</span>)}</div></td>
                      <td className="px-4 py-4"><div className="text-sm text-muted">{format(new Date(lead.dataAtualizacao), 'dd/MM/yy', { locale: ptBR })}</div></td>
                      <td className="px-4 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => onView(lead)} className="p-2 rounded-lg text-primary hover:bg-primary-50"><Eye size={16} /></button><button onClick={() => onEdit(lead)} className="p-2 rounded-lg text-muted hover:bg-surface"><Edit size={16} /></button></div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-line">
          {paginatedLeads.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <Search size={32} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum lead encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            paginatedLeads.map((lead) => {
              const status = statusConfig[lead.status];
              if (!status) return null;
              return (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-ink line-clamp-1">{lead.nome}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full shrink-0 ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="text-sm text-muted space-y-1">
                    <div className="flex items-center gap-2"><Phone size={14} />{formatarTelefone(lead.telefone)}</div>
                    <div className="flex items-center gap-2"><Mail size={14} />{lead.email}</div>
                    <div className="flex items-center gap-2"><DollarSign size={14} />R$ {(lead.valorInteresse ?? 0).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{format(new Date(lead.dataAtualizacao), 'dd/MM/yy')}</span>
                    <div className="flex gap-2">
                      <button onClick={() => onView(lead)} className="p-2 rounded-lg text-primary bg-primary-50"><Eye size={16} /></button>
                      <button onClick={() => onEdit(lead)} className="p-2 rounded-lg text-muted bg-surface"><Edit size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-line flex flex-col sm:flex-row gap-2 items-center justify-between bg-surface text-sm">
            <div className="text-muted text-xs sm:text-sm">
              Página {currentPageDisplay} de {totalPages} • {serverSide ? totalElementsProp : totalForDisplay} total • Mostrando {serverSide ? paginatedLeads.length : Math.min(paginatedLeads.length, totalForDisplay)} nesta página
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => serverSide ? onPageChange?.(Math.max(0, page-1)) : handleServerPageChange(Math.max(1, currentPage-1))}
                disabled={serverSide ? page===0 : currentPage===1}
                className="flex-1 sm:flex-none px-3 py-2 border border-line rounded-btn text-sm font-medium text-ink hover:bg-white disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                onClick={() => serverSide ? onPageChange?.(Math.min(totalPages-1, page+1)) : handleServerPageChange(Math.min(totalPages, currentPage+1))}
                disabled={serverSide ? page+1>=totalPages : currentPage===totalPages}
                className="flex-1 sm:flex-none px-3 py-2 border border-line rounded-btn text-sm font-medium text-ink hover:bg-white disabled:opacity-50 flex items-center justify-center gap-1"
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
