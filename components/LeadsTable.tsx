'use client';

import React from 'react';
import { origemLabel } from '@/service/origemOptions';
import { historicoLabel } from '@/service/historicoOptions';
import { Lead } from '@/types';
import {
  Search,
  Edit,
  Eye,
  Archive,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatarTelefone } from '@/lib/format';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import Paginacao from '@/components/ui/Paginacao';

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onView: (lead: Lead) => void;
  onStatusChange: (id: number, status: Lead['status']) => void;
  // paginação e filtro de status feitos no backend
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  /** Contadores dos botões de filtro, calculados no servidor sobre todos os leads (GET /leads/resumo). */
  contagens?: { ativos: number; arquivados: number; total: number } | null;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
}

export const STATUS_CONFIG: Record<Lead['status'], { label: string; color: string }> = {
  'lead': { label: 'Lead', color: 'bg-subtle text-muted' },
  'oportunidade': { label: 'Oportunidade', color: 'bg-info-bg text-brand-fg' },
  'visita-agendada': { label: 'Visita Agendada', color: 'bg-warning-bg text-warning' },
  'visita-realizada': { label: 'Visita Realizada', color: 'bg-cat-indigo/10 text-cat-indigo' },
  'pasta': { label: 'Pasta', color: 'bg-cat-orange/10 text-cat-orange' },
  'aprovado': { label: 'Aprovado', color: 'bg-success-bg text-success' },
  'contrato': { label: 'Contrato', color: 'bg-success-bg text-success' },
  'descarte': { label: 'Descarte', color: 'bg-danger-bg text-danger' },
};




