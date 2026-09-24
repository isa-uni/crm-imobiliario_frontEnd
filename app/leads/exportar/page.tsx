'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { leadService } from '@/service/leadService';
import { origemOptions } from '@/service/origemOptions';
import { historicoOptions } from '@/service/historicoOptions';
import { useToast } from '@/components/ui/ToastProvider';
import { parseApiError } from '@/lib/errorHandler';

const inputClass = "w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30";

export default function ExportarLeadsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [origemFilter, setOrigemFilter] = useState('all');
  const [historicoFilter, setHistoricoFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const handleExportar = async () => {
    setLoading(true);
    try {
      const blob = await leadService.exportarExcel({
        search: searchTerm,
        status: statusFilter,
        month: monthFilter,
        origem: origemFilter,
        historico: historicoFilter,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast('Exportação gerada com sucesso.', 'success');
    } catch (e: any) {
      toast(parseApiError(e).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <span className="w-12 h-12 rounded-xl bg-brand text-on-brand flex items-center justify-center shadow-btn">
            <FileSpreadsheet size={24} />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-ink tracking-tight">Exportar Leads</h1>
            <p className="text-muted">Gere um relatório em Excel com seus leads, funil de vendas, origem e histórico</p>
          </div>
        </div>

        <div className="bg-card border border-line rounded-card shadow-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted mb-1">Buscar (nome, telefone ou email)</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={inputClass}
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="archived">Arquivados (contrato/descarte)</option>
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
              <label className="block text-sm font-medium text-muted mb-1">Período</label>
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className={inputClass}>
                <option value="all">Todo o período</option>
                <option value="current">Mês atual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Origem</label>
              <select value={origemFilter} onChange={(e) => setOrigemFilter(e.target.value)} className={inputClass}>
                <option value="all">Todas</option>
                {origemOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">Histórico</label>
              <select value={historicoFilter} onChange={(e) => setHistoricoFilter(e.target.value)} className={inputClass}>
                <option value="all">Todos</option>
                {historicoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportar}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              {loading ? 'Gerando...' : 'Exportar Excel'}
            </button>
            <p className="text-xs text-muted mt-2">
              O arquivo inclui a lista de leads filtrada, o funil de vendas, a origem dos leads e o histórico (novo/reaquecido/vencido).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
