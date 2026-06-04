'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lead } from '@/types';
import { getLeads } from '@/lib/data';
// import { getImoveis } from '@/lib/imoveis';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Target,
  Calendar,
  DollarSign,
  ArrowUp,
  ArrowDown,
  CheckCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [imoveis, setImoveis] = useState<any[]>([]);

  useEffect(() => {
    setLeads(getLeads());
    // setImoveis(getImoveis());
  }, []);

  // Métricas do mês atual
  const mesAtual = useMemo(() => {
    const inicio = startOfMonth(new Date());
    const fim = endOfMonth(new Date());
    return leads.filter(lead => {
      const data = new Date(lead.dataCriacao);
      return data >= inicio && data <= fim;
    });
  }, [leads]);

  // Métricas do mês anterior
  const mesAnterior = useMemo(() => {
    const inicio = startOfMonth(subMonths(new Date(), 1));
    const fim = endOfMonth(subMonths(new Date(), 1));
    return leads.filter(lead => {
      const data = new Date(lead.dataCriacao);
      return data >= inicio && data <= fim;
    });
  }, [leads]);

  // Cálculo de variações
  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return atual > 0 ? 100 : 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const stats = {
    leadsAtivos: mesAtual.filter(l => !['contrato', 'descarte'].includes(l.status)).length,
    leadsTotal: mesAtual.length,
    contratos: mesAtual.filter(l => l.status === 'contrato').length,
    valorContrato: mesAtual.filter(l => l.status === 'contrato').reduce((sum, l) => sum + l.valorInteresse, 0),
    taxaConversao: mesAtual.length > 0 
      ? (mesAtual.filter(l => l.status === 'contrato').length / mesAtual.length) * 100 
      : 0,
    variacaoLeads: calcularVariacao(mesAtual.length, mesAnterior.length),
    variacaoContratos: calcularVariacao(
      mesAtual.filter(l => l.status === 'contrato').length,
      mesAnterior.filter(l => l.status === 'contrato').length
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Simples */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Olá! Bem-vindo de volta 👋
            </h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Cards Principais - 4 métricas essenciais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Leads Ativos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
              {stats.variacaoLeads !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stats.variacaoLeads > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.variacaoLeads > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {Math.abs(stats.variacaoLeads).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.leadsAtivos}</p>
            <p className="text-sm text-gray-600 mt-1">Leads Ativos</p>
            <p className="text-xs text-gray-500 mt-2">{stats.leadsTotal} total este mês</p>
          </div>

          {/* Fechamentos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              {stats.variacaoContratos !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stats.variacaoContratos > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.variacaoContratos > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {Math.abs(stats.variacaoContratos).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.contratos}</p>
            <p className="text-sm text-gray-600 mt-1">Contratos Fechados</p>
            <p className="text-xs text-gray-500 mt-2">este mês</p>
          </div>

          {/* Faturamento */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {(stats.valorContrato / 1000).toFixed(0)}k
            </p>
            <p className="text-sm text-gray-600 mt-1">Valor Contrato</p>
            <p className="text-xs text-gray-500 mt-2">este mês</p>
          </div>

          {/* Taxa de Conversão */}
          <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target size={24} className="text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.taxaConversao.toFixed(0)}%</p>
            <p className="text-sm text-gray-600 mt-1">Taxa de Conversão</p>
            <p className="text-xs text-gray-500 mt-2">este mês</p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link href="/leads" className="block">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Gerenciar Leads
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Ver todos os {leads.length} leads
                  </p>
                </div>
                <Users size={32} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          </Link>

          <Link href="/relogio-vendas" className="block">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                    Relógio de Vendas
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Acompanhar metas
                  </p>
                </div>
                <TrendingUp size={32} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
            </div>
          </Link>

          <Link href="/properties" className="block">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    Imóveis
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {imoveis.filter(i => i.status === 'disponivel').length} disponíveis
                  </p>
                </div>
                <Building2 size={32} className="text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </div>
          </Link>
        </div>

        {/* Funil Simplificado */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Funil do Mês</h3>
          <div className="space-y-3">
            {[
              { label: 'Leads', count: mesAtual.length, color: 'blue' },
              { label: 'Oportunidades', count: mesAtual.filter(l => ['oportunidade', 'visita-agendada', 'visita-realizada', 'pasta', 'aprovados', 'contrato'].includes(l.status)).length, color: 'indigo' },
              { label: 'Visitas Agendadas', count: mesAtual.filter(l => ['visita-agendada', 'visita-realizada', 'pasta', 'aprovados', 'contrato'].includes(l.status)).length, color: 'purple' },
              { label: 'Visitas Realizadas', count: mesAtual.filter(l => ['visita-realizada', 'pasta', 'aprovados', 'contrato'].includes(l.status)).length, color: 'orange' },
              { label: 'Pastas', count: mesAtual.filter(l => ['pasta', 'aprovados', 'contrato'].includes(l.status)).length, color: 'orange' },
              { label: 'Aprovados', count: mesAtual.filter(l => ['aprovados', 'contrato'].includes(l.status)).length, color: 'orange' },
              { label: 'Contratos', count: mesAtual.filter(l => l.status === 'contrato').length, color: 'green' },
            ].map((stage, index) => {
              const percentage = mesAtual.length > 0 ? (stage.count / mesAtual.length) * 100 : 0;
              return (
                <div key={stage.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                    <span className="text-sm text-gray-600">{stage.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`bg-${stage.color}-500 h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
