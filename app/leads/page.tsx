'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/types';
import { leadService } from '@/service/leadService';
import LeadsTable from '@/components/LeadsTable';
import LeadModal from '@/components/LeadModal';
import LeadViewModal from '@/components/LeadViewModal';
import { Plus, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/ToastProvider';
import { parseApiError } from '@/lib/errorHandler';
import { ErrorState } from '@/components/ui/ErrorState';

export default function LeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const size = 20;
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  useEffect(() => {
    loadData(page);
  }, [page]);

  // Ao alterar qualquer filtro, reseta para page 0 e garante reload mesmo quando já está em 0
  useEffect(() => {
    if (page === 0) loadData(0);
    else setPage(0);
  }, [searchTerm, statusFilter, monthFilter]);

  // ouve redistribuição feita em outra aba (mesmo browser) e recarrega página 0
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === 'crm:lastRedistribuicao') { loadData(0); setPage(0); } }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, []);

  const loadData = async (pageIndex = page) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data: any = await leadService.getAll({ page: pageIndex, size, search: searchTerm || undefined, status: statusFilter !== "all" ? statusFilter : undefined, month: monthFilter !== "all" ? monthFilter : undefined });
      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      const safe = content.filter((x: any) => x && x.id != null);
      setLeads(safe);
      setTotalPages(data?.totalPages ?? (safe.length ? 1 : 0));
      setTotalElements(data?.totalElements ?? safe.length);
    } catch (e: any) {
      const parsed = parseApiError(e);
      setLoadError(parsed.message);
      toast(parsed.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const limparTelefone = (telefone: string) => {
    return telefone.replace(/\D/g, '');
  };

  const handleSaveLead = async (leadData: Omit<Lead, 'id' | 'dataCriacao' | 'dataAtualizacao'>) => {
    try {
      setErrors({});
      const { observacao, motivoDescarte, ...rest } = leadData;

      const payload = {
        ...rest,
        observacao,
        motivoDescarte,
        telefone: limparTelefone(leadData.telefone),
      };

      if (editingLead) {
        await leadService.atualizar(editingLead.id, payload);
        await loadData(page);
      } else {
        await leadService.cadastrar(payload);
        // garante que novo lead (sempre no topo DESC dataAtualizacao) apareça na primeira página size 20
        if (page !== 0) setPage(0);
        await loadData(0);
      }
      setEditingLead(null);
      setErrors({});
      setIsModalOpen(false);
      toast(editingLead ? 'Lead atualizado com sucesso.' : 'Lead cadastrado com sucesso.', 'success');
      return true;
    } catch (error: any) {
      const parsed = parseApiError(error);
      if (parsed.fields) {
        setErrors(parsed.fields);
        toast('Existem campos inválidos. Verifique os campos destacados.', 'warning');
      } else {
        toast(parsed.message, 'error');
      }
      return false;
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsViewModalOpen(false);
    setIsModalOpen(true);
  };

  const handleViewLead = (lead: Lead) => {
    setViewingLead(lead);
    setIsViewModalOpen(true);
  };

  const handleDeleteLead = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        await leadService.inativar(id);
        await loadData(page);
        toast('Lead inativado com sucesso.', 'success');
      } catch (e: any) {
        toast(parseApiError(e).message, 'error');
      }
    }
  };

  const handleStatusChange = async (id: number, newStatus: Lead['status']) => {
    try {
      await leadService.atualizar(id, { status: newStatus });
      await loadData(page);
      toast('Status atualizado com sucesso.', 'success');
    } catch (e: any) {
      toast(parseApiError(e).message, 'error');
    }
  };

  const handleExport = () => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const csvData = [
      ['Nome', 'Telefone', 'Email', 'Status', 'Valor', 'Origem', 'Data Criação'],
      ...safeLeads.map((lead) => [
        lead.nome,
        lead.telefone,
        lead.email,
        lead.status,
        lead.valorInteresse.toString(),
        // lead.tipoImovel,
        lead.origem,
        format(lead.dataCriacao, 'dd/MM/yyyy'),
      ]),
    ];

    const csvContent = csvData.map((row) => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `todos_leads_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-brand text-on-brand flex items-center justify-center shadow-btn">
                <Users size={24} />
              </span>
              <div>
                <h1 className="text-3xl font-bold text-ink tracking-tight">Gerenciamento de Leads</h1>
                <p className="text-muted">Cadastre e acompanhe os clientes interessados</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingLead(null);
                setErrors({});
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-brand text-on-brand px-6 py-2.5 rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors"
            >
              <Plus size={20} />
              Novo Lead
            </button>
          </div>

          {/* Stats Cards - usam totalElements para refletir base server-side */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Total de Leads</p>
              <p className="text-3xl font-bold text-ink">{totalElements}</p>
            </div>
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Ativos</p>
              <p className="text-3xl font-bold text-ink">
                {Array.isArray(leads) ? leads.filter(l => l.status !== 'contrato' && l.status !== 'descarte').length : 0}
              </p>
            </div>
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Contrato</p>
              <p className="text-3xl font-bold text-success">
                {Array.isArray(leads) ? leads.filter(l => l.status === 'contrato').length : 0}
              </p>
            </div>
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Este Mês</p>
              <p className="text-3xl font-bold text-ink">
                {Array.isArray(leads) ? leads.filter(l => {
                  const leadDate = new Date(l.dataCriacao);
                  const now = new Date();
                  return leadDate.getMonth() === now.getMonth() && 
                         leadDate.getFullYear() === now.getFullYear();
                }).length : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="bg-card border border-line rounded-card shadow-card p-12 text-center">
            <p className="text-muted animate-pulse">Carregando leads...</p>
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadData} />
        ) : (
          <LeadsTable
            leads={Array.isArray(leads) ? leads : []}
            onEdit={handleEditLead}
            onView={handleViewLead}
            onStatusChange={handleStatusChange}
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setPage}
            serverSide
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            monthFilter={monthFilter}
            onMonthFilterChange={setMonthFilter}
          />
        )}

        {/* Modais */}
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
            setErrors({});
          }}
          onSave={handleSaveLead}
          editingLead={editingLead}
          errors={errors}
        />

        <LeadViewModal
          lead={viewingLead}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingLead(null);
          }}
          onEdit={() => {
            if (viewingLead) {
              handleEditLead(viewingLead);
            }
          }}
        />
      </div>
    </div>
  );
}
