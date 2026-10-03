'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Campo, inputBase } from '@/components/ui/Campo';
import { useValidacao, classeErro } from '@/hooks/useValidacao';
import { campo, problemaInteiroNaoNegativo, problemaTamanho, type Regras } from '@/lib/validacao';
import { Imovel } from '@/types';
import { imovelService } from '@/service/imovelService';
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
import { useToast } from '@/components/ui/ToastProvider';
import { parseApiError } from '@/lib/errorHandler';
import { notificarErro, textoDoErro } from '@/lib/feedback';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/ErrorState';

type ImovelForm = Omit<Imovel, 'id' | 'dataCadastro' | 'dataAtualizacao' | 'valorVenda'> & { valorVenda: number | null };

const FORM_VAZIO: ImovelForm = {
  titulo: '',
  endereco: '',
  cidade: 'Londrina',
  bairro: '',
  valorVenda: null,
  area: 0,
  quartos: 0,
  banheiros: 0,
  vagas: 0,
  status: 'disponivel',
  descricao: '',
};

const STATUS_CONFIG = {
  disponivel: { label: 'Disponível', color: 'bg-success-bg text-success', icon: CheckCircle },
  vendido: { label: 'Vendido', color: 'bg-subtle text-muted', icon: XCircle },
};

const FILTROS_STATUS = ['all', 'disponivel', 'vendido'] as const;
type FiltroStatus = (typeof FILTROS_STATUS)[number];

