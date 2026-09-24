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
  ArrowUpRight,
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
      <header className="bg-sidebar border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-on-accent font-black text-sm shadow-btn">C</span>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Olá, {nome}!
              </h1>
            </div>
            <p className="text-sidebar-fg/80 mt-1">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="bg-card border border-line rounded-card shadow-card p-12 text-center">
            <p className="text-muted animate-pulse">Carregando dashboard...</p>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <>
        {/* Cards Principais - 4 métricas essenciais */}
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Visão geral do mês</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Leads Ativos */}
            <div className="bg-card border border-line rounded-card shadow-card hover:shadow-card-lg transition-shadow p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand-fg flex items-center justify-center">
                  <Users size={18} />
                </span>
                {stats.variacaoLeads !== 0 && (
                  <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
                    stats.variacaoLeads > 0 ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
                  }`}>
                    {stats.variacaoLeads > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(stats.variacaoLeads).toFixed(0)}%
                  </div>
                )}
              </div>
              <p className="text-sm text-muted mb-1">Leads Ativos</p>
              <p className="text-3xl font-bold text-ink tracking-tight">{stats.leadsAtivos}</p>
              <p className="text-xs text-muted mt-1.5">{stats.leadsTotal} total este mês</p>
            </div>

            {/* Fechamentos */}
            <div className="bg-card border border-line rounded-card shadow-card hover:shadow-card-lg transition-shadow p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="w-10 h-10 rounded-xl bg-success-bg text-success flex items-center justify-center">
                  <CheckCircle size={18} />
                </span>
                {stats.variacaoContratos !== 0 && (
                  <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
                    stats.variacaoContratos > 0 ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
                  }`}>
                    {stats.variacaoContratos > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(stats.variacaoContratos).toFixed(0)}%
                  </div>
                )}
              </div>
              <p className="text-sm text-muted mb-1">Contratos Fechados</p>
              <p className="text-3xl font-bold text-ink tracking-tight">{stats.contratos}</p>
              <p className="text-xs text-muted mt-1.5">este mês</p>
            </div>

            {/* Faturamento */}
            <div className="bg-card border border-line rounded-card shadow-card hover:shadow-card-lg transition-shadow p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="w-10 h-10 rounded-xl bg-success-bg text-success flex items-center justify-center">
                  <DollarSign size={18} />
                </span>
              </div>
              <p className="text-sm text-muted mb-1">Valor Contrato</p>
              <p className="text-3xl font-bold text-success tracking-tight">
                R$ {(stats.valorContrato / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}k
              </p>
              <p className="text-xs text-muted mt-1.5">este mês</p>
            </div>

            {/* Taxa de Conversão */}
            <div className="bg-card border border-line rounded-card shadow-card hover:shadow-card-lg transition-shadow p-6">
              <div className="flex items-center justify-between mb-5">
                <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent-hover flex items-center justify-center">
                  <Target size={18} />
                </span>
              </div>
              <p className="text-sm text-muted mb-1">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-ink tracking-tight">{stats.taxaConversao.toFixed(0)}%</p>
              <p className="text-xs text-muted mt-1.5">este mês</p>
            </div>
          </div>
        </div>

        {/* Bento: funil (área principal) + acesso rápido e destaque (coluna lateral) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Funil leads={leads} />
          </div>

          <div className="flex flex-col gap-6">
            {/* Acesso rápido - lista compacta */}
            <div className="bg-card border border-line rounded-card shadow-card p-6">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Acesso rápido</h2>
              <div className="flex flex-col divide-y divide-line">
                <Link href="/leads" className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-brand-soft text-brand-fg flex items-center justify-center">
                    <Users size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink group-hover:text-brand-fg transition-colors truncate">Gerenciar Leads</p>
                    <p className="text-xs text-muted truncate">{leads.length} leads</p>
                  </div>
                  <ArrowUpRight size={15} className="text-line group-hover:text-brand-fg group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </Link>

                <Link href="/properties" className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-success-bg text-success flex items-center justify-center">
                    <Building2 size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink group-hover:text-brand-fg transition-colors truncate">Imóveis</p>
                    <p className="text-xs text-muted truncate">{imoveis.filter(i => i.status === 'disponivel').length} disponíveis</p>
                  </div>
                  <ArrowUpRight size={15} className="text-line group-hover:text-brand-fg group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </Link>
              </div>
            </div>

            {/* Relógio de Vendas - card de destaque */}
            <Link href="/relogio-vendas" className="group block flex-1">
              <div className="h-full bg-sidebar rounded-card shadow-card p-6 flex flex-col justify-between hover:shadow-card-lg transition-shadow relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/5" />
                <div className="absolute -right-2 bottom-8 w-16 h-16 rounded-full bg-accent/10" />
                <span className="w-11 h-11 rounded-xl bg-white/10 text-accent flex items-center justify-center relative">
                  <TrendingUp size={20} />
                </span>
                <div className="relative">
                  <h3 className="text-base font-semibold text-white">Relógio de Vendas</h3>
                  <p className="text-sm text-sidebar-fg/70 mt-0.5">Acompanhar metas do mês</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent mt-3 group-hover:gap-1.5 transition-all">
                    Ver detalhes <ArrowUpRight size={13} />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Bento: evolução de contratos (área principal) + origem dos leads (coluna lateral) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LeadsContratosTimelineChart />
          </div>
          <div>
            <LeadOrigemChart leads={leads} />
          </div>
        </div>

        <LeadImovelChart leads={leads} />
          </>
        )}
      </main>
    </div>
  );
}
