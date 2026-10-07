// Tipos existentes de Lead
export type LeadStatus = 'lead' | 'oportunidade' | 'visita-agendada' | 'visita-realizada' | 'pasta' | 'aprovado' | 'contrato' | 'descarte';

export interface Tramitacao {
  id: number;
  leadId: number;
  statusAnterior: LeadStatus | null;
  statusAtual: LeadStatus;
  dataMovimentacao: string;
  usuarioNome?: string;
}

export type StatusAtribuicao = 'ATRIBUIDO' | 'AGUARDANDO_REDISTRIBUICAO'

export interface Equipe {
  id: number
  nome: string
  descricao?: string
  gestorId?: number | null
  gestorNome?: string | null
  ativo: boolean
}

export interface Notificacao {
  id: number
  tipo: string
  /** resumo do que aconteceu (ex.: "3 leads aguardando redistribuição") */
  titulo?: string | null
  mensagem: string
  /** tela onde está a ação esperada (ex.: /redistribuicao) */
  link?: string | null
  leadId?: number
  leadNome?: string
  lida: boolean
  dataCriacao: string
}

export interface Lead {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  origem: string;
  historico: string;
  status: LeadStatus;
  valorInteresse: number;
  empreendimentoId?: number | null;
  empreendimentoNome?: string | null;
  observacao?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  motivoDescarte?: string;
  corretorId?: number | null
  corretorNome?: string | null
  equipeId?: number | null
  equipeNome?: string | null
  statusAtribuicao?: StatusAtribuicao
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

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  genero: string;
  telefone: string;
  matricula: string;
  dataNascimento: string;
  papel: string;
  ativo: boolean;
  trocarSenha: boolean;
  gestorId?: number | null;
  gestorNome?: string | null;
  equipeId?: number | null;
  equipeNome?: string | null;
}

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  papel: string;
  trocarSenha: boolean;
}

// o token de acesso vai apenas em cookie httpOnly (Set-Cookie), nunca no corpo da resposta
export interface LoginResponse {
  usuario: UsuarioAutenticado;
}

export interface Papel {
  id: number;
  papel: string;
  ativo?: boolean;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export interface UsuarioPayload {
  nome: string;
  email: string;
  cpf: string;
  genero: string;
  telefone: string;
  dataNascimento: string;
  papelId: number;
  gestorId?: number | null;
}

export interface PerfilPayload {
  nome: string;
  email: string;
  genero: string;
  telefone: string;
  dataNascimento: string;
}
