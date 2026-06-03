'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lead } from '@/types';
// import { getLeads, saveLead, updateLead, deleteLead, getMetrics, pipelineStages } from '@/lib/data';
import { leadService } from '@/service/leadService';
import { imovelService } from '@/service/imovelService';
import { pipelineStages } from '@/service/pipelineStages';
import { processLeadsChartData, processRevenueChartData } from '@/lib/chartUtils';
import MetricCard from '@/components/MetricCard';
import LeadCard from '@/components/LeadCard';
import LeadModal from '@/components/LeadModal';
import FilterBar from '@/components/FilterBar';
import LeadsEvolutionChart from '@/components/LeadsEvolutionChart';
import RevenueChart from '@/components/RevenueChart';
import { Users, TrendingUp, Calendar, DollarSign, CheckCircle, CalendarCheck,FolderOpen, FolderCheck , Plus, Filter, BarChart3 } from 'lucide-react';
import { useMounted } from './useMounted'
import { format, isWithinInterval, parseISO } from 'date-fns';


export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  // const [metrics, setMetrics] = useState(getMetrics());
  const [metrics, setMetrics] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<Lead['status'] | 'all'>('all');
  const [showCharts, setShowCharts] = useState(true);
  const [errors, setErrors] = useState<any>({});
  
  const [filters, setFilters] = useState({
      period: 'all',
      startDate: null as string | null,
      endDate: null as string | null,
    });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await leadService.getAll();
    const metricsData = await leadService.getMetrics();
    setLeads(data);
    setMetrics(metricsData);
  };

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
   // Filtrar leads por data
  const filteredByDate = useMemo(() => {
    if (!filters.startDate || !filters.endDate) {
      return leads;
    }

    const startDate = parseLocalDate(filters.startDate);
    const endDate = parseLocalDate(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    return leads.filter((lead) => {
      const leadDate = new Date(lead.dataAtualizacao);
      return leadDate >= startDate && leadDate <= endDate;
    });
  }, [leads, filters.startDate, filters.endDate]);


  // Filtrar por status
  const filteredLeads = useMemo(() => {
    return filterStatus === 'all'
      ? filteredByDate
      : filteredByDate.filter((lead) => lead.status === filterStatus);
  }, [filteredByDate, filterStatus]);

   // Dados dos gráficos
  const leadsChartData = useMemo(() => {
    return processLeadsChartData(leads, filters.startDate || undefined, filters.endDate || undefined);
  }, [leads, filters.startDate, filters.endDate]);

  const revenueChartData = useMemo(() => {
    return processRevenueChartData(leads, filters.startDate || undefined, filters.endDate || undefined);
  }, [leads, filters.startDate, filters.endDate]);


  const mounted = useMounted()

  if (!mounted) return null

  // Função de exportação para Excel/CSV
  const handleExport = () => {
    const csvData = [
      ['Nome', 'Telefone', 'Email', 'Status', 'Valor', 'Origem', 'Data Criação', 'Última Atualização'],
      ...filteredLeads.map((lead) => [
        lead.nome,
        lead.telefone,
        lead.email,
        lead.status,
        lead.valorInteresse.toString(),
        // lead.tipoImovel,
        lead.origem,
        format(lead.dataCriacao, 'dd/MM/yyyy'),
        format(lead.dataAtualizacao, 'dd/MM/yyyy'),
      ]),
    ];

    const csvContent = csvData.map((row) => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      } else {
        await leadService.cadastrar(payload);
      }

      await loadData(); // recarrega lista
      setEditingLead(null);
      setErrors({}); // 👈 limpa erros
      setIsModalOpen(false); // 👈 fecha AQUI
      return true;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors: any = {};

        error.response.data.errors.forEach((err: any) => {
          backendErrors[err.field] = err.message;
        });

        setErrors(backendErrors);
      } else {
        alert("Erro ao salvar lead");
      }
      return false;
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  // const handleDeleteLead = (id: number) => {
  //   if (confirm('Tem certeza que deseja excluir este lead?')) {
  //     deleteLead(id);
  //     loadData();
  //   }
  // };

  const handleStatusChange = async (id: number, newStatus: Lead['status'], motivo?: string) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? { ...lead, newStatus, motivoDescarte: motivo || undefined }
          : lead
      )
    );
    await leadService.atualizar(id, { status: newStatus, motivoDescarte: newStatus === 'descarte' ? motivo : undefined});
    await loadData();
  };

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const stageOrder = { lead: 1, oportunidade: 2, 'visita-agendada': 3, 'visita-realizada': 4, pasta: 5, aprovado: 6, contrato: 7, descarte: 8 };
    return stageOrder[a.status] - stageOrder[b.status];
  });

  // const filteredLeads = filterStatus === 'all' 
  //   ? leads 
  //   : leads.filter(lead => lead.status === filterStatus);

  // const sortedLeads = [...filteredLeads].sort((a, b) => {
  //   const stageOrder = { 'lead': 1, 'oportunidade': 2, 'visita-agendada': 3, 'visita-realizada': 4, 'pasta': 5, 'aprovado': 6, 'contrato': 7, 'descarte': 8};
  //   return stageOrder[a.status] - stageOrder[b.status];
  // });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CRM Imobiliário</h1>
              <p className="text-gray-600 mt-1">Gerencie seus leads e vendas com análises avançadas</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <BarChart3 size={20} />
                {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
              </button>
              <button
                onClick={() => {
                  setEditingLead(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Plus size={20} />
                Novo Lead
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {/* Barra de Filtros */}
        <div className="mb-8">
          <FilterBar filters={filters} setFilters={setFilters} onExport={handleExport} />
        </div>
        {/* Gráficos */}
        {showCharts && leadsChartData.length > 0 && (
          <div className="space-y-6 mb-8">
            <LeadsEvolutionChart data={leadsChartData} />
            <RevenueChart data={revenueChartData} />
          </div>
        )}
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Leads"
            // value={metrics.totalLeads}
            value={filteredLeads.filter((l) => l.status === 'lead').length}
            icon={<span><Users size={24} /></span>}
            color="bg-slate-500"
            subtitle={`${filteredLeads.length} total`}
          />
          <MetricCard
            title="Oportunidades"
            // value={metrics.totalOportunidades}
            value={filteredLeads.filter((l) => l.status === 'oportunidade').length}
            icon={<TrendingUp size={24} />}
            color="bg-blue-500"
          />
          <MetricCard
            title="Visitas Agendadas"
            // value={metrics.totalVisitasAgen}
            value={filteredLeads.filter((l) => l.status === 'visita-agendada').length}
            icon={<Calendar size={24} />}
            color="bg-amber-500"
          />
          <MetricCard
            title="Visitas Realizadas"
            // value={metrics.totalVisitasReal}
            value={filteredLeads.filter((l) => l.status === 'visita-realizada').length}
            icon={<CalendarCheck size={24} />}
            color="bg-purple-500"
          />
          <MetricCard
            title="Pastas"
            // value={metrics.totalPastas}
            value={filteredLeads.filter((l) => l.status === 'pasta').length}
            icon={<FolderOpen size={24} />}
            color="bg-fuchsia-500"
          />
          <MetricCard
            title="Aprovado"
            // value={metrics.totalAprovados}
            value={filteredLeads.filter((l) => l.status === 'aprovado').length}
            icon={<FolderCheck size={24} />}
            color="bg-teal-500"
          />
          {/* <MetricCard
            title="Descarte"
            value={metrics.totalDescartes}
            icon={<CalendarCheck size={24} />}
            color="bg-red-500"
          /> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <MetricCard
            title="Vendas Fechadas"
            // value={metrics.totalContratos}
            value={filteredLeads.filter((l) => l.status === 'contrato').length}
            icon={<CheckCircle size={24} />}
            color="bg-green-500"
            // subtitle={`R$ ${metrics.valorTotalFechado.toLocaleString('pt-BR')}`}
            subtitle={`R$ ${filteredLeads
              .filter((l) => l.status === 'contrato')
              .reduce((sum, l) => sum + l.valorInteresse, 0)
              .toLocaleString('pt-BR')}`}
          />
          {metrics && (
            <MetricCard
              title="Taxa de Conversão"
              value={`${metrics.taxaConversaoGeral.toFixed(1)}%`}
              icon={<TrendingUp size={24} />}
              color="bg-cyan-500"
              subtitle={`${metrics.totalDescartes} perdidos`}
            />
          )}
        </div>

        {/* Filtros de Status */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={20} className="text-gray-600" />
            <span className="font-semibold text-gray-700">Filtrar por status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todos ({filteredByDate.length})
            </button>
            {pipelineStages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => setFilterStatus(stage.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterStatus === stage.id
                    ? stage.cor.replace('bg-', 'bg-') + ' text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {stage.nome} ({filteredByDate.filter((l) => l.status === stage.id).length})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Leads */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {filterStatus === 'all'
              ? 'Todos os Leads'
              : `Leads - ${pipelineStages.find((s) => s.id === filterStatus)?.nome}`}
          </h2>

          {sortedLeads.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Nenhum lead encontrado para este período</p>
              <button
                onClick={() => {
                  setEditingLead(null);
                  setIsModalOpen(true);
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Adicionar primeiro lead
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={handleEditLead}
                  // onDelete={handleDeleteLead}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Funil de Vendas */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Funil de Vendas</h2>
          <div className="space-y-4">
            {pipelineStages
              .filter((s) => s.id !== 'descarte')
              .map((stage) => {
                const count = filteredLeads.filter((l) => l.status === stage.id).length;
                const percentage = filteredLeads.length > 0 ? (count / filteredLeads.length) * 100 : 0;

                return (
                  <div key={stage.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">{stage.nome}</span>
                      <span className="text-sm text-gray-600">
                        {count} leads ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`${stage.cor} h-4 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {stage.taxaConversao && (
                      <p className="text-xs text-gray-500">Taxa de conversão esperada: {stage.taxaConversao}%</p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </main>

      {/* Modal */}
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
    </div>
  );
}
