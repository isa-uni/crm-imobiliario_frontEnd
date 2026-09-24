'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lead } from '@/types';
// import { getLeads } from '@/lib/data';
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
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, differenceInDays, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { leadService } from '@/service/leadService';
import { metaService, MetaDTO } from '@/service/metaService';
import { authService } from '@/service/authService';
import { useToast } from '@/components/ui/ToastProvider';
import { parseApiError } from '@/lib/errorHandler';
import { ErrorState } from '@/components/ui/ErrorState';

interface MetaConfig { //quantos leads equivalem a 1 contrato:
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
  const router = useRouter();
  const { toast } = useToast();
  const [metaMensal, setMetaMensal] = useState<number>(1);
  const [metaId, setMetaId] = useState<number | null>(null);
  const [metaPropria, setMetaPropria] = useState<MetaDTO | null>(null);
  const [metaGestor, setMetaGestor] = useState<MetaDTO | null>(null);
  const [showSetup, setShowSetup] = useState(false); //tela da meta
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date()); //mes da analise | atual

  const ratios: MetaConfig['ratios'] = { //regras de conversão
    leads: 33,
    oportunidades: 20,
    visitasAgendadas: 10,
    visitasRealizadas: 8,
    pastas: 4,
    aprovados: 2,
  };

  //quando o componente é montado
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMeta();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const allLeads = await leadService.getAll(); //todos os leads
      setLeads(allLeads);
      setLeadsError(null);
    } catch (e: any) {
      const parsed = parseApiError(e);
      setLeadsError(parsed.message);
      toast(parsed.message, 'error');
      console.error('Erro ao carregar leads', e);
    }
  };

  const loadMeta = async () => { //executada sempre que o mês selecionado muda:
    setLoadingMeta(true);
    try {
      const mesRef = format(startOfMonth(selectedMonth), 'yyyy-MM-dd'); //pega o mês selecionado
      const resumo = await metaService.getMinhaMeta(mesRef); //Busca no backend a meta própria e a do gestor daquele mês.
      setMetaPropria(resumo.metaPropria);
      setMetaGestor(resumo.metaGestor);
      // meta própria do corretor tem prioridade; na ausência dela, vale a atribuída pelo gestor
      const efetiva = resumo.metaEfetiva;
      if (efetiva) {
        setMetaMensal(efetiva.metaContratos);
        setMetaId(efetiva.id);
        setShowSetup(false);
      } else {
        setShowSetup(true); //tela para cadastrar a meta
      }
    } catch (e: any) {
      const parsed = parseApiError(e);
      const status = parsed.status ?? e?.response?.status;
      if (status === 401 || status === 403) {
        router.push('/login?reason=expired');
        return;
      }
      toast(parsed.message, 'error');
      console.error('Erro ao carregar meta', e);
      setShowSetup(true);
    } finally {
      setLoadingMeta(false);
    }
  };

  const getUsuarioAutenticado = async () => {  //pegar o usuário salvo no navegador
    // Fluxo solicitado:
    // Tem usuário no localStorage? SIM -> Usa temporariamente da um GET /auth/me -> válida? SIM usa definitiva, NÃO redireciona
    //                         NÃO -> GET /auth/me -> tem sessão válida? SIM salva e usa, NÃO redireciona
    const cached = authService.getUsuario();

    if (cached) {
      // SIM: tem no localStorage -> usa temporariamente e valida no backend
      try {
        const fresh = await authService.fetchMe();
        if (fresh) {
          // sessão válida -> sincroniza e usa definitiva
          if (typeof window !== 'undefined') {
            localStorage.setItem('usuario', JSON.stringify(fresh));
          }
          return fresh;
        }
        // NÃO válida -> sessão expirada
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
        }
        return null;
      } catch {
        // erro de rede na validação -> mantém temporário para não quebrar UX
        return cached;
      }
    } else {
      // NÃO: não tem no localStorage -> tenta GET /auth/me
      try {
        const fresh = await authService.fetchMe();
        if (fresh) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('usuario', JSON.stringify(fresh));
          }
          return fresh;
        }
        return null;
      } catch {
        return null;
      }
    }
  };

  const saveMeta = async (contratos: number) => {
    const usuario = await getUsuarioAutenticado();
    if (!usuario) {
      router.push('/login?reason=expired');
      return;
    }
    setSavingMeta(true);
    try {
      const mesRef = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      await metaService.salvarMeta({
        usuarioId: usuario.id,
        mesReferencia: mesRef,
        metaContratos: contratos,
      });
      // recarrega para refletir a meta própria recém-salva junto da meta do gestor (se houver)
      await loadMeta();
      setShowSetup(false);
    } catch (e: any) {
      const parsed = parseApiError(e);
      const status = parsed.status ?? e?.response?.status;
      if (status === 401 || status === 403) {
        router.push('/login?reason=expired');
        return;
      }
      toast(parsed.message, 'error');
    } finally {
      setSavingMeta(false);
    }
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
    leads: metaMensal * ratios.leads,//ratios -> regra de conversão
    oportunidades: metaMensal * ratios.oportunidades,
    visitasAgendadas: metaMensal * ratios.visitasAgendadas,
    visitasRealizadas: metaMensal * ratios.visitasRealizadas,
    pastas: metaMensal * ratios.pastas,
    aprovados: metaMensal * ratios.aprovados,
    contratos: metaMensal,
  };

  // Cálculo de progresso
  const hoje = new Date();
  const inicioMes = startOfMonth(selectedMonth); //selectedMonth é o mês que está sendo analisado.
  const fimMes = endOfMonth(selectedMonth);
  const diasNoMes = differenceInDays(fimMes, inicioMes) + 1; //quantos dias no mes, +1 para pegar o primeiro e o ultimo dia
  const diasPassados = differenceInDays(hoje, inicioMes) + 1; //dias que já se passaram
  const progressoEsperado = (diasPassados / diasNoMes) * 100; //porcentagem da meta esperada que já tenha sido alcançada 

  // Status de cada métrica
  const getStatus = (realizado: number, meta: number) => {
    const percentual = (realizado / meta) * 100; //percentual realizado
    if (percentual >= progressoEsperado + 10) return 'adiantado'; //compara o percentual realizado com o progresso esperado do mês
    if (percentual >= progressoEsperado - 5) return 'no-prazo'; //Se não está adiantado, ele verifica se está até 5 pontos percentuais abaixo do esperado.
    return 'atrasado';
  };

  const metrics = [
    //metricsDoMes -> quanto realizou
    //metas -> quanto deveria realizar
    { 
      key: 'leads', 
      label: 'Leads', 
      icon: TrendingUp, 
      color: 'primary',
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

  const metricColor = {
    primary: { bar: 'bg-brand', text: 'text-brand-fg' },
    indigo: { bar: 'bg-cat-indigo', text: 'text-cat-indigo' },
    teal: { bar: 'bg-chart-6', text: 'text-cat-teal' },
    green: { bar: 'bg-chart-5', text: 'text-cat-green' },
    orange: { bar: 'bg-chart-4', text: 'text-cat-orange' },
    cyan: { bar: 'bg-chart-6', text: 'text-cat-teal' },
    purple: { bar: 'bg-chart-7', text: 'text-cat-purple' },
  } as const;

  //relatorio para o whatsApp
  const gerarRelatorio = () => {
    //mensagem que será enviada, junta todas as metricas
    const texto = `*RELATÓRIO DE VENDAS - ${format(selectedMonth, 'MMMM/yyyy', { locale: ptBR })}*\n\n` +
      ` *RESULTADOS:*\n` +
      metrics.map(m => 
        `• ${m.label}: ${m.realizado}/${m.meta} (${((m.realizado/m.meta)*100).toFixed(0)}%)`
      ).join('\n') +
      `\n\n *META:* ${metricsDoMes.contratos}/${metaMensal} contratos` +
      `\n *Período:* ${diasPassados} de ${diasNoMes} dias`;
      //codifica a mensagem
    const encoded = encodeURIComponent(texto);
    //abre o whatsApp
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-surface p-8 flex items-center justify-center">
        <p className="text-muted">Carregando meta...</p>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-surface p-8 flex items-center justify-center">
        <div className="bg-card rounded-2xl shadow-card-lg border border-line p-8 max-w-md w-full border-t-8 border-t-accent">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-accent-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-accent-hover" />
            </div>
            <h2 className="text-3xl font-bold text-ink mb-2">
              Novo Mês, Nova Meta!
            </h2>
            <p className="text-muted">
              Defina quantos contratos você quer fechar este mês
            </p>
            <p className="text-xs text-muted mt-1">
              {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {metaGestor && (
            <div className="mb-6 bg-warning-bg p-3 rounded-lg text-sm text-warning text-center">
              Meta atribuída pelo gestor: <span className="font-bold">{metaGestor.metaContratos} contratos</span>.
              Definindo a sua própria abaixo, ela passa a valer no lugar da meta do gestor.
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold text-muted uppercase mb-2">
              Meta de Contratos
            </label>
            <input
              type="number"
              value={metaMensal}
              onChange={(e) => setMetaMensal(Number(e.target.value))}
              className="w-full text-4xl font-bold p-4 border-2 border-line rounded-xl focus:border-accent focus:outline-none text-center text-brand-fg"
              min="1"
            />
          </div>

          <div className="bg-info-bg p-4 rounded-lg text-sm text-info mb-6">
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
            disabled={savingMeta}
            className="w-full bg-brand hover:bg-brand-hover text-on-brand font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
          >
            {savingMeta ? 'Salvando...' : 'Iniciar Mês'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-sidebar text-white p-6 rounded-card shadow-card-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-on-accent">
                  <Clock size={24} />
                </span>
                Relógio de Vendas
              </h1>
              <p className="text-sidebar-fg/80 text-sm mt-1">
                {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-accent">
                {diasNoMes - diasPassados}
              </div>
              <div className="text-sm text-sidebar-fg/70">dias restantes</div>
              <button
                onClick={() => setShowSetup(true)}
                className="mt-2 text-xs text-sidebar-fg/80 hover:text-white underline"
              >
                Redefinir Meta
              </button>
            </div>
          </div>
        </div>

        {leadsError && (
          <div className="mb-6">
            <ErrorState message={leadsError} onRetry={loadData} />
          </div>
        )}

        {/* Resumo Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-card rounded-card p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-info-bg rounded-full flex items-center justify-center">
                <Target size={24} className="text-brand-fg" />
              </div>
              <div>
                <p className="text-sm text-muted">Meta do Mês</p>
                <p className="text-3xl font-bold text-brand-fg">{metaMensal}</p>
                <p className="text-xs text-muted">contratos</p>
                {(metaPropria || metaGestor) && (
                  <div className="mt-2 pt-2 border-t border-line/60 space-y-0.5">
                    {metaPropria && (
                      <p className="text-xs text-muted">
                        Sua meta: <span className="font-semibold text-ink">{metaPropria.metaContratos}</span>
                        <span className="ml-1 text-[10px] text-brand-fg font-semibold">(em uso)</span>
                      </p>
                    )}
                    {metaGestor && (
                      <p className="text-xs text-muted">
                        Meta do gestor: <span className="font-semibold text-ink">{metaGestor.metaContratos}</span>
                        {!metaPropria && <span className="ml-1 text-[10px] text-brand-fg font-semibold">(em uso)</span>}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-card p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success-bg rounded-full flex items-center justify-center">
                <Award size={24} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-muted">Realizado</p>
                <p className="text-3xl font-bold text-success">{metricsDoMes.contratos}</p>
                <p className="text-xs text-muted">
                  {((metricsDoMes.contratos / metaMensal) * 100).toFixed(0)}% da meta
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-card p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-soft rounded-full flex items-center justify-center">
                <Calendar size={24} className="text-accent-hover" />
              </div>
              <div>
                <p className="text-sm text-muted">Progresso Tempo</p>
                <p className="text-3xl font-bold text-accent-hover">
                  {progressoEsperado.toFixed(0)}%
                </p>
                <p className="text-xs text-muted">
                  Dia {diasPassados} de {diasNoMes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Detalhadas */}
        <div className="bg-card rounded-card p-6 shadow-card mb-6">
          <h3 className="text-lg font-bold text-ink mb-4">
            Funil de Vendas - Atualização Automática
          </h3>
          {/* <p className="text-sm text-muted mb-6">
            Os valores são calculados automaticamente baseados nos leads cadastrados
          </p> */}

          <div className="space-y-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const percentual = (metric.realizado / metric.meta) * 100;
              const status = getStatus(metric.realizado, metric.meta);
              const colors = metricColor[metric.color as keyof typeof metricColor];
              
              let statusColor = 'bg-warning-bg text-warning';
              let statusText = 'No Prazo';
              if (status === 'adiantado') {
                statusColor = 'bg-success-bg text-success';
                statusText = 'Adiantado';
              } else if (status === 'atrasado') {
                statusColor = 'bg-danger-bg text-danger';
                statusText = 'Atrasado';
              }

              return (
                <div key={metric.key}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={colors.text} />
                      <span className="font-semibold text-ink">{metric.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted">
                        {metric.realizado} / {metric.meta}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full bg-subtle rounded-full h-3">
                    {/* Linha de progresso esperado */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-muted z-10"
                      style={{ left: `${progressoEsperado}%` }}
                      title={`Progresso esperado: ${progressoEsperado.toFixed(0)}%`}
                    />
                    {/* Barra de progresso real */}
                    <div 
                      className={`${colors.bar} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(percentual, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted">
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
          {/* Verde oficial do WhatsApp: exceção aos tokens de tema */}
          <button
            onClick={gerarRelatorio}
            className="flex-1 bg-[#1fa855] hover:bg-[#178a45] text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} />
            Enviar Relatório WhatsApp
          </button>
          <button //É executado ao clicar em "Atualizar Dados"
            onClick={loadData}
            className="px-6 bg-card hover:bg-surface text-ink font-bold py-4 rounded-xl shadow-card border border-line transition-all"
          >
            Atualizar Dados
          </button>
        </div>
      </div>
    </div>
  );
}