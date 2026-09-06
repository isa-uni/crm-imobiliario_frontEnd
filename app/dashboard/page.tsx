'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lead, Imovel, Metrics } from '@/types';
// import { getLeads } from '@/lib/data';
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
import LeadOrigemChart from "@/components/LeadOrigemChart";
import LeadImovelChart from "@/components/LeadImovelChart";
import LeadsContratosTimelineChart from "@/components/LeadsContratosTimelineChart";
import { useToast } from '@/components/ui/ToastProvider';
import { ErrorState } from '@/components/ui/ErrorState';
import { parseApiError } from '@/lib/errorHandler';


export default function Dashboard() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [nome, setNome] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //pegando somente o primeiro nome do usuario logado no localstorage
  useEffect(() => {
    setNome(authService.getUsuario()?.nome?.split(' ')[0] || '');
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataLead, dataImovel, dataMetrics] = await Promise.all([
        leadService.getAll({ page: 0, size: 20 }),
        imovelService.getAll(),
        leadService.getMetrics().catch(() => null),
      ]);
      const list = Array.isArray((dataLead as any)?.content) ? (dataLead as any).content : Array.isArray(dataLead) ? dataLead : [];
      setLeads(list.filter((x:any)=> x && x.id != null));
      const listImovel = Array.isArray((dataImovel as any)?.content) ? (dataImovel as any).content : Array.isArray(dataImovel) ? dataImovel : [];
      setImoveis(Array.isArray(listImovel) ? listImovel : []);
      if (dataMetrics) setMetrics(dataMetrics);
    } catch (e: any) {
      const parsed = parseApiError(e);
      setError(parsed.message);
      toast(parsed.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Métricas do mês atual
  const mesAtual = useMemo(() => {
    //new Date() = data atual
    //primeira data do mes atual
    const inicio = startOfMonth(new Date());
    //ultima data do mes
    const fim = endOfMonth(new Date());
    //lista de todo os leads
    return leads.filter(lead => {
      const data = new Date(lead.dataCriacao);
      //verificando se é um lead do mes atual
      return data >= inicio && data <= fim;
    });
  }, [leads]);

  // Métricas do mês anterior
  const mesAnterior = useMemo(() => {
    //Pega a data atual e volta 1 mês
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
    leadsAtivos: mesAtual.filter(l => !['contrato', 'descarte'].includes(l.status)).length, //conta os leads que não estão nos status contrato ou descarte
    leadsTotal: mesAtual.length, //Conta todos os leads do mês atual.
    contratos: mesAtual.filter(l => l.status === 'contrato').length, //Conta quantos leads chegaram ao status contrato
    valorContrato: mesAtual.filter(l => l.status === 'contrato').reduce((sum, l) => sum + l.valorInteresse, 0), //pega somente os contratos e depois soma o valorInteresse
    taxaConversao: mesAtual.length > 0 
      ? (mesAtual.filter(l => l.status === 'contrato').length / mesAtual.length) * 100 
      : 0, //calcula a porcentagem de leads que viraram contrato | contrato/totalLeads . 100
    variacaoLeads: calcularVariacao(mesAtual.length, mesAnterior.length), //compara a quantidade de leads
    variacaoContratos: calcularVariacao(
      mesAtual.filter(l => l.status === 'contrato').length,
      mesAnterior.filter(l => l.status === 'contrato').length
    ), //compara a quantidade de leads com status contrato
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-primary border-b border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-primary font-black text-sm shadow-btn">C</span>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Olá, {nome}!
              </h1>
            </div>
            <p className="text-primary-100/80 mt-1">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="bg-white border border-line rounded-card shadow-card p-12 text-center">
            <p className="text-muted animate-pulse">Carregando dashboard...</p>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <>
        {/* Cards Principais - 4 métricas essenciais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Leads Ativos */}
          <div className="bg-white border border-line rounded-card shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                  <Users size={18} />
                </span>
                <p className="text-sm text-muted">Leads Ativos</p>
              </div>
              {stats.variacaoLeads !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stats.variacaoLeads > 0 ? 'text-[#0f8a52]' : 'text-[#c0392b]'
                }`}>
                  {stats.variacaoLeads > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {Math.abs(stats.variacaoLeads).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-ink">{stats.leadsAtivos}</p>
            <p className="text-xs text-muted mt-1.5">{stats.leadsTotal} total este mês</p>
          </div>

          {/* Fechamentos */}
          <div className="bg-white border border-line rounded-card shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg bg-[#e8f6ee] text-[#0f8a52] flex items-center justify-center">
                  <CheckCircle size={18} />
                </span>
                <p className="text-sm text-muted">Contratos Fechados</p>
              </div>
              {stats.variacaoContratos !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stats.variacaoContratos > 0 ? 'text-[#0f8a52]' : 'text-[#c0392b]'
                }`}>
                  {stats.variacaoContratos > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  {Math.abs(stats.variacaoContratos).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-ink">{stats.contratos}</p>
            <p className="text-xs text-muted mt-1.5">este mês</p>
          </div>

          {/* Faturamento */}
          <div className="bg-white border border-line rounded-card shadow-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-lg bg-[#e8f6ee] text-[#0f8a52] flex items-center justify-center">
                <DollarSign size={18} />
              </span>
              <p className="text-sm text-muted">Valor Contrato</p>
            </div>
            <p className="text-3xl font-bold text-[#0f8a52]">
              R$ {(stats.valorContrato / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-muted mt-1.5">este mês</p>
          </div>

          {/* Taxa de Conversão */}
          <div className="bg-white border border-line rounded-card shadow-card p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-9 h-9 rounded-lg bg-accent-50 text-accent-700 flex items-center justify-center">
                <Target size={18} />
              </span>
              <p className="text-sm text-muted">Taxa de Conversão</p>
            </div>
            <p className="text-3xl font-bold text-ink">{stats.taxaConversao.toFixed(0)}%</p>
            <p className="text-xs text-muted mt-1.5">este mês</p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <Link href="/leads" className="block group">
            <div className="bg-white border border-line rounded-card shadow-card p-6 hover:shadow-card-lg hover:border-primary-200 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-ink group-hover:text-primary">
                    Gerenciar Leads
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    Ver todos os {leads.length} leads
                  </p>
                </div>
                <span className="w-12 h-12 rounded-lg bg-surface text-muted flex items-center justify-center group-hover:text-accent-600 transition-colors">
                  <Users size={28} />
                </span>
              </div>
            </div>
          </Link>

          <Link href="/relogio-vendas" className="block group">
            <div className="bg-white border border-line rounded-card shadow-card p-6 hover:shadow-card-lg hover:border-primary-200 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-ink group-hover:text-primary">
                    Relógio de Vendas
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    Acompanhar metas
                  </p>
                </div>
                <span className="w-12 h-12 rounded-lg bg-surface text-muted flex items-center justify-center group-hover:text-accent-600 transition-colors">
                  <TrendingUp size={28} />
                </span>
              </div>
            </div>
          </Link>

          <Link href="/properties" className="block group">
            <div className="bg-white border border-line rounded-card shadow-card p-6 hover:shadow-card-lg hover:border-primary-200 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-ink group-hover:text-primary">
                    Imóveis
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    {imoveis.filter(i => i.status === 'disponivel').length} disponíveis
                  </p>
                </div>
                <span className="w-12 h-12 rounded-lg bg-surface text-muted flex items-center justify-center group-hover:text-accent-600 transition-colors">
                  <Building2 size={28} />
                </span>
              </div>
            </div>
          </Link>
        </div>

        <Funil leads={leads} />

        <LeadsContratosTimelineChart />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LeadOrigemChart leads={leads} />
          <LeadImovelChart leads={leads} />
        </div>
          </>
        )}
      </main>
    </div>
  );
}
