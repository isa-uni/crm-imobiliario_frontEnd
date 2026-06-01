import { Lead } from './index'; // ou onde estiver seu Lead

export type PipelineStage = {
  id: Lead['status'];
  nome: string;
  cor: string;
  ordem: number;
  taxaConversao?: number;
};