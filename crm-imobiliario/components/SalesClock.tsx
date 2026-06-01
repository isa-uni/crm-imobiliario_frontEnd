'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lead } from '@/types';
import { getLeads } from '@/lib/data';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  CheckCircle, 
  Clock,
  Award,
  Send,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, differenceInDays, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyMetrics {
  date: string;
  leads: number;
  oportunidades: number;
  visitasAgendadas: number;
  visitasRealizadas: number;
  pastas: number;
  aprovados: number;
  contratos: number;
}

interface MetaConfig {
  contratos: number;
  ratios: {
    leads: number;        // 33 leads = 1 contrato
    oportunidades: number; // 20 ops = 1 contrato
    visitasAgendadas: number; // 10 vis agend = 1 contrato
    visitasRealizadas: number; // 8 vis real = 1 contrato
    pastas: number;    // 4 pastas = 1 contrato
    aprovados: number;    // 2 aprovados = 1 contrato
  };
}

export default function SalesClock() {
  const [metaMensal, setMetaMensal] = useState<number>(2);
  const [showSetup, setShowSetup] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const ratios: MetaConfig['ratios'] = {
    leads: 33,
    oportunidades: 20,
    visitasAgendadas: 10,
    visitasRealizadas: 8,
    pastas: 4,
    aprovados: 2,
  };

  useEffect(() => {
    loadData();
    loadMeta();
  }, []);

  const loadData = () => {
    const allLeads = getLeads();
    setLeads(allLeads);
  };

  const loadMeta = () => {
    const stored = localStorage.getItem('sales_clock_meta');
    if (stored) {
      const data = JSON.parse(stored);
      setMetaMensal(data.contratos);
      setShowSetup(false);
    } else {
      setShowSetup(true);
    }
  };

  const saveMeta = (contratos: number) => {
    localStorage.setItem('sales_clock_meta', JSON.stringify({ 
      contratos,
      startDate: format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
    }));
    setMetaMensal(contratos);
    setShowSetup(false);
  };

  // Cálculo automático baseado nos leads do mês
  const metricsDoMes = useMemo(() => {
    const inicio = startOfMonth(selectedMonth);
    const fim = endOfMonth(selectedMonth);

    const leadsDoMes = leads.filter(lead => {
      const dataLead = new Date(lead.dataCriacao);
      return dataLead >= inicio && dataLead <= fim;
    });

    return {
      leads: leadsDoMes.length,
      oportunidades: leadsDoMes.filter(l => 
        ['oportunidade', 'visita-agendada', 'visita-realizada', 'pasta', 'contrato'].includes(l.status)
      ).length,
      visitasAgendadas: leadsDoMes.filter(l => 
        ['visita-agendada', 'visita-realizada', 'pasta', 'contrato'].includes(l.status)
      ).length,
      visitasRealizadas: leadsDoMes.filter(l => 
        ['visita-realizada', 'pasta', 'contrato'].includes(l.status)
      ).length,
      pastas: leadsDoMes.filter(l => 
        ['pasta', 'contrato'].includes(l.status)
      ).length,
      aprovados: leadsDoMes.filter(l => l.status === 'contrato').length,
      contratos: leadsDoMes.filter(l => l.status === 'contrato').length,
    };
  }, [leads, selectedMonth]);

  // Metas calculadas
  const metas = {
    leads: metaMensal * ratios.leads,
    oportunidades: metaMensal * ratios.oportunidades,
    visitasAgendadas: metaMensal * ratios.visitasAgendadas,
    visitasRealizadas: metaMensal * ratios.visitasRealizadas,
    pastas: metaMensal * ratios.pastas,
    aprovados: metaMensal * ratios.aprovados,
    contratos: metaMensal,
  };

  // Cálculo de progresso
  const hoje = new Date();
  const inicioMes = startOfMonth(selectedMonth);
  const fimMes = endOfMonth(selectedMonth);
  const diasNoMes = differenceInDays(fimMes, inicioMes) + 1;
  const diasPassados = differenceInDays(hoje, inicioMes) + 1;
  const progressoEsperado = (diasPassados / diasNoMes) * 100;

  // Status de cada métrica
  const getStatus = (realizado: number, meta: number) => {
    const percentual = (realizado / meta) * 100;
    if (percentual >= progressoEsperado + 10) return 'adiantado';
    if (percentual >= progressoEsperado - 5) return 'no-prazo';
    return 'atrasado';
  };

  const metrics = [
    { 
      key: 'leads', 
      label: 'Leads', 
      icon: TrendingUp, 
      color: 'blue',
      realizado: metricsDoMes.leads,
      meta: metas.leads
    },
    { 
      key: 'oportunidades', 
      label: 'Oportunidades', 
      icon: Target, 
      color: 'indigo',
      realizado: metricsDoMes.oportunidades,
      meta: metas.oportunidades
    },
    { 
      key: 'visitasAgendadas', 
      label: 'Visitas Agendadas', 
      icon: Calendar, 
      color: 'teal',
      realizado: metricsDoMes.visitasAgendadas,
      meta: metas.visitasAgendadas
    },
    { 
      key: 'visitasRealizadas', 
      label: 'Visitas Realizadas', 
      icon: CheckCircle, 
      color: 'green',
      realizado: metricsDoMes.visitasRealizadas,
      meta: metas.visitasRealizadas
    },
    { 
      key: 'pastas', 
      label: 'Pastas', 
      icon: BarChart3, 
      color: 'orange',
      realizado: metricsDoMes.pastas,
      meta: metas.pastas
    },
    { 
      key: 'aprovados', 
      label: 'Aprovados', 
      icon: CheckCircle, 
      color: 'cyan',
      realizado: metricsDoMes.aprovados,
      meta: metas.aprovados
    },
    { 
      key: 'contratos', 
      label: 'Contratos Fechados', 
      icon: Award, 
      color: 'purple',
      realizado: metricsDoMes.contratos,
      meta: metas.contratos
    },
  ];

  const gerarRelatorio = () => {
    const texto = `*RELATÓRIO DE VENDAS - ${format(selectedMonth, 'MMMM/yyyy', { locale: ptBR })}*\n\n` +
      `📊 *RESULTADOS:*\n` +
      metrics.map(m => 
        `• ${m.label}: ${m.realizado}/${m.meta} (${((m.realizado/m.meta)*100).toFixed(0)}%)`
      ).join('\n') +
      `\n\n🎯 *META:* ${metricsDoMes.contratos}/${metaMensal} contratos` +
      `\n📅 *Período:* ${diasPassados} de ${diasNoMes} dias`;

    const encoded = encodeURIComponent(texto);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border-l-8 border-blue-600">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Novo Mês, Nova Meta! 🚀
            </h2>
            <p className="text-gray-600">
              Defina quantos contratos você quer fechar este mês
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 uppercase mb-2">
              Meta de Contratos
            </label>
            <input
              type="number"
              value={metaMensal}
              onChange={(e) => setMetaMensal(Number(e.target.value))}
              className="w-full text-4xl font-bold p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-center text-blue-600"
              min="1"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-6">
            <p className="font-bold mb-2">
              <AlertCircle size={16} className="inline mr-2" />
              Métrica de Conversão:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>• 1 Contrato = 33 Leads</div>
              <div>• 1 Contrato = 20 Ops</div>
              <div>• 1 Contrato = 10 Vis. Agend.</div>
              <div>• 1 Contrato = 8 Vis. Real.</div>
              <div>• 1 Contrato = 4 Pastas</div>
              <div>• 1 Contrato = 2 Aprovados</div>
            </div>
          </div>

          <button
            onClick={() => saveMeta(metaMensal)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95"
          >
            Iniciar Mês
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Clock size={28} className="text-blue-400" />
                Relógio de Vendas
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-400">
                {diasNoMes - diasPassados}
              </div>
              <div className="text-sm text-gray-400">dias restantes</div>
              <button
                onClick={() => setShowSetup(true)}
                className="mt-2 text-xs text-red-400 hover:text-white underline"
              >
                Redefinir Meta
              </button>
            </div>
          </div>
        </div>

        {/* Resumo Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Meta do Mês</p>
                <p className="text-3xl font-bold text-blue-600">{metaMensal}</p>
                <p className="text-xs text-gray-500">contratos</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Realizado</p>
                <p className="text-3xl font-bold text-green-600">{metricsDoMes.contratos}</p>
                <p className="text-xs text-gray-500">
                  {((metricsDoMes.contratos / metaMensal) * 100).toFixed(0)}% da meta
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progresso Tempo</p>
                <p className="text-3xl font-bold text-purple-600">
                  {progressoEsperado.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">
                  Dia {diasPassados} de {diasNoMes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Detalhadas */}
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Funil de Vendas - Atualização Automática
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Os valores são calculados automaticamente baseados nos leads cadastrados
          </p>

          <div className="space-y-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const percentual = (metric.realizado / metric.meta) * 100;
              const status = getStatus(metric.realizado, metric.meta);
              
              let statusColor = 'bg-yellow-500';
              let statusText = 'No Prazo';
              if (status === 'adiantado') {
                statusColor = 'bg-green-500';
                statusText = 'Adiantado';
              } else if (status === 'atrasado') {
                statusColor = 'bg-red-500';
                statusText = 'Atrasado';
              }

              return (
                <div key={metric.key}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={`text-${metric.color}-600`} />
                      <span className="font-semibold text-gray-700">{metric.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-gray-600">
                        {metric.realizado} / {metric.meta}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full text-white ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-3">
                    {/* Linha de progresso esperado */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                      style={{ left: `${progressoEsperado}%` }}
                      title={`Progresso esperado: ${progressoEsperado.toFixed(0)}%`}
                    />
                    {/* Barra de progresso real */}
                    <div 
                      className={`bg-${metric.color}-500 h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(percentual, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{percentual.toFixed(0)}% concluído</span>
                    {metric.key !== 'contratos' && (
                      <span>
                        Conversão: {metric.realizado > 0 && metrics[0].realizado > 0
                          ? ((metric.realizado / metrics[0].realizado) * 100).toFixed(0)
                          : 0}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-4">
          <button
            onClick={gerarRelatorio}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} />
            Enviar Relatório WhatsApp
          </button>
          <button
            onClick={loadData}
            className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow transition-all"
          >
            Atualizar Dados
          </button>
        </div>
      </div>
    </div>
  );
}