export default function LeadsTable({
  leads,
  onEdit,
  onView,
  onStatusChange,
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  onSizeChange,
  contagens,
  statusFilter,
  onStatusFilterChange,
}: LeadsTableProps) {
  const confirmar = useConfirm();
  const safeLeads = Array.isArray(leads) ? leads : [];

  const trocarFiltro = (filtro: string) => {
    onStatusFilterChange(filtro);
    onPageChange(0);
  };

  const filtroClass = (filtro: string) =>
    `px-4 py-2 text-sm font-semibold rounded-btn transition-colors ${
      statusFilter === filtro
        ? 'bg-brand text-on-brand shadow-btn'
        : 'bg-card text-muted border border-line hover:bg-surface'
    }`;

  return (
    <div className="space-y-4">
      {/* Barra de ações */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => trocarFiltro('active')}
            className={filtroClass('active')}
          >
            Ativos{contagens ? ` (${contagens.ativos})` : ''}
          </button>
          <button
            onClick={() => trocarFiltro('archived')}
            className={filtroClass('archived')}
          >
            <Archive size={16} className="inline mr-1" />
            Arquivados{contagens ? ` (${contagens.arquivados})` : ''}
          </button>
          <button
            onClick={() => trocarFiltro('all')}
            className={filtroClass('all')}
          >
            Todos{contagens ? ` (${contagens.total})` : ''}
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-line rounded-card shadow-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-subtle border-b border-line">
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
              {safeLeads.length === 0 ? (
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
                safeLeads.map((lead) => {
                  const status = STATUS_CONFIG[lead.status];
                  if (!status) {
                    console.error("Status inválido:", lead.status);
                    return null;
                  }
                  return (
                    <tr key={lead.id} className="hover:bg-surface">
                      <td className="px-4 py-4"><div className="font-medium text-ink">{lead.nome}</div></td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-ink"><Phone size={14} className="text-muted" />{formatarTelefone(lead.telefone)}</div>
                          <div className="flex items-center gap-2 text-sm text-muted"><Mail size={14} className="text-muted" aria-hidden="true" />{lead.email || <span className="italic">Sem e-mail</span>}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select value={lead.status} onChange={(e) => {
                            const newStatus = e.target.value as Lead['status']
                            if (newStatus === 'descarte') {
                              // o descarte exige motivo (LeadsService): abre o formulário com o status já marcado
                              confirmar({
                                titulo: `Descartar o lead ${lead.nome}?`,
                                mensagem: 'Na próxima etapa você informará o motivo do descarte. O lead só será descartado quando você salvar o formulário.',
                                confirmarLabel: 'Continuar',
                                perigo: true,
                              }).then(ok => { if (ok) onEdit({ ...lead, status: newStatus }); });
                            } else onStatusChange(lead.id, newStatus);
                          }} className={`px-3 py-1 text-xs font-bold border-0 cursor-pointer rounded-full ${status.color}`}>
                          <option value="lead">Lead</option><option value="oportunidade">Oportunidade</option><option value="visita-agendada">Visita Agendada</option><option value="visita-realizada">Visita Realizada</option><option value="pasta">Pasta</option><option value="aprovado">Aprovado</option><option value="contrato">Contrato</option><option value="descarte">Descarte</option>
                        </select>
                        {lead.status === 'descarte' && lead.motivoDescarte && (<p className="text-xs text-danger mt-2"><strong>Motivo:</strong> {lead.motivoDescarte}</p>)}
                      </td>
                      <td className="px-4 py-4"><div className="text-sm font-medium text-ink">R$ {(lead.valorInteresse ?? 0).toLocaleString('pt-BR')}</div></td>
                      <td className="px-4 py-4"><div className="space-y-1"><span className="text-sm font-medium text-ink">{origemLabel(lead.origem)}</span>{lead.historico && (<span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-subtle text-muted">{historicoLabel(lead.historico)}</span>)}</div></td>
                      <td className="px-4 py-4"><div className="text-xs"><p className="font-medium text-ink">{(lead as any).corretor?.nome || (lead as any).corretorNome || lead.corretorNome || '-'}</p><p className="text-muted">{(lead as any).equipe?.nome || (lead as any).equipeNome || lead.equipeNome || '-'}</p>{(lead.statusAtribuicao === 'AGUARDANDO_REDISTRIBUICAO' || (lead as any).statusAtribuicao==='AGUARDANDO_REDISTRIBUICAO') && (<span className="inline-flex mt-1 px-2 py-0.5 bg-warning-bg text-warning rounded-full text-[10px] font-bold">AGUARDANDO</span>)}</div></td>
                      <td className="px-4 py-4"><div className="text-sm text-muted">{format(new Date(lead.dataAtualizacao), 'dd/MM/yy', { locale: ptBR })}</div></td>
                      <td className="px-4 py-4"><div className="flex items-center justify-center gap-2"><button onClick={() => onView(lead)} className="p-2 rounded-lg text-brand-fg hover:bg-brand-soft"><Eye size={16} /></button><button onClick={() => onEdit(lead)} className="p-2 rounded-lg text-muted hover:bg-surface"><Edit size={16} /></button></div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-line">
          {safeLeads.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <Search size={32} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum lead encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            safeLeads.map((lead) => {
              const status = STATUS_CONFIG[lead.status];
              if (!status) return null;
              return (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-ink line-clamp-1">{lead.nome}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full shrink-0 ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="text-sm text-muted space-y-1">
                    <div className="flex items-center gap-2"><Phone size={14} />{formatarTelefone(lead.telefone)}</div>
                    <div className="flex items-center gap-2"><Mail size={14} aria-hidden="true" />{lead.email || <span className="italic">Sem e-mail</span>}</div>
                    <div className="flex items-center gap-2"><DollarSign size={14} />R$ {(lead.valorInteresse ?? 0).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{format(new Date(lead.dataAtualizacao), 'dd/MM/yy')}</span>
                    <div className="flex gap-2">
                      <button onClick={() => onView(lead)} aria-label={`Ver detalhes de ${lead.nome}`} className="p-2 rounded-lg text-brand-fg bg-brand-soft"><Eye size={16} aria-hidden="true" /></button>
                      <button onClick={() => onEdit(lead)} aria-label={`Editar ${lead.nome}`} className="p-2 rounded-lg text-muted bg-surface"><Edit size={16} aria-hidden="true" /></button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Paginação (dados paginados no backend) */}
        <Paginacao
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          quantidadeNaPagina={safeLeads.length}
          size={size}
          onPageChange={onPageChange}
          onSizeChange={onSizeChange}
          rotulo={['lead', 'leads']}
        />
      </div>
    </div>
  );
}
