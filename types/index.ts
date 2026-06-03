// Tipos existentes de Lead
export type LeadStatus = 'lead' | 'oportunidade' | 'visita-agendada' | 'visita-realizada' | 'pasta' | 'aprovado' | 'contrato' | 'descarte';

export interface Lead {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  origem: string;
  status: LeadStatus;
  valorInteresse: number;
  // tipoImovel: string;
  imovel?: Imovel | null; 
  imovelId?: number | null;
  observacao?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  motivoDescarte?: string;
}

export interface PipelineStage {
  id: LeadStatus;
  nome: string;
  cor: string;
  ordem: number;
  taxaConversao?: number;
}

export interface Metrics {
  totalLeads: number;
  totalOportunidades: number;
  totalVisitasAgen: number;
  totalVisitasReal: number;
  totalPastas: number;
  totalAprovados: number;
  totalContratos: number;
  totalDescartes: number;
  taxaConversaoGeral: number;
  valorTotalFechado: number;
}

export type StatusImovel = 'disponivel' | 'vendido';

export interface Imovel {
  id: number;
  titulo: string;
  endereco: string;
  cidade: string;
  bairro: string;
  // cep: string;
  valorVenda: number;
  area: number; // m²
  quartos: number;
  banheiros: number;
  vagas: number;
  status: StatusImovel;
  descricao: string;
  // caracteristicas: string[]; // Ex: ['piscina', 'churrasqueira', 'elevador']
  // fotos?: string[]; // URLs das fotos
  dataCadastro: Date;
  dataAtualizacao: Date;
}
