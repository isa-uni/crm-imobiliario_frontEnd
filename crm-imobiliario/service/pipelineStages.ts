import { PipelineStage } from '@/types/pipeline';

// export const pipelineStages: PipelineStage[] = [
//   { id: 'lead', nome: 'Lead', cor: 'bg-slate-500', ordem: 1 },
//   { id: 'oportunidade', nome: 'Oportunidade', cor: 'bg-blue-500', ordem: 2 },
//   { id: 'visita-agendada', nome: 'Visita Agendada', cor: 'bg-amber-500', ordem: 3 },
//   { id: 'visita-realizada', nome: 'Visita Realizada', cor: 'bg-purple-500', ordem: 4 },
//   { id: 'pasta', nome: 'Pasta', cor: 'bg-fuchsia-500', ordem: 5 },
//   { id: 'aprovado', nome: 'Aprovado', cor: 'bg-teal-500', ordem: 6 },
//   { id: 'contrato', nome: 'Contrato', cor: 'bg-green-500', ordem: 7 },
//   { id: 'descarte', nome: 'Descarte', cor: 'bg-red-500', ordem: 8 },
// ];

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