export default function PropertiesPage() {
  const { toast } = useToast();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImovel, setEditingImovel] = useState<Imovel | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState<FiltroStatus>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ImovelForm>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  // mesmas regras e mensagens do backend (ImovelDTO / ImovelAtualizacaoDTO)
  const regras = useMemo<Regras<ImovelForm>>(() => ({
    titulo: campo('Informe o título do imóvel.', x => problemaTamanho(x, 255, 'O título')),
    status: campo('Selecione o status do imóvel.'),
    endereco: campo('Informe o endereço do imóvel.', x => problemaTamanho(x, 255, 'O endereço')),
    bairro: campo('Informe o bairro do imóvel.', x => problemaTamanho(x, 255, 'O bairro')),
    cidade: campo('Informe a cidade do imóvel.', x => problemaTamanho(x, 255, 'A cidade')),
    valorVenda: (x) => x == null || Number.isNaN(x) ? 'Informe o valor de venda do imóvel.'
      : !Number.isInteger(x) ? 'Informe o valor de venda em reais, sem centavos.'
      : x <= 0 ? 'Informe um valor de venda maior que zero.' : null,
    area: (x) => problemaInteiroNaoNegativo(x, 'A área', 'A área não pode ser negativa.'),
    quartos: (x) => problemaInteiroNaoNegativo(x, 'A quantidade de quartos', 'A quantidade de quartos não pode ser negativa.'),
    banheiros: (x) => problemaInteiroNaoNegativo(x, 'A quantidade de banheiros', 'A quantidade de banheiros não pode ser negativa.'),
    vagas: (x) => problemaInteiroNaoNegativo(x, 'A quantidade de vagas', 'A quantidade de vagas não pode ser negativa.'),
    descricao: (x) => problemaTamanho(x, 255, 'A descrição'),
  }), []);
  const v = useValidacao<ImovelForm>(regras);
  const alterar = (nome: keyof ImovelForm, valor: any) => {
    const novo = { ...formData, [nome]: valor } as ImovelForm;
    setFormData(novo);
    v.aoAlterar(nome, novo);
  };
  const cls = (nome: string) => `${inputBase} ${classeErro(!!v.erros[nome])}`;
  const confirmar = useConfirm();

  useEffect(() => {
    loadData();
  }, []);

  const filteredImoveis = useMemo(
    () => (statusFilter === 'all' ? imoveis : imoveis.filter(i => i.status === statusFilter)),
    [imoveis, statusFilter]
  );

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setImoveis(await imovelService.getAll());
    } catch (e: any) {
      // erro exibido uma única vez, no lugar da lista, com "Tentar novamente" (antes: também um toast repetido)
      setLoadError(textoDoErro(parseApiError(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (imovelData: Omit<Imovel, 'id' | 'dataCadastro' | 'dataAtualizacao'>) => {
    setSalvando(true);
    try {
      setErrors({});
      const isEditing = !!editingImovel;
      if (editingImovel) {
        await imovelService.atualizar(editingImovel.id, imovelData);
      } else {
        await imovelService.cadastrar(imovelData);
      }

      await loadData();
      closeModal();
      toast(isEditing ? `Imóvel "${imovelData.titulo}" atualizado com sucesso.` : `Imóvel "${imovelData.titulo}" cadastrado com sucesso.`, 'success');
    } catch (error: any) {
      const parsed = parseApiError(error);
      if (parsed.tipo === 'sessao_expirada') return;
      // erro de campo junto ao campo; os demais no topo do formulário (antes: toast genérico "campos inválidos")
      if (parsed.fields && Object.keys(parsed.fields).length) v.aplicarErrosServidor(parsed.fields);
      else setErrors({ geral: textoDoErro(parsed) });
    } finally {
      setSalvando(false);
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
      valorVenda: imovel.valorVenda,
      area: imovel.area,
      quartos: imovel.quartos,
      banheiros: imovel.banheiros,
      vagas: imovel.vagas,
      status: imovel.status,
      descricao: imovel.descricao,
    });
  };

  const handleDelete = async (imovel: Imovel) => {
    // o backend inativa o imóvel (ImovelService.inativarImovel): some da lista, mas o cadastro é mantido
    const ok = await confirmar({
      titulo: `Excluir o imóvel "${imovel.titulo}"?`,
      mensagem: 'O imóvel deixará de aparecer na lista de imóveis. O cadastro fica guardado no sistema, mas não há como reexibi-lo por esta tela.',
      confirmarLabel: 'Excluir imóvel',
      perigo: true,
    });
    if (!ok) return;
    try {
      await imovelService.inativar(imovel.id);
      await loadData();
      toast(`Imóvel "${imovel.titulo}" removido da lista.`, 'success');
    } catch (e: any) {
      notificarErro(toast, `Não foi possível excluir o imóvel "${imovel.titulo}"`, e);
    }
  };

  const closeModal = () => {
    setErrors({});
    v.limpar();
    setIsModalOpen(false);
    setEditingImovel(null);
    setFormData(FORM_VAZIO);
  };

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
              {FILTROS_STATUS.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 text-sm font-semibold rounded-btn transition-colors ${
                    statusFilter === status
                      ? 'bg-brand text-on-brand shadow-btn'
                      : 'bg-card text-muted hover:bg-card border border-line'
                  }`}
                >
                  {status === 'all' ? 'Todos' : STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Imóveis */}
        {loading ? (
          <div className="bg-card border border-line rounded-card shadow-card p-12 text-center">
            <p className="text-muted motion-safe:animate-pulse" role="status">Carregando imóveis...</p>
          </div>
        ) : loadError ? (
          <ErrorState message="Não foi possível carregar os imóveis." details={loadError} onRetry={loadData} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredImoveis.map(imovel => {
                const status = STATUS_CONFIG[imovel.status];
                const StatusIcon = status.icon;
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
                        <span className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1 rounded-full ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
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
                          onClick={() => handleDelete(imovel)}
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
                ref={v.formRef as any}
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  // antes: o navegador avisava só o 1º campo vazio; números negativos e valor zero passavam
                  if (!v.validarTudo(formData)) return;
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
                {errors.geral && (
                  <div role="alert" className="bg-danger-bg border border-danger-border px-4 py-3 text-sm text-danger rounded-btn">
                    <p className="font-semibold">{editingImovel ? 'Não foi possível salvar as alterações do imóvel.' : 'Não foi possível cadastrar o imóvel.'}</p>
                    <p className="mt-0.5">{errors.geral}</p>
                  </div>
                )}
                {Object.keys(v.erros).length > 1 && (
                  <p role="alert" className="text-sm text-danger">Preencha os {Object.keys(v.erros).length} campos destacados antes de continuar.</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Campo nome="titulo" rotulo="Título" obrigatorio erro={v.erros.titulo} className="md:col-span-2">
                    <input id="titulo" type="text" maxLength={255} value={formData.titulo}
                      onChange={(e) => alterar('titulo', e.target.value)} {...v.ligar('titulo', formData)}
                      className={cls('titulo')} placeholder="Ex.: Apartamento moderno no Centro" />
                  </Campo>

                  <Campo nome="status" rotulo="Status" obrigatorio erro={v.erros.status}>
                    <select id="status" value={formData.status} onChange={(e) => alterar('status', e.target.value)}
                      {...v.ligar('status', formData)} className={cls('status')}>
                      <option value="disponivel">Disponível</option>
                      <option value="vendido">Vendido</option>
                    </select>
                  </Campo>

                  <Campo nome="endereco" rotulo="Endereço" obrigatorio erro={v.erros.endereco} className="md:col-span-2">
                    <input id="endereco" type="text" maxLength={255} value={formData.endereco}
                      onChange={(e) => alterar('endereco', e.target.value)} {...v.ligar('endereco', formData)}
                      className={cls('endereco')} placeholder="Ex.: Rua Sergipe, 1000" />
                  </Campo>

                  <Campo nome="bairro" rotulo="Bairro" obrigatorio erro={v.erros.bairro}>
                    <input id="bairro" type="text" maxLength={255} value={formData.bairro}
                      onChange={(e) => alterar('bairro', e.target.value)} {...v.ligar('bairro', formData)}
                      className={cls('bairro')} />
                  </Campo>

                  <Campo nome="cidade" rotulo="Cidade" obrigatorio erro={v.erros.cidade}>
                    <input id="cidade" type="text" maxLength={255} value={formData.cidade}
                      onChange={(e) => alterar('cidade', e.target.value)} {...v.ligar('cidade', formData)}
                      className={cls('cidade')} />
                  </Campo>

                  <Campo nome="valorVenda" rotulo="Valor de venda (R$)" obrigatorio erro={v.erros.valorVenda}
                    ajuda="Somente números, sem pontos. Ex.: 350000">
                    <input id="valorVenda" type="number" inputMode="numeric" min={1} step={1} value={formData.valorVenda ?? ''}
                      onChange={(e) => alterar('valorVenda', e.target.value === '' ? null : Number(e.target.value))}
                      {...v.ligar('valorVenda', formData)} className={`${cls('valorVenda')} no-spinner`} placeholder="350000" />
                  </Campo>

                  {([
                    ['area', 'Área (m²)'],
                    ['quartos', 'Quartos'],
                    ['banheiros', 'Banheiros'],
                    ['vagas', 'Vagas'],
                  ] as const).map(([nome, rotulo]) => (
                    <Campo key={nome} nome={nome} rotulo={rotulo} erro={v.erros[nome]}>
                      <input id={nome} type="number" inputMode="numeric" min={0} step={1}
                        value={Number.isNaN(formData[nome]) ? '' : formData[nome]}
                        onChange={(e) => alterar(nome, e.target.value === '' ? 0 : Number(e.target.value))}
                        {...v.ligar(nome, formData)} className={cls(nome)} />
                    </Campo>
                  ))}

                  <Campo nome="descricao" rotulo="Descrição" erro={v.erros.descricao} className="md:col-span-2"
                    ajuda={`${(formData.descricao ?? '').length}/255 caracteres`}>
                    <textarea id="descricao" maxLength={255} value={formData.descricao}
                      onChange={(e) => alterar('descricao', e.target.value)} {...v.ligar('descricao', formData)}
                      className={cls('descricao')} rows={3} />
                  </Campo>
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
                  type="submit"
                  disabled={salvando}
                  className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors disabled:opacity-60"
                >
                  {salvando ? (editingImovel ? 'Salvando alterações...' : 'Cadastrando imóvel...') : editingImovel ? 'Salvar alterações' : 'Cadastrar imóvel'}
                </button>
              </div>
            </form> 
          </div>
        )}
      </div>
    </div>
  );
}
