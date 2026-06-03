// import { Imovel, StatusImovel, TipoImovel } from '@/types';

// // Dados iniciais de exemplo
// const initialImoveis: Imovel[] = [
//   {
//     id: '1',
//     titulo: 'Apartamento Moderno no Centro',
//     tipo: 'apartamento',
//     endereco: 'Rua das Flores, 123',
//     cidade: 'Londrina',
//     bairro: 'Centro',
//     cep: '86010-000',
//     valorVenda: 350000,
//     valorAluguel: 1800,
//     area: 85,
//     quartos: 2,
//     banheiros: 2,
//     vagas: 1,
//     status: 'disponivel',
//     descricao: 'Apartamento moderno com acabamento de primeira, próximo a todos os serviços.',
//     caracteristicas: ['Elevador', 'Sacada', 'Portaria 24h', 'Área de lazer'],
//     dataCadastro: new Date('2024-01-10'),
//     dataAtualizacao: new Date('2024-01-10'),
//   },
//   {
//     id: '2',
//     titulo: 'Casa Espaçosa com Piscina',
//     tipo: 'casa',
//     endereco: 'Avenida dos Pinheiros, 456',
//     cidade: 'Londrina',
//     bairro: 'Jardim Universitário',
//     cep: '86015-000',
//     valorVenda: 580000,
//     area: 250,
//     quartos: 3,
//     banheiros: 3,
//     vagas: 2,
//     status: 'disponivel',
//     descricao: 'Linda casa com piscina, churrasqueira e amplo jardim.',
//     caracteristicas: ['Piscina', 'Churrasqueira', 'Jardim', 'Garagem coberta'],
//     dataCadastro: new Date('2024-01-15'),
//     dataAtualizacao: new Date('2024-01-15'),
//   },
// ];

// // Funções para gerenciar imóveis
// export const getImoveis = (): Imovel[] => {
//   if (typeof window === 'undefined') return initialImoveis;
  
//   const stored = localStorage.getItem('crm-imoveis');
//   if (!stored) {
//     localStorage.setItem('crm-imoveis', JSON.stringify(initialImoveis));
//     return initialImoveis;
//   }
  
//   return JSON.parse(stored).map((imovel: any) => ({
//     ...imovel,
//     dataCadastro: new Date(imovel.dataCadastro),
//     dataAtualizacao: new Date(imovel.dataAtualizacao),
//   }));
// };

// export const getImovelById = (id: string): Imovel | null => {
//   const imoveis = getImoveis();
//   return imoveis.find(i => i.id === id) || null;
// };

// export const getImoveisDisponiveis = (): Imovel[] => {
//   return getImoveis().filter(i => i.status === 'disponivel');
// };

// export const saveImovel = (imovel: Omit<Imovel, 'id' | 'dataCadastro' | 'dataAtualizacao'>): Imovel => {
//   const imoveis = getImoveis();
//   const newImovel: Imovel = {
//     ...imovel,
//     id: Date.now().toString(),
//     dataCadastro: new Date(),
//     dataAtualizacao: new Date(),
//   };
  
//   imoveis.push(newImovel);
//   localStorage.setItem('crm-imoveis', JSON.stringify(imoveis));
//   return newImovel;
// };

// export const updateImovel = (id: string, updates: Partial<Imovel>): Imovel | null => {
//   const imoveis = getImoveis();
//   const index = imoveis.findIndex(i => i.id === id);
  
//   if (index === -1) return null;
  
//   imoveis[index] = {
//     ...imoveis[index],
//     ...updates,
//     dataAtualizacao: new Date(),
//   };
  
//   localStorage.setItem('crm-imoveis', JSON.stringify(imoveis));
//   return imoveis[index];
// };

// export const deleteImovel = (id: string): boolean => {
//   const imoveis = getImoveis();
//   const filtered = imoveis.filter(i => i.id !== id);
  
//   if (filtered.length === imoveis.length) return false;
  
//   localStorage.setItem('crm-imoveis', JSON.stringify(filtered));
//   return true;
// };
