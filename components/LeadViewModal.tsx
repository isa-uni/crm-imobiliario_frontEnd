'use client';

import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, Tramitacao } from '@/types';
import { X, Phone, Mail, Calendar, DollarSign, Building2, MapPin, FileText, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { origemOptions } from '@/service/origemOptions';
import { leadService } from '@/service/leadService';
import { useToast } from '@/components/ui/ToastProvider';
import { parseApiError } from '@/lib/errorHandler';
import { InlineError } from '@/components/ui/ErrorState';


interface LeadViewModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export default function LeadViewModal({ lead, isOpen, onClose, onEdit }: LeadViewModalProps) {
  const { toast } = useToast();
  const [tramitacoes, setTramitacoes] = useState<Tramitacao[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [tramitacoesError, setTramitacoesError] = useState<string | null>(null);

  useEffect(() => {
    if (!lead) return;
    setLoadingHistorico(true);
    setTramitacoesError(null);
    leadService
      .getTramitacoes(lead.id)
      .then((data) => {
        setTramitacoes(data);
        setTramitacoesError(null);
      })
      .catch((err: any) => {
        const parsed = parseApiError(err);
        setTramitacoes([]);
        setTramitacoesError(parsed.message);
        toast(parsed.message, 'error');
        console.error('Erro ao carregar tramitações', err);
      })
      .finally(() => setLoadingHistorico(false));
  }, [lead]);

  if (!isOpen || !lead) return null;

  const statusLabels: Record<LeadStatus, string> = {
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
    'lead': 'bg-[#eef2f7] text-[#5f7488]',
    'oportunidade': 'bg-[#eaf1f8] text-[#27506f]',
    'visita-agendada': 'bg-[#fdf3e0] text-[#b8790a]',
    'visita-realizada': 'bg-[#eef1fd] text-[#5258a8]',
    'pasta': 'bg-[#fdf1ec] text-[#c05621]',
    'aprovado': 'bg-[#e8f6ee] text-[#0f8a52]',
    'contrato': 'bg-[#e8f6ee] text-[#0f7a45]',
    'descarte': 'bg-[#fdeceb] text-[#c0392b]',
  };

  const formatarTelefone = (telefone: string) => {
    return telefone
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const getOrigemLabel = (value: string) => {
    return origemOptions.find((o) => o.value === value)?.label || value;
  };

  const getStatusLabel = (status: LeadStatus | null) => {
    if (!status) return 'Criação';
    return statusLabels[status];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-card shadow-card-lg">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-line sticky top-0 bg-white z-10">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-ink">{lead.nome}</h2>
            <span className={`inline-block px-3 py-1 text-xs font-bold mt-2 rounded-full ${statusColors[lead.status]}`}>
              {statusLabels[lead.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações de Contato */}
          <div>
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
              Informações de Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#eaf1f8] rounded-lg">
                  <Phone size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Telefone</p>
                  <p className="text-sm font-medium text-ink">{formatarTelefone(lead.telefone)}</p>
                  <a 
                    href={`tel:${formatarTelefone(lead.telefone)}`} 
                    className="text-xs text-primary hover:text-primary-700 mt-1 inline-block"
                  >
                    Ligar agora
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f3eefb] rounded-lg">
                  <Mail size={20} className="text-[#7a5ca8]" />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Email</p>
                  <p className="text-sm font-medium text-ink break-all">{lead.email}</p>
                  <a 
                    href={`mailto:${lead.email}`} 
                    className="text-xs text-[#7a5ca8] hover:text-[#6a4c98] mt-1 inline-block"
                  >
                    Enviar email
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes do Imóvel */}
          <div>
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
              Interesse de Compra
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#e8f6ee] rounded-lg">
                  <DollarSign size={20} className="text-[#0f8a52]" />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Valor de Interesse</p>
                  <p className="text-lg font-bold text-[#0f8a52]">
                    R$ {lead.valorInteresse.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#fdf1ec] rounded-lg">
                  <Building2 size={20} className="text-[#c05621]" />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Imóvel de Interesse</p>
                  <p className="text-sm font-medium text-ink">{lead.imovel?.titulo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Origem e Datas */}
          <div>
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
              Informações Adicionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#eef1fd] rounded-lg">
                  <MapPin size={20} className="text-[#5258a8]" />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Origem do Lead</p>
                  <p className="text-sm font-medium text-ink">{getOrigemLabel(lead.origem)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface rounded-lg">
                  <Calendar size={20} className="text-muted" />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Data de Criação</p>
                  <p className="text-sm font-medium text-ink">
                    {format(lead.dataCriacao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Atualizado em {format(lead.dataAtualizacao, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          {lead.observacao && (
            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                Observações
              </h3>
              <div className="flex gap-3">
                <div className="p-2 bg-[#fdf3e0] rounded-lg h-fit">
                  <FileText size={20} className="text-[#b8790a]" />
                </div>
                <div className="flex-1 p-4 bg-surface rounded-btn border border-line">
                  <p className="text-sm text-ink whitespace-pre-wrap">
                    {lead.observacao}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Histórico de Status */}
          <div className="pt-4 border-t border-line">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
              Histórico de Status
            </h3>
            {tramitacoesError && <InlineError message={tramitacoesError} />}

            {loadingHistorico ? (
              <p className="text-sm text-muted">Carregando...</p>
            ) : tramitacoes.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sem movimentações registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tramitacoes.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 bg-surface border border-line p-3 rounded-btn">
                    <div className="mt-1 text-muted">
                      <ArrowRight size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">
                        {getStatusLabel(t.statusAnterior)} → {getStatusLabel(t.statusAtual)}
                      </p>
                      <p className="text-xs text-muted mt-1">
                        {format(new Date(t.dataMovimentacao), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        {t.usuarioNome ? ` · por ${t.usuarioNome}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-line bg-surface">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted hover:bg-white transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-btn font-semibold shadow-btn hover:bg-primary-700 transition-colors"
          >
            Editar Lead
          </button>
        </div>
      </div>
    </div>
  );
}
