'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserCog, Plus, Search, Edit, KeyRound, UserX, UserCheck, Shield, Users, X, Loader2, Trash2, Copy, CheckCircle } from 'lucide-react';
import { Usuario, Papel, UsuarioPayload } from '@/types';
import { usuarioService } from '@/service/usuarioService';
import { papelService } from '@/service/papelService';
import { authService } from '@/service/authService';
import { parseApiError } from '@/lib/errorHandler';
import { notificarErro, textoDoErro, plural } from '@/lib/feedback';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { ErrorState, InlineError } from '@/components/ui/ErrorState';
import { problemaSenha } from '@/lib/validacao';
import UsuarioModal from '@/components/UsuarioModal';
import PapelModal from '@/components/PapelModal';
import InativacaoSemGestorModal, { type DecisaoSemGestor } from '@/components/InativacaoSemGestorModal';
import { fluxoDeInativacao, mensagemInativacao, type PreviaInativacao } from '@/lib/redistribuicao';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [search, setSearch] = useState('');
  const [papelFilter, setPapelFilter] = useState('all');
  const [ativoFilter, setAtivoFilter] = useState<'all' | 'ativos' | 'inativos'>('all');
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [isPapelModalOpen, setIsPapelModalOpen] = useState(false);
  const [isSenhaModalOpen, setIsSenhaModalOpen] = useState(false);
  const [senhaTarget, setSenhaTarget] = useState<Usuario | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaError, setSenhaError] = useState<string | null>(null);
  // erros por campo do modal de redefinição (antes: um texto só, abaixo dos dois campos)
  const [senhaCampos, setSenhaCampos] = useState<{ novaSenha?: string; confirmarSenha?: string }>({});
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // senha temporária: fica visível até o admin fechar (é exibida uma única vez — não pode sumir sozinha como um toast)
  const [senhaTemporaria, setSenhaTemporaria] = useState<{ nome: string; senha: string } | null>(null);
  const [copiada, setCopiada] = useState(false);
  const { toast } = useToast();
  const confirmar = useConfirm();
  // corretor sem gestor e com leads: o admin decide quem cuida da redistribuição antes de inativar
  const [previaSemGestor, setPreviaSemGestor] = useState<{ usuario: Usuario; previa: PreviaInativacao } | null>(null);
  const [erroSemGestor, setErroSemGestor] = useState<string | null>(null);
  const [inativando, setInativando] = useState(false);

  const meId = authService.getUsuario()?.id;

  const loadData = async () => {
    const [usuariosData, papeisData] = await Promise.all([
      usuarioService.getAll(),
      papelService.getAll(),
    ]);
    setUsuarios(usuariosData);
    setPapeis(papeisData);
  };

  const carregar = () => {
    setLoading(true);
    setLoadError(null);
    loadData()
      // motivo real (sem permissão, sem conexão, erro do servidor com código de referência)
      .catch((err: any) => setLoadError(textoDoErro(parseApiError(err))))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const copiarSenha = async () => {
    if (!senhaTemporaria) return;
    try {
      await navigator.clipboard.writeText(senhaTemporaria.senha);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2500);
    } catch {
      toast('Não foi possível copiar automaticamente. Selecione a senha e copie manualmente.', 'warning');
    }
  };

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      const matchesSearch =
        !search ||
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.matricula.toLowerCase().includes(search.toLowerCase());

      const matchesPapel = papelFilter === 'all' || u.papel === papelFilter;
      const matchesAtivo =
        ativoFilter === 'all' ||
        (ativoFilter === 'ativos' && u.ativo) ||
        (ativoFilter === 'inativos' && !u.ativo);

      return matchesSearch && matchesPapel && matchesAtivo;
    });
  }, [usuarios, search, papelFilter, ativoFilter]);

  const stats = useMemo(() => ({
    total: usuarios.length,
    ativos: usuarios.filter((u) => u.ativo).length,
    inativos: usuarios.filter((u) => !u.ativo).length,
  }), [usuarios]);

  const handleSaveUsuario = async (payload: UsuarioPayload) => {
    try {
      setErrors({});
      if (editingUsuario) {
        await usuarioService.atualizar(editingUsuario.id, payload);
        toast(`Dados de ${payload.nome} atualizados com sucesso.`, 'success');
      } else {
        const criado = await usuarioService.cadastrar(payload);
        // senha temporária aleatória gerada pelo backend — exibida uma única vez para o admin repassar
        if (criado?.senhaTemporaria) {
          setCopiada(false);
          setSenhaTemporaria({ nome: payload.nome, senha: criado.senhaTemporaria });
        } else {
          toast(`Usuário ${payload.nome} cadastrado com sucesso.`, 'success');
        }
      }
      await loadData();
      setEditingUsuario(null);
      return true;
    } catch (error: any) {
      // erro de campo (ex.: "Já existe um usuário cadastrado com este e-mail.") aparece junto ao campo;
      // os demais (sem permissão, servidor) aparecem no topo do formulário
      const parsed = parseApiError(error);
      setErrors(parsed.fields && Object.keys(parsed.fields).length ? parsed.fields : { geral: textoDoErro(parsed) });
      return false;
    }
  };

  /** Executa a inativação já decidida e informa o resultado com o responsável pela redistribuição. */
  const executarInativacao = async (usuario: Usuario, previa: PreviaInativacao | null, decisao?: DecisaoSemGestor) => {
    setInativando(true);
    setErroSemGestor(null);
    try {
      await usuarioService.inativar(usuario.id, decisao?.tipo === 'vincular' ? { gestorId: decisao.gestorId }
        : decisao?.tipo === 'assumir' ? { semGestor: true } : {});
      const n = previa?.leadsAtribuidos ?? 0;
      const gestorNome = decisao?.tipo === 'vincular' ? usuarios.find(u => u.id === decisao.gestorId)?.nome : previa?.gestorNome;
      const leadsTxt = n === 1 ? '1 lead aguarda' : `${n} leads aguardam`;
      toast(n === 0
        ? `${usuario.nome} foi desativado.`
        : decisao?.tipo === 'assumir'
          ? `${usuario.nome} foi desativado. ${leadsTxt} redistribuição sob sua responsabilidade, na tela Redistribuição.`
          : `${usuario.nome} foi desativado. ${leadsTxt} redistribuição; ${gestorNome ?? 'o gestor'} foi notificado.`, 'success');
      setPreviaSemGestor(null);
      await loadData();
    } catch (err) {
      const p = parseApiError(err);
      // outra pessoa removeu o gestor nesse meio-tempo: pede a decisão
      if (p.code === 'CORRETOR_SEM_GESTOR') {
        try { setPreviaSemGestor({ usuario, previa: await usuarioService.previaInativacao(usuario.id) }); } catch {}
      } else if (previaSemGestor && p.fields?.gestorId) {
        setErroSemGestor(p.fields.gestorId);
      } else {
        notificarErro(toast, `Não foi possível desativar ${usuario.nome}`, err);
      }
    } finally {
      setInativando(false);
    }
  };

  const handleToggleAtivo = async (usuario: Usuario) => {
    if (usuario.ativo) {
      // consulta antes: gestor vinculado e quantos leads irão para redistribuição
      let previa: PreviaInativacao;
      try {
        previa = await usuarioService.previaInativacao(usuario.id);
      } catch (err) {
        notificarErro(toast, `Não foi possível preparar a inativação de ${usuario.nome}`, err);
        return;
      }
      if (fluxoDeInativacao(previa) === 'decidir-gestor') {
        setErroSemGestor(null);
        setPreviaSemGestor({ usuario, previa });
        return;
      }
      const ok = await confirmar({
        titulo: `Desativar ${usuario.nome}?`,
        mensagem: mensagemInativacao(previa),
        confirmarLabel: 'Desativar usuário',
        perigo: true,
      });
      if (ok) await executarInativacao(usuario, previa);
      return;
    }

    const ok = await confirmar({
      titulo: `Reativar ${usuario.nome}?`,
      mensagem: `${usuario.nome} voltará a acessar o sistema com a senha atual.`,
      confirmarLabel: 'Reativar usuário',
    });
    if (!ok) return;
    try {
      await usuarioService.ativar(usuario.id);
      toast(`${usuario.nome} foi reativado e já pode acessar o sistema.`, 'success');
      await loadData();
    } catch (err) {
      notificarErro(toast, `Não foi possível reativar ${usuario.nome}`, err);
    }
  };

  const openEditar = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setErrors({});
    setIsUsuarioModalOpen(true);
  };

  const openNovo = () => {
    setEditingUsuario(null);
    setErrors({});
    setIsUsuarioModalOpen(true);
  };

  const openRedefinirSenha = (usuario: Usuario) => {
    setSenhaTarget(usuario);
    setNovaSenha('');
    setConfirmarSenha('');
    setSenhaError(null);
    setSenhaCampos({});
    setIsSenhaModalOpen(true);
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setSenhaError(null);

    // mesma regra do backend (validarForcaSenha): antes só o tamanho era verificado aqui
    const campos: { novaSenha?: string; confirmarSenha?: string } = {};
    campos.novaSenha = !novaSenha ? 'Informe a nova senha.' : problemaSenha(novaSenha) ?? undefined;
    campos.confirmarSenha = !confirmarSenha ? 'Confirme a nova senha.'
      : confirmarSenha !== novaSenha ? 'A confirmação está diferente da nova senha. Digite a mesma senha nos dois campos.' : undefined;
    setSenhaCampos(campos);
    if (campos.novaSenha || campos.confirmarSenha) {
      document.getElementById(campos.novaSenha ? 'redefinir-novaSenha' : 'redefinir-confirmar')?.focus();
      return;
    }
    if (!senhaTarget) return;

    try {
      await usuarioService.trocarSenhaAdmin(senhaTarget.id, novaSenha);
      toast(`Senha de ${senhaTarget.nome} redefinida. Ele deverá trocá-la no próximo acesso.`, 'success');
      setIsSenhaModalOpen(false);
      setSenhaTarget(null);
      await loadData();
    } catch (err: any) {
      // motivo real: senha fraca (com o requisito que faltou), usuário não encontrado, etc.
      const p = parseApiError(err);
      if (p.fields?.novaSenha) setSenhaCampos({ novaSenha: p.fields.novaSenha });
      else setSenhaError(textoDoErro(p));
    }
  };

  /** Retorna null em caso de sucesso ou o motivo do erro, que o modal exibe junto ao campo. */
  const handleNovoPapel = async (papel: string): Promise<string | null> => {
    try {
      await papelService.criar(papel);
      await loadData();
      toast(`Papel "${papel}" criado com sucesso.`, 'success');
      return null;
    } catch (err) {
      // antes o motivo era descartado e o modal dizia apenas "Não foi possível criar o papel."
      return textoDoErro(parseApiError(err));
    }
  };

  const handleDeletePapel = async (papel: Papel) => {
    const count = usuarios.filter((u) => u.papel === papel.papel).length;
    // o backend apenas inativa o papel (PapelController.excluir): ele some das listas, mas os vínculos ficam
    const ok = await confirmar({
      titulo: `Excluir o papel "${papel.papel}"?`,
      mensagem: count > 0
        ? `${plural(count, 'usuário está vinculado', 'usuários estão vinculados')} a este papel (contando os desativados). O papel deixará de aparecer para novos cadastros, mas esses usuários continuarão com ele.`
        : 'O papel deixará de aparecer para novos cadastros.',
      confirmarLabel: 'Excluir papel',
      perigo: true,
    });
    if (!ok) return;

    try {
      await papelService.excluir(papel.id);
      await loadData();
      toast(`Papel "${papel.papel}" excluído.`, 'success');
    } catch (err: any) {
      notificarErro(toast, `Não foi possível excluir o papel "${papel.papel}"`, err);
    }
  };

  const labelStatus = (u: Usuario) => (u.ativo ? 'Ativo' : 'Inativo');

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-brand-soft text-brand-fg flex items-center justify-center">
              <UserCog size={24} />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-ink tracking-tight">Gerenciamento de Usuários</h1>
              <p className="text-muted">Controle o acesso da equipe à plataforma</p>
            </div>
          </div>
          <button
            onClick={openNovo}
            className="flex items-center gap-2 bg-brand text-on-brand px-6 py-2.5 rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors"
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>

        {senhaTemporaria && (
          <div role="status" className="mb-6 bg-success-bg border border-success-border px-4 py-3 text-sm text-success rounded-btn flex items-start gap-3">
            <CheckCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Usuário {senhaTemporaria.nome} cadastrado com sucesso.</p>
              <p className="mt-1 text-ink">
                Senha temporária:{' '}
                <code className="px-1.5 py-0.5 bg-card border border-line rounded font-mono select-all break-all">{senhaTemporaria.senha}</code>
                <button
                  type="button"
                  onClick={copiarSenha}
                  className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-fg hover:text-brand-hover"
                >
                  <Copy size={13} aria-hidden="true" /> {copiada ? 'Copiada!' : 'Copiar'}
                </button>
              </p>
              <p className="mt-1 text-muted">
                Repasse esta senha ao usuário. Ela não será exibida novamente e deverá ser trocada no primeiro acesso.
              </p>
            </div>
            <button
              onClick={() => setSenhaTemporaria(null)}
              aria-label="Fechar aviso da senha temporária"
              className="p-1 rounded text-muted hover:text-ink"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {loadError && !loading && (
          <div className="mb-6">
            <ErrorState message="Não foi possível carregar os usuários." details={loadError} onRetry={carregar} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card p-5 border border-line rounded-card shadow-card">
            <p className="text-sm text-muted mb-1">Total de Usuários</p>
            <p className="text-3xl font-bold text-ink">{stats.total}</p>
          </div>
          <div className="bg-card p-5 border border-line rounded-card shadow-card">
            <p className="text-sm text-muted mb-1">Ativos</p>
            <p className="text-3xl font-bold text-success">{stats.ativos}</p>
          </div>
          <div className="bg-card p-5 border border-line rounded-card shadow-card">
            <p className="text-sm text-muted mb-1">Inativos</p>
            <p className="text-3xl font-bold text-muted">{stats.inativos}</p>
          </div>
        </div>

        {/* Papéis */}
        <div className="bg-card border border-line rounded-card shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-brand-fg" />
              <span className="font-semibold text-ink">Papéis da equipe</span>
            </div>
            <button
              onClick={() => setIsPapelModalOpen(true)}
              className="flex items-center gap-1 text-sm text-brand-fg hover:text-brand-hover font-medium"
            >
              <Plus size={16} />
              Novo Papel
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {papeis.map((p) => {
              // mesma lista do backend (PapelController.PAPEIS_DE_SISTEMA): as regras de negócio dependem destes papéis
              const isSystem = ['admin', 'gestor', 'corretor'].includes(p.papel);
              const count = usuarios.filter((u) => u.papel === p.papel).length;
              return (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-surface border border-line rounded-full text-ink"
                >
                  {p.papel}
                  <span className="text-xs text-muted" title={`${count} usuário(s) vinculado(s)`}>
                    ({count})
                  </span>
                  <button
                    onClick={() => handleDeletePapel(p)}
                    disabled={isSystem}
                    title={isSystem ? 'Papel do sistema — não pode ser excluído' : 'Excluir papel'}
                    aria-label={isSystem ? `O papel ${p.papel} é do sistema e não pode ser excluído` : `Excluir o papel ${p.papel}`}
                    className={`p-0.5 ${
                      isSystem
                        ? 'text-placeholder cursor-not-allowed'
                        : 'text-danger hover:text-danger'
                    }`}
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              );
            })}
            {papeis.length === 0 && (
              <p className="text-sm text-muted">Nenhum papel cadastrado.</p>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-card border border-line rounded-card shadow-card p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou matrícula..."
                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
              />
            </div>
            <select
              value={papelFilter}
              onChange={(e) => setPapelFilter(e.target.value)}
              className="px-3 py-2.5 border border-line rounded-btn focus:outline-none focus:border-focus"
            >
              <option value="all">Todos os papéis</option>
              {papeis.map((p) => (
                <option key={p.id} value={p.papel}>
                  {p.papel}
                </option>
              ))}
            </select>
            <select
              value={ativoFilter}
              onChange={(e) => setAtivoFilter(e.target.value as any)}
              className="px-3 py-2.5 border border-line rounded-btn focus:outline-none focus:border-focus"
            >
              <option value="all">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-card border border-line rounded-card shadow-card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
              <Loader2 size={32} className="animate-spin text-brand-fg" aria-hidden="true" />
              <p className="text-sm text-muted">Carregando usuários...</p>
            </div>
          ) : loadError ? null : filteredUsuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-muted mb-4" aria-hidden="true" />
              {usuarios.length === 0 ? (
                <>
                  <p className="text-muted text-lg">Nenhum usuário cadastrado ainda.</p>
                  <button
                    onClick={openNovo}
                    className="mt-4 text-brand-fg hover:text-brand-hover font-medium"
                  >
                    Adicionar primeiro usuário
                  </button>
                </>
              ) : (
                <p className="text-muted text-lg">Nenhum usuário corresponde à busca ou aos filtros selecionados.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-subtle border-b border-line text-left text-xs font-bold text-muted uppercase tracking-wide">
                    <th className="px-6 py-3">Usuário</th>
                    <th className="px-6 py-3">Matrícula</th>
                    <th className="px-6 py-3">Telefone</th>
                    <th className="px-6 py-3">Papel</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredUsuarios.map((usuario) => {
                    const isMe = usuario.id === meId;
                    return (
                      <tr key={usuario.id} className="hover:bg-surface">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-soft text-brand-fg rounded-xl flex items-center justify-center shrink-0 font-bold">
                              <span className="text-sm">
                                {usuario.nome.split(' ').slice(0, 2).map((n) => n.charAt(0)).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate">
                                {usuario.nome}
                                {isMe && <span className="ml-2 text-xs text-brand-fg font-normal">(você)</span>}
                              </p>
                              <p className="text-sm text-muted truncate">{usuario.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink">{usuario.matricula}</td>
                        <td className="px-6 py-4 text-sm text-ink">{usuario.telefone}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold bg-surface text-muted rounded-full">
                            {usuario.papel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full ${
                              usuario.ativo
                                ? 'bg-success-bg text-success'
                                : 'bg-danger-bg text-danger'
                            }`}
                          >
                            {labelStatus(usuario)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditar(usuario)}
                              title="Editar usuário"
                              aria-label={`Editar ${usuario.nome}`}
                              className="p-2 rounded-lg text-muted hover:text-brand-fg hover:bg-brand-soft"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => openRedefinirSenha(usuario)}
                              title="Redefinir senha"
                              aria-label={`Redefinir a senha de ${usuario.nome}`}
                              className="p-2 rounded-lg text-muted hover:text-warning hover:bg-warning-bg"
                            >
                              <KeyRound size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleAtivo(usuario)}
                              disabled={isMe}
                              title={isMe ? 'Você não pode desativar o próprio usuário' : usuario.ativo ? 'Desativar usuário' : 'Reativar usuário'}
                              aria-label={isMe ? 'Você não pode desativar o próprio usuário' : `${usuario.ativo ? 'Desativar' : 'Reativar'} ${usuario.nome}`}
                              className={`p-2 rounded-lg ${
                                isMe
                                  ? 'text-placeholder cursor-not-allowed'
                                  : usuario.ativo
                                    ? 'text-muted hover:text-danger hover:bg-danger-bg'
                                    : 'text-muted hover:text-success hover:bg-success-bg'
                              }`}
                            >
                              {usuario.ativo ? <UserX size={18} /> : <UserCheck size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modais */}
        <UsuarioModal
          isOpen={isUsuarioModalOpen}
          onClose={() => {
            setIsUsuarioModalOpen(false);
            setEditingUsuario(null);
            setErrors({});
          }}
          onSave={handleSaveUsuario}
          editingUsuario={editingUsuario}
          papeis={papeis}
          errors={errors}
          usuarios={usuarios}
        />

        {previaSemGestor && (
          <InativacaoSemGestorModal
            previa={previaSemGestor.previa}
            usuarios={usuarios}
            meuNome={authService.getUsuario()?.nome ?? 'você'}
            enviando={inativando}
            erro={erroSemGestor}
            onConfirmar={(d) => executarInativacao(previaSemGestor.usuario, previaSemGestor.previa, d)}
            onCancelar={() => { if (!inativando) setPreviaSemGestor(null); }}
          />
        )}

        <PapelModal
          isOpen={isPapelModalOpen}
          onClose={() => setIsPapelModalOpen(false)}
          onSave={handleNovoPapel}
        />

        {/* Modal redefinir senha */}
        {isSenhaModalOpen && senhaTarget && (
          <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card max-w-md w-full rounded-card shadow-card-lg">
              <div className="flex justify-between items-center p-6 border-b border-line">
                <h2 className="text-xl font-bold text-ink">Redefinir Senha</h2>
                <button
                  onClick={() => {
                    setIsSenhaModalOpen(false);
                    setSenhaTarget(null);
                  }}
                  aria-label="Fechar"
                  className="p-2 rounded-lg hover:bg-surface"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleRedefinirSenha} noValidate className="p-6 space-y-4">
                <p className="text-sm text-muted">
                  Definindo a nova senha de <strong className="text-ink">{senhaTarget.nome}</strong>. O usuário
                  precisará trocá-la no próximo login.
                </p>

                <div>
                  <label htmlFor="redefinir-novaSenha" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Nova senha <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="redefinir-novaSenha"
                    type="password"
                    autoComplete="new-password"
                    value={novaSenha}
                    aria-invalid={!!senhaCampos.novaSenha || undefined}
                    aria-describedby={senhaCampos.novaSenha ? 'redefinir-novaSenha-erro' : 'redefinir-ajuda'}
                    onChange={(e) => { setNovaSenha(e.target.value); setSenhaCampos(c => ({ ...c, novaSenha: undefined })); }}
                    className={`w-full p-2.5 border rounded-btn focus:outline-none focus:ring-4 ${senhaCampos.novaSenha ? 'border-danger focus:ring-danger/25' : 'border-line focus:border-focus focus:ring-focus/30'}`}
                    placeholder="Mínimo de 8 caracteres"
                  />
                  <InlineError id="redefinir-novaSenha-erro" message={senhaCampos.novaSenha} />
                  {!senhaCampos.novaSenha && (
                    <p id="redefinir-ajuda" className="text-xs text-muted mt-1">8 ou mais caracteres, combinando pelo menos 3 destes tipos: maiúscula, minúscula, número e caractere especial.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="redefinir-confirmar" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Confirmar nova senha <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="redefinir-confirmar"
                    type="password"
                    autoComplete="new-password"
                    value={confirmarSenha}
                    aria-invalid={!!senhaCampos.confirmarSenha || undefined}
                    aria-describedby={senhaCampos.confirmarSenha ? 'redefinir-confirmar-erro' : undefined}
                    onChange={(e) => { setConfirmarSenha(e.target.value); setSenhaCampos(c => ({ ...c, confirmarSenha: undefined })); }}
                    className={`w-full p-2.5 border rounded-btn focus:outline-none focus:ring-4 ${senhaCampos.confirmarSenha ? 'border-danger focus:ring-danger/25' : 'border-line focus:border-focus focus:ring-focus/30'}`}
                    placeholder="Repita a nova senha"
                  />
                  <InlineError id="redefinir-confirmar-erro" message={senhaCampos.confirmarSenha} />
                </div>

                {senhaError && (
                  <p role="alert" className="text-danger text-sm">{senhaError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSenhaModalOpen(false);
                      setSenhaTarget(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted hover:bg-surface transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover transition-colors"
                  >
                    Redefinir Senha
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
