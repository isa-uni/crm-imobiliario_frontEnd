'use client';

import React, { useState, useEffect } from 'react';
import { Imovel } from '@/types';
import { imovelService } from '@/service/imovelService';
import { getImoveis, saveImovel, updateImovel, deleteImovel } from '@/lib/imoveis';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  DollarSign,
  Home,
  Maximize,
  BedDouble,
  Bath,
  Car,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function PropertiesPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [filteredImoveis, setFilteredImoveis] = useState<Imovel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImovel, setEditingImovel] = useState<Imovel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'disponivel' | 'vendido'>('all');

  const [formData, setFormData] = useState({
    titulo: '',
    endereco: '',
    cidade: 'Londrina',
    bairro: '',
    // cep: '',
    valorVenda: 0,
    area: 0,
    quartos: 0,
    banheiros: 0,
    vagas: 0,
    status: 'disponivel' as Imovel['status'],
    descricao: '',
    // caracteristicas: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterImoveis();
  }, [imoveis, searchTerm, statusFilter]);

  const loadData = async () => {
    const data = await imovelService.getAll();
    // const metricsData = await leadService.getMetrics();
    setImoveis(data);
    // setMetrics(metricsData);
  };

  const filterImoveis = () => {
    let filtered = imoveis;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(i =>
        i.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.bairro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.endereco.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredImoveis(filtered);
  };

  const handleSave = async (ImovelData: Omit<Imovel, 'id'| 'dataCadastro' | 'dataAtualizacao'>) => {
    try{
      setErrors({});
      const { descricao, ...rest } = ImovelData;

      const payload = {
        ...rest,
        descricao,
      };

      if (editingImovel) {
        await imovelService.atualizar(editingImovel.id, payload);
      } else {
        await imovelService.cadastrar(payload);
      }

      await loadData();
      setEditingImovel(null);
      setErrors({}); 
      setIsModalOpen(false);
      return true;
      // loadData();
      // closeModal();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors: any = {};

        error.response.data.errors.forEach((err: any) => {
          backendErrors[err.field] = err.message;
        });

        setErrors(backendErrors);
      } else {
        alert("Erro ao salvar imóvel");
      }

      return false;
    }
  };

  const handleEdit = (imovel: Imovel) => {
    setEditingImovel(imovel);
    setIsModalOpen(true);

    setFormData({
      titulo: imovel.titulo,
      endereco: imovel.endereco,
      cidade: imovel.cidade,
      bairro: imovel.bairro,
      // cep: imovel.cep,
      valorVenda: imovel.valorVenda,
      area: imovel.area,
      quartos: imovel.quartos,
      banheiros: imovel.banheiros,
      vagas: imovel.vagas,
      status: imovel.status,
      descricao: imovel.descricao,
      // caracteristicas: imovel.caracteristicas,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este imóvel?')) {
      try {
      await imovelService.inativar(id); 
      await loadData(); // recarrega a lista
    } catch (error) {
      alert("Erro ao excluir imóvel");
    }
      // deleteImovel(id);
      // loadData();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingImovel(null);
    setFormData({
      titulo: '',
      endereco: '',
      cidade: 'Londrina',
      bairro: '',
      // cep: '',
      valorVenda: 0,
      area: 0,
      quartos: 0,
      banheiros: 0,
      vagas: 0,
      status: 'disponivel',
      descricao: '',
      // caracteristicas: [],
    });
  };

  const statusConfig = {
    disponivel: { label: 'Disponível', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    // reservado: { label: 'Reservado', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    vendido: { label: 'Vendido', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  };

  <form onSubmit={(e) => {
    e.preventDefault();
    handleSave(formData);
  }}></form>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Building2 size={32} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Catálogo de Imóveis</h1>
                <p className="text-gray-600">Gerencie seu portfólio de imóveis</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors shadow-md"
            >
              <Plus size={20} />
              Novo Imóvel
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{imoveis.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Disponíveis</p>
              <p className="text-2xl font-bold text-green-600">
                {imoveis.filter(i => i.status === 'disponivel').length}
              </p>
            </div>
            {/* <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Reservados</p>
              <p className="text-2xl font-bold text-yellow-600">
                {imoveis.filter(i => i.status === 'reservado').length}
              </p>
            </div> */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Vendidos</p>
              <p className="text-2xl font-bold text-gray-600">
                {imoveis.filter(i => i.status === 'vendido').length}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por título, bairro ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div> */}
            <div className="flex gap-2">
              {/* {['all', 'disponivel', 'reservado', 'vendido'].map(status => ( */}
              {['all', 'disponivel', 'vendido'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {status === 'all' ? 'Todos' : statusConfig[status as keyof typeof statusConfig].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Imóveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImoveis.map(imovel => {
            const StatusIcon = statusConfig[imovel.status].icon;
            return (
              <div key={imovel.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <Building2 size={64} className="text-white opacity-50" />
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{imovel.titulo}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig[imovel.status].color}`}>
                      <StatusIcon size={12} />
                      {statusConfig[imovel.status].label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <MapPin size={14} />
                    <span>{imovel.bairro}, {imovel.cidade}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3 text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <Maximize size={14} />
                      <span>{imovel.area}m²</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BedDouble size={14} />
                      <span>{imovel.quartos}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath size={14} />
                      <span>{imovel.banheiros}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car size={14} />
                      <span>{imovel.vagas}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 mb-3">
                    <div className="flex items-center gap-2 text-green-600 font-bold text-xl">
                      <DollarSign size={20} />
                      R$ {imovel.valorVenda.toLocaleString('pt-BR')}
                    </div>
                    {/* {imovel.valorAluguel && imovel.valorAluguel > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Aluguel: R$ {imovel.valorAluguel.toLocaleString('pt-BR')}/mês
                      </div>
                    )} */}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(imovel)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(imovel.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredImoveis.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhum imóvel encontrado</p>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingImovel ? 'Editar Imóvel' : 'Novo Imóvel'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Ex: Apartamento Moderno no Centro"
                    />
                  </div>
{/* 
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="apartamento">Apartamento</option>
                      <option value="casa">Casa</option>
                      <option value="terreno">Terreno</option>
                      <option value="comercial">Comercial</option>
                      <option value="rural">Rural</option>
                    </select>
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="disponivel">Disponível</option>
                      {/* <option value="reservado">Reservado</option> */}
                      <option value="vendido">Vendido</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço *</label>
                    <input
                      type="text"
                      required
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                    <input
                      type="text"
                      required
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                    <input
                      type="text"
                      required
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Venda *</label>
                    <input
                      type="number"
                      required
                      value={formData.valorVenda}
                      onChange={(e) => setFormData({
                        ...formData, 
                        valorVenda: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg no-spinner"
                    />
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Aluguel</label>
                    <input
                      type="number"
                      value={formData.valorAluguel}
                      onChange={(e) => setFormData({ ...formData, valorAluguel: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Área (m²) *</label>
                    <input
                      type="number"
                      required
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quartos *</label>
                    <input
                      type="number"
                      required
                      value={formData.quartos}
                      onChange={(e) => setFormData({ ...formData, quartos: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banheiros *</label>
                    <input
                      type="number"
                      required
                      value={formData.banheiros}
                      onChange={(e) => setFormData({ ...formData, banheiros: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vagas *</label>
                    <input
                      type="number"
                      required
                      value={formData.vagas}
                      onChange={(e) => setFormData({ ...formData, vagas: Number(e.target.value) })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                 //onClick={handleSave}
                  // type="submit"
                  onClick={() => handleSave(formData)}

                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  {editingImovel ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
