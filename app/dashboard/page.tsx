'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lead, Imovel } from '@/types';
import { getLeads } from '@/lib/data';
// import { getImoveis } from '@/lib/imoveis';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Target,
  DollarSign,
  ArrowUp,
  ArrowDown,
  CheckCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { authService } from '@/service/authService';
import { leadService } from '@/service/leadService';
import { imovelService } from '@/service/imovelService';
import Funil from "@/components/FunilDashboard";


export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [nome, setNome] = useState<string>('');


  useEffect(() => {
    setNome(authService.getUsuario()?.nome?.split(' ')[0] || '');
    loadData();
    // setImoveis(getImoveis());
  }, []);

  const loadData = async () => {
    const dataLead = await leadService.getAll();
    const dataImovel = await imovelService.getAll();
    
    setLeads(dataLead);
    setImoveis(dataImovel);
  };

   {/*
  const funil: EtapaFunil[] = [
    {
      nome: "Leads",
      quantidade: leads.filter(l => ['lead'].includes(l.status)).length,
      percentual: 100,
    },
    {
      nome: "Qualificação",
      quantidade: leads.filter(l => ['lead'].includes(l.status)).length,
      percentual: 79.2,
    },
    {
      nome: "Proposta",
      quantidade: leads.filter(l => ['lead'].includes(l.status)).length,
      percentual: 51.7,
    },
    {
      nome: "Negociação",
      quantidade: leads.filter(l => ['lead'].includes(l.status)).length,
      percentual: 31.7,
    },
    {
      nome: "Fechados",
      quantidade: leads.filter(l => ['lead'].includes(l.status)).length,
      percentual: 17.5,
    },
  ];
*/}
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
    <div className="min-h-screen bg-gray-100">
      {/* Header Simples */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Olá, {nome}! Seja bem-vindo
            </h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Cards Principais - 4 métricas essenciais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Leads Ativos */}
          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-gray-600" />
                <p className="text-sm text-gray-600">Leads Ativos</p>
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
            <p className="text-xs text-gray-500 mt-1">{stats.leadsTotal} total este mês</p>
          </div>

          {/* Fechamentos */}
          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-gray-600" />
                <p className="text-sm text-gray-600">Contratos Fechados</p>
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
            <p className="text-xs text-gray-500 mt-1">este mês</p>
          </div>

          {/* Faturamento */}
          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={20} className="text-gray-600" />
              <p className="text-sm text-gray-600">Valor Contrato</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {(stats.valorContrato / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-gray-500 mt-1">este mês</p>
          </div>

          {/* Taxa de Conversão */}
          <div className="bg-white border border-gray-300 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} className="text-gray-600" />
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.taxaConversao.toFixed(0)}%</p>
            <p className="text-xs text-gray-500 mt-1">este mês</p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <Link href="/leads" className="block">
            <div className="bg-white border border-gray-300 p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Gerenciar Leads
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Ver todos os {leads.length} leads
                  </p>
                </div>
                <Users size={32} className="text-gray-400" />
              </div>
            </div>
          </Link>

          <Link href="/relogio-vendas" className="block">
            <div className="bg-white border border-gray-300 p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Relógio de Vendas
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Acompanhar metas
                  </p>
                </div>
                <TrendingUp size={32} className="text-gray-400" />
              </div>
            </div>
          </Link>

          <Link href="/properties" className="block">
            <div className="bg-white border border-gray-300 p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Imóveis
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {imoveis.filter(i => i.status === 'disponivel').length} disponíveis
                  </p>
                </div>
                <Building2 size={32} className="text-gray-400" />
              </div>
            </div>
          </Link>
        </div>

        <Funil leads={leads} />
      </main>
    </div>
  );
}
