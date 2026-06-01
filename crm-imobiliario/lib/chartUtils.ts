import { Lead } from '@/types';
import { format, startOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ChartDataPoint {
  month: string;
  leads: number;
  fechamentos: number;
  valorFechado: number;
}

export interface RevenueChartDataPoint {
  month: string;
  valorFechado: number;
  valorPotencial: number;
}

/**
 * Processa dados de leads para gerar dados do gráfico de evolução
 */
export function processLeadsChartData(leads: Lead[], startDate?: string, endDate?: string): ChartDataPoint[] {
  // Filtrar por data se fornecido
  let filteredLeads = leads;
  
  if (startDate && endDate) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    filteredLeads = leads.filter((lead) => 
      isWithinInterval(lead.dataCriacao, { start, end })
    );
  }

  // Agrupar por mês
  const monthsMap = new Map<string, {
    leads: number;
    fechamentos: number;
    valorFechado: number;
  }>();

  filteredLeads.forEach((lead) => {
    const monthKey = format(startOfMonth(lead.dataCriacao), 'yyyy-MM');
    const monthLabel = format(startOfMonth(lead.dataCriacao), 'MMM/yy', { locale: ptBR });
    
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        leads: 0,
        fechamentos: 0,
        valorFechado: 0,
      });
    }

    const data = monthsMap.get(monthKey)!;
    data.leads += 1;
    
    if (lead.status === 'contrato') {
      data.fechamentos += 1;
      data.valorFechado += lead.valorInteresse;
    }
  });

  // Converter para array e ordenar por data
  const chartData: ChartDataPoint[] = Array.from(monthsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      month: format(parseISO(key + '-01'), 'MMM/yy', { locale: ptBR }),
      leads: value.leads,
      fechamentos: value.fechamentos,
      valorFechado: value.valorFechado,
    }));

  return chartData;
}

/**
 * Processa dados de leads para gerar dados do gráfico de receita
 */
export function processRevenueChartData(leads: Lead[], startDate?: string, endDate?: string): RevenueChartDataPoint[] {
  // Filtrar por data se fornecido
  let filteredLeads = leads;
  
  if (startDate && endDate) {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    filteredLeads = leads.filter((lead) => 
      isWithinInterval(lead.dataCriacao, { start, end })
    );
  }

  // Agrupar por mês
  const monthsMap = new Map<string, {
    valorFechado: number;
    valorPotencial: number;
  }>();

  filteredLeads.forEach((lead) => {
    const monthKey = format(startOfMonth(lead.dataCriacao), 'yyyy-MM');
    
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        valorFechado: 0,
        valorPotencial: 0,
      });
    }

    const data = monthsMap.get(monthKey)!;
    
    if (lead.status === 'contrato') {
      data.valorFechado += lead.valorInteresse;
    } else if (['oportunidade', 'visita-agendada', 'visita-realizada', 'pasta', 'aprovado'].includes(lead.status)) {
      data.valorPotencial += lead.valorInteresse;
    }
  });

  // Converter para array e ordenar por data
  const chartData: RevenueChartDataPoint[] = Array.from(monthsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      month: format(parseISO(key + '-01'), 'MMM/yy', { locale: ptBR }),
      valorFechado: value.valorFechado,
      valorPotencial: value.valorPotencial,
    }));

  return chartData;
}

/**
 * Gera dados fictícios para os últimos 6 meses (para demonstração)
 */
export function generateMockChartData(): ChartDataPoint[] {
  const months = ['Jan/24', 'Fev/24', 'Mar/24', 'Abr/24', 'Mai/24', 'Jun/24'];
  
  return months.map((month, index) => ({
    month,
    leads: Math.floor(Math.random() * 30) + 20, // 20-50 leads
    fechamentos: Math.floor(Math.random() * 10) + 5, // 5-15 fechamentos
    valorFechado: (Math.floor(Math.random() * 500) + 300) * 1000, // R$ 300k - 800k
  }));
}

/**
 * Gera dados fictícios de receita para os últimos 6 meses (para demonstração)
 */
export function generateMockRevenueData(): RevenueChartDataPoint[] {
  const months = ['Jan/24', 'Fev/24', 'Mar/24', 'Abr/24', 'Mai/24', 'Jun/24'];
  
  return months.map((month, index) => {
    const fechado = (Math.floor(Math.random() * 500) + 300) * 1000;
    return {
      month,
      valorFechado: fechado,
      valorPotencial: fechado * (1.5 + Math.random()), // 1.5x a 2.5x do fechado
    };
  });
}
