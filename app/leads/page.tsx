'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/types';
import { leadService } from '@/service/leadService';
import LeadsTable, { STATUS_CONFIG } from '@/components/LeadsTable';
import LeadModal from '@/components/LeadModal';
import LeadViewModal from '@/components/LeadViewModal';
import { Plus, Users } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { parseApiError } from '@/lib/errorHandler';
import { notificarErro, textoDoErro } from '@/lib/feedback';
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
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [resumo, setResumo] = useState<{ total: number; ativos: number; arquivados: number; contratos: number; esteMes: number } | null>(null);

  // Troca de filtro/tamanho volta para a página 0 (setPage(0) junto); um único carregamento por mudança.
  // Cada página é uma nova requisição: o backend devolve só os registros dela (Page).
  useEffect(() => {
    loadData(page);
  }, [page, size, statusFilter]);

  const trocarTamanho = (novo: number) => {
    setSize(novo);
    setPage(0);
  };

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
      const data: any = await leadService.getAll({ page: pageIndex, size, status: statusFilter !== "all" ? statusFilter : undefined });
      const content = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      const safe = content.filter((x: any) => x && x.id != null);
      // a página deixou de existir (ex.: o último lead dela foi arquivado): vai para a última que existe
      if (safe.length === 0 && pageIndex > 0 && (data?.totalPages ?? 0) > 0) {
        setPage(data.totalPages - 1);
        return;
      }
      setLeads(safe);
      setTotalPages(data?.totalPages ?? (safe.length ? 1 : 0));
      setTotalElements(data?.totalElements ?? safe.length);
      // cards de resumo: contados no servidor sobre todos os leads, não só a página visível
      leadService.getResumo().then(setResumo).catch(() => setResumo(null));
    } catch (e: any) {
      // erro mostrado uma única vez, no lugar da tabela, com o botão "Tentar novamente"
      // (antes aparecia também um toast com a mesma mensagem)
      setLoadError(textoDoErro(parseApiError(e)));
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
      const payload = {
        ...leadData,
        telefone: limparTelefone(leadData.telefone),
      };

      if (editingLead) {
        await leadService.atualizar(editingLead.id, payload);
        await loadData(page);
      } else {
        await leadService.cadastrar(payload);
        // garante que novo lead (sempre no topo DESC dataAtualizacao) apareça na primeira página
        if (page !== 0) setPage(0);
        await loadData(0);
      }
      setEditingLead(null);
      setIsModalOpen(false);
      toast(editingLead
        ? (leadData.status === 'descarte' && editingLead.status !== 'descarte'
            ? `Lead ${leadData.nome} descartado.`
            : `Dados do lead ${leadData.nome} atualizados com sucesso.`)
        : `Lead ${leadData.nome} cadastrado com sucesso.`, 'success');
      return true;
    } catch (error: any) {
      const parsed = parseApiError(error);
      if (parsed.tipo === 'sessao_expirada') return false;
      // erro de campo aparece junto ao campo no formulário; os demais no topo do formulário
      // (antes: toast genérico "Existem campos inválidos" sem dizer qual)
      setErrors(parsed.fields && Object.keys(parsed.fields).length ? parsed.fields : { geral: textoDoErro(parsed) });
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

  const handleStatusChange = async (id: number, newStatus: Lead['status']) => {
    const nome = leads.find(l => l.id === id)?.nome ?? 'o lead';
    const rotulo = STATUS_CONFIG[newStatus]?.label ?? newStatus;
    try {
      await leadService.atualizar(id, { status: newStatus });
      await loadData(page);
      toast(`Status de ${nome} alterado para "${rotulo}".`, 'success');
    } catch (e: any) {
      notificarErro(toast, `Não foi possível alterar o status de ${nome}`, e);
    }
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

          {/* Stats Cards - contadores calculados no servidor (GET /leads/resumo) sobre todos os leads do escopo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Total de Leads</p>
              <p className="text-3xl font-bold text-ink">{resumo?.total ?? '—'}</p>
            </div>
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Ativos</p>
              <p className="text-3xl font-bold text-ink">{resumo?.ativos ?? '—'}</p>
            </div>
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Contrato</p>
              <p className="text-3xl font-bold text-success">{resumo?.contratos ?? '—'}</p>
            </div>
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Este Mês</p>
              <p className="text-3xl font-bold text-ink">{resumo?.esteMes ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="bg-card border border-line rounded-card shadow-card p-12 text-center">
            <p className="text-muted motion-safe:animate-pulse" role="status">Carregando leads...</p>
          </div>
        ) : loadError ? (
          <ErrorState message="Não foi possível carregar os leads." details={loadError} onRetry={() => loadData(page)} />
        ) : (
          <LeadsTable
            leads={Array.isArray(leads) ? leads : []}
            onEdit={handleEditLead}
            onView={handleViewLead}
            onStatusChange={handleStatusChange}
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={trocarTamanho}
            contagens={resumo}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
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
