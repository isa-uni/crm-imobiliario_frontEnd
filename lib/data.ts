// Simulação de banco de dados em memória (LocalStorage no navegador)
import { Lead, LeadStatus, PipelineStage, Metrics } from '@/types';

export const pipelineStages: PipelineStage[] = [
  { id: 'lead', nome: 'Lead', cor: 'bg-slate-500', ordem: 1 },
  { id: 'oportunidade', nome: 'Oportunidade', cor: 'bg-blue-500', ordem: 2, taxaConversao: 60 },
  { id: 'visita-agendada', nome: 'Visita Agendada', cor: 'bg-amber-500', ordem: 3, taxaConversao: 50 },
  { id: 'visita-realizada', nome: 'Visita Realizada', cor: 'bg-purple-500', ordem: 4, taxaConversao: 75 },
  { id: 'pasta', nome: 'Pasta', cor: 'bg-fuchsia-500', ordem: 5, taxaConversao: 50 },
  { id: 'aprovado', nome: 'Aprovado', cor: 'bg-teal-500', ordem: 6, taxaConversao: 45 },
  { id: 'contrato', nome: 'Contrato', cor: 'bg-green-500', ordem: 7, taxaConversao: 60 },
  { id: 'descarte', nome: 'Descarte', cor: 'bg-red-500', ordem: 8 },
];

// Dados iniciais de exemplo
const initialLeads: Lead[] = [
  {
    id: 1,
    nome: 'João Silva',
    telefone: '(11) 98765-4321',
    email: 'joao@email.com',
    origem: 'Facebook',
    status: 'lead',
    valorInteresse: 350000,
    // tipoImovel: 'Apartamento 2 quartos',
    observacao: 'Procura na zona sul',
    dataCriacao: new Date('2024-01-15'),
    dataAtualizacao: new Date('2024-01-15'),
  },
  {
    id: 2,
    nome: 'Maria Santos',
    telefone: '(11) 91234-5678',
    email: 'maria@email.com',
    origem: 'Instagram',
    status: 'oportunidade',
    valorInteresse: 450000,
    // tipoImovel: 'Casa 3 quartos',
    observacao: 'Quer garagem para 2 carros',
    dataCriacao: new Date('2024-01-10'),
    dataAtualizacao: new Date('2024-01-18'),
  },
  {
    id: 3,
    nome: 'Carlos Oliveira',
    telefone: '(11) 99876-5432',
    email: 'carlos@email.com',
    origem: 'Site',
    status: 'visita-agendada',
    valorInteresse: 280000,
    // tipoImovel: 'Apartamento 1 quarto',
    observacao: 'Visita agendada para sábado 14h',
    dataCriacao: new Date('2024-01-05'),
    dataAtualizacao: new Date('2024-01-20'),
  },
  {
    id: 4,
    nome: 'Ana Paula',
    telefone: '(11) 97654-3210',
    email: 'ana@email.com',
    origem: 'Indicação',
    status: 'aprovado',
    valorInteresse: 520000,
    // tipoImovel: 'Casa 4 quartos',
    observacao: 'Proposta enviada, aguardando resposta',
    dataCriacao: new Date('2024-01-02'),
    dataAtualizacao: new Date('2024-01-22'),
  },
  {
    id: 5,
    nome: 'Pedro Costa',
    telefone: '(11) 96543-2109',
    email: 'pedro@email.com',
    origem: 'Google',
    status: 'descarte',
    valorInteresse: 380000,
    // tipoImovel: 'Apartamento 2 quartos',
    observacao: 'Venda fechada! Comissão: R$ 11.400',
    dataCriacao: new Date('2023-12-20'),
    dataAtualizacao: new Date('2024-01-25'),
  },
];

// Funções para gerenciar leads
export const getLeads = (): Lead[] => {
  if (typeof window === 'undefined') return initialLeads;
  
  const stored = localStorage.getItem('crm-leads');
  if (!stored) {
    localStorage.setItem('crm-leads', JSON.stringify(initialLeads));
    return initialLeads;
  }
  
  return JSON.parse(stored).map((lead: any) => ({
    ...lead,
    dataCriacao: new Date(lead.dataCriacao),
    dataAtualizacao: new Date(lead.dataAtualizacao),
  }));
};

export const saveLead = (lead: Omit<Lead, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Lead => {
  const leads = getLeads();
  const newLead: Lead = {
    ...lead,
    id: Date.now(),
    dataCriacao: new Date(),
    dataAtualizacao: new Date(),
  };
  
  leads.push(newLead);
  localStorage.setItem('crm-leads', JSON.stringify(leads));
  return newLead;
};

export const updateLead = (id: number, updates: Partial<Lead>): Lead | null => {
  const leads = getLeads();
  const index = leads.findIndex(l => l.id === id);
  
  if (index === -1) return null;
  
  leads[index] = {
    ...leads[index],
    ...updates,
    dataAtualizacao: new Date(),
  };
  
  localStorage.setItem('crm-leads', JSON.stringify(leads));
  return leads[index];
};

export const deleteLead = (id: number): boolean => {
  const leads = getLeads();
  const filtered = leads.filter(l => l.id !== id);
  
  if (filtered.length === leads.length) return false;
  
  localStorage.setItem('crm-leads', JSON.stringify(filtered));
  return true;
};

export const getMetrics = (): Metrics => {
  const leads = getLeads();
  
  const totalLeads = leads.filter(l => l.status === 'lead').length;
  const totalOportunidades = leads.filter(l => l.status === 'oportunidade').length;
  const totalVisitasAgen = leads.filter(l => l.status === 'visita-agendada').length;
  const totalVisitasReal = leads.filter(l => l.status === 'visita-realizada').length;
  const totalPastas = leads.filter(l => l.status === 'pasta').length;
  const totalAprovados = leads.filter(l => l.status === 'aprovado').length;
  const totalContratos = leads.filter(l => l.status === 'contrato').length;
  const totalDescartes = leads.filter(l => l.status === 'descarte').length;
  
  const total = leads.length;
  const taxaConversaoGeral = total > 0 ? (totalContratos / total) * 100 : 0;
  
  const valorTotalFechado = leads
    .filter(l => l.status === 'contrato')
    .reduce((sum, lead) => sum + lead.valorInteresse, 0);
  
  return {
    totalLeads,
    totalOportunidades,
    totalVisitasAgen,
    totalVisitasReal,
    totalPastas,
    totalAprovados,
    totalContratos,
    totalDescartes,
    taxaConversaoGeral,
    valorTotalFechado,
  };
};
