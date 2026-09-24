'use client';

import React, { useState, useEffect } from 'react';
import { Imovel } from '@/types';
import { imovelService } from '@/service/imovelService';
//import { getImoveis, saveImovel, updateImovel, deleteImovel } from '@/lib/imoveis';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  DollarSign,
  Maximize,
  BedDouble,
  Bath,
  Car,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/ToastProvider';
import { parseApiError } from '@/lib/errorHandler';
import { ErrorState } from '@/components/ui/ErrorState';

export default function PropertiesPage() {
  const { toast } = useToast();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [filteredImoveis, setFilteredImoveis] = useState<Imovel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImovel, setEditingImovel] = useState<Imovel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'disponivel' | 'vendido'>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    endereco: '',
    cidade: 'Londrina',
    bairro: '',
    // cep: '',
    valorVenda: null as number | null,
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
    setLoading(true);
    setLoadError(null);
    try {
      const data = await imovelService.getAll();
      // const metricsData = await leadService.getMetrics();
      setImoveis(data);
      // setMetrics(metricsData);
    } catch (e: any) {
      const parsed = parseApiError(e);
      setLoadError(parsed.message);
      toast(parsed.message, 'error');
    } finally {
      setLoading(false);
    }
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

      const isEditing = !!editingImovel;
      if (editingImovel) {
        await imovelService.atualizar(editingImovel.id, payload);
      } else {
        await imovelService.cadastrar(payload);
      }

      await loadData();
      setEditingImovel(null);
      setErrors({}); 
      //setIsModalOpen(false);
      closeModal();
      toast(isEditing ? 'Imóvel atualizado com sucesso.' : 'Imóvel cadastrado com sucesso.', 'success');
      return true;
      // loadData();
      // closeModal();
    } catch (error: any) {
      const parsed = parseApiError(error);
      if (parsed.fields) {
        setErrors(parsed.fields);
        toast('Existem campos inválidos. Verifique os campos destacados.', 'warning');
      } else {
        toast(parsed.message, 'error');
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
      toast('Imóvel excluído com sucesso.', 'success');
    } catch (e: any) {
      toast(parseApiError(e).message, 'error');
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
      valorVenda: null as number | null,
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
    disponivel: { label: 'Disponível', color: 'bg-success-bg text-success', icon: CheckCircle },
    // reservado: { label: 'Reservado', color: 'bg-warning-bg text-warning', icon: Clock },
    vendido: { label: 'Vendido', color: 'bg-subtle text-muted', icon: XCircle },
  };

  // <form onSubmit={(e) => {
  //   e.preventDefault();
  //   handleSave(formData);
  // }}></form>

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-accent text-on-accent flex items-center justify-center shadow-btn">
                <Building2 size={24} />
              </span>
              <div>
                <h1 className="text-3xl font-bold text-ink tracking-tight">Catálogo de Imóveis</h1>
                <p className="text-muted">Cadastre e acompanhe os imóveis</p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-brand text-on-brand px-6 py-2.5 rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors"
            >
              <Plus size={20} />
              Novo Imóvel
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Total</p>
              <p className="text-3xl font-bold text-ink">{imoveis.length}</p>
            </div>
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Disponíveis</p>
              <p className="text-3xl font-bold text-success">
                {imoveis.filter(i => i.status === 'disponivel').length}
              </p>
            </div>
            <div className="bg-card p-5 border border-line rounded-card shadow-card">
              <p className="text-sm text-muted mb-1">Vendidos</p>
              <p className="text-3xl font-bold text-muted">
                {imoveis.filter(i => i.status === 'vendido').length}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              {['all', 'disponivel', 'vendido'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-4 py-2 text-sm font-semibold rounded-btn transition-colors ${
                    statusFilter === status
                      ? 'bg-brand text-on-brand shadow-btn'
                      : 'bg-card text-muted hover:bg-card border border-line'
                  }`}
                >
                  {status === 'all' ? 'Todos' : statusConfig[status as keyof typeof statusConfig].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Imóveis */}
        {loading ? (
          <div className="bg-card border border-line rounded-card shadow-card p-12 text-center">
            <p className="text-muted animate-pulse">Carregando imóveis...</p>
          </div>
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={loadData} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredImoveis.map(imovel => {
                const StatusIcon = statusConfig[imovel.status].icon;
                return (
                  <div key={imovel.id} className="bg-card border border-line rounded-card shadow-card overflow-hidden hover:shadow-card-lg hover:border-focus transition-all">
                    <div className="h-40 bg-gradient-to-br from-brand-soft to-subtle flex items-center justify-center border-b border-line">
                      <span className="w-14 h-14 rounded-xl bg-card shadow-card flex items-center justify-center">
                        <Building2 size={32} className="text-brand-fg" />
                      </span>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-ink">{imovel.titulo}</h3>
                        <span className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1 rounded-full ${statusConfig[imovel.status].color}`}>
                          <StatusIcon size={12} />
                          {statusConfig[imovel.status].label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted mb-4">
                        <MapPin size={14} />
                        <span>{imovel.bairro}, {imovel.cidade}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-4 text-sm text-muted">
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

                      <div className="border-t border-dashed pt-3 mb-4">
                        <div className="flex items-center gap-2 text-success font-bold text-xl">
                          <DollarSign size={20} />
                          R$ {imovel.valorVenda.toLocaleString('pt-BR')}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(imovel)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-brand-soft text-brand-fg hover:bg-brand-soft rounded-btn text-sm font-semibold transition-colors"
                        >
                          <Edit size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(imovel.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-danger-bg text-danger hover:bg-danger-bg rounded-btn text-sm font-semibold transition-colors"
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
              <div className="text-center py-12 bg-card border border-line rounded-card shadow-card mt-4">
                <Building2 size={48} className="mx-auto text-muted mb-4" />
                <p className="text-muted">Nenhum imóvel encontrado</p>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave({
                      ...formData,
                      valorVenda: formData.valorVenda!,
                    });
                }}
                className="bg-card max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-card shadow-card-lg"
              >
              <div className="p-6 border-b border-line">
                <h2 className="text-xl font-bold text-ink">
                  {editingImovel ? 'Editar Imóvel' : 'Novo Imóvel'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted mb-1">Título <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                      placeholder="Ex: Apartamento Moderno no Centro"
                    />
                    {errors.titulo && <p className="text-xs text-danger mt-1.5">{errors.titulo}</p>}
                  </div>
{/* 
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Tipo <span className="text-danger">*</span></label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                      className="w-full p-2 border border-line"
                    >
                      <option value="apartamento">Apartamento</option>
                      <option value="casa">Casa</option>
                      <option value="terreno">Terreno</option>
                      <option value="comercial">Comercial</option>
                      <option value="rural">Rural</option>
                    </select>
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Status <span className="text-danger">*</span></label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                    >
                      <option value="disponivel">Disponível</option>
                      {/* <option value="reservado">Reservado</option> */}
                      <option value="vendido">Vendido</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted mb-1">Endereço <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                    />
                    {errors.endereco && <p className="text-xs text-danger mt-1.5">{errors.endereco}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Bairro <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                    />
                    {errors.bairro && <p className="text-xs text-danger mt-1.5">{errors.bairro}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Cidade <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                    />
                    {errors.cidade && <p className="text-xs text-danger mt-1.5">{errors.cidade}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Valor Venda <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      required
                      value={formData.valorVenda ?? ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        valorVenda: e.target.value === '' ? null : Number(e.target.value) })}
                        // valorVenda: Number(e.target.value) })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30 no-spinner"
                    />
                    {errors.valorVenda && <p className="text-xs text-danger mt-1.5">{errors.valorVenda}</p>}
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-muted mb-1">Valor Aluguel</label>
                    <input
                      type="number"
                      value={formData.valorAluguel}
                      onChange={(e) => setFormData({ ...formData, valorAluguel: Number(e.target.value) })}
                      className="w-full p-2 border border-line"
                    />
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Área (m²)</label>
                    <input
                      type="number"
                      required
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                    />
                    {errors.area && <p className="text-xs text-danger mt-1.5">{errors.area}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Quartos</label>
                    <input
                      type="number"
                      required
                      value={formData.quartos}
                      onChange={(e) => setFormData({ ...formData, quartos: Number(e.target.value) })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                    />
                    {errors.quartos && <p className="text-xs text-danger mt-1.5">{errors.quartos}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Banheiros</label>
                    <input
                      type="number"
                      required
                      value={formData.banheiros}
                      onChange={(e) => setFormData({ ...formData, banheiros: Number(e.target.value) })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                    />
                    {errors.banheiros && <p className="text-xs text-danger mt-1.5">{errors.banheiros}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Vagas</label>
                    <input
                      type="number"
                      required
                      value={formData.vagas}
                      onChange={(e) => setFormData({ ...formData, vagas: Number(e.target.value) })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                    />
                    {errors.vagas && <p className="text-xs text-danger mt-1.5">{errors.vagas}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted mb-1">Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
                      rows={3}
                    />
                    {errors.descricao && <p className="text-xs text-danger mt-1.5">{errors.descricao}</p>}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-line flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted hover:bg-surface transition-colors"
                >
                  Cancelar
                </button>
                <button
                 //onClick={handleSave}
                  // type="submit"
                  type="submit"
                  // onClick={() => handleSave(formData)}

                  className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors"
                >
                  {editingImovel ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
                </button>
              </div>
            {/* </div>*/}
            </form> 
          </div>
        )}
      </div>
    </div>
  );
}
