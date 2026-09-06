'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserCog, Plus, Search, Edit, KeyRound, UserX, UserCheck, Shield, Users, X, Loader2, Trash2 } from 'lucide-react';
import { Usuario, Papel, UsuarioPayload } from '@/types';
import { usuarioService } from '@/service/usuarioService';
import { papelService } from '@/service/papelService';
import { authService } from '@/service/authService';
import UsuarioModal from '@/components/UsuarioModal';
import PapelModal from '@/components/PapelModal';

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
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [notify, setNotify] = useState<string | null>(null);

  const meId = authService.getUsuario()?.id;

  const loadData = async () => {
    const [usuariosData, papeisData] = await Promise.all([
      usuarioService.getAll(),
      papelService.getAll(),
    ]);
    setUsuarios(usuariosData);
    setPapeis(papeisData);
  };

  useEffect(() => {
    loadData()
      .catch((err: any) => {
        if (err.response?.status === 403) {
          setNotify('Acesso não permitido. Apenas administradores gerenciam usuários.');
        } else {
          setNotify('Não foi possível carregar os usuários.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

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
        setNotify('Usuário atualizado com sucesso.');
      } else {
        await usuarioService.cadastrar(payload);
        setNotify('Usuário cadastrado com sucesso. A senha inicial são os 4 últimos dígitos do CPF.');
      }
      await loadData();
      setEditingUsuario(null);
      return true;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors: any = {};
        error.response.data.errors.forEach((err: any) => {
          backendErrors[err.field] = err.message;
        });
        setErrors(backendErrors);
      } else if (error.response?.data && typeof error.response.data === 'string') {
        setErrors({ geral: error.response.data });
      } else {
        setErrors({ geral: 'Erro ao salvar usuário' });
      }
      return false;
    }
  };

  const handleToggleAtivo = async (usuario: Usuario) => {
    const acao = usuario.ativo ? 'desativar' : 'reativar';
    if (!confirm(`Tem certeza que deseja ${acao} o usuário ${usuario.nome}?`)) return;

    try {
      if (usuario.ativo) {
        await usuarioService.inativar(usuario.id);
      } else {
        await usuarioService.ativar(usuario.id);
      }
      setNotify(usuario.ativo ? 'Usuário desativado.' : 'Usuário reativado.');
      await loadData();
    } catch {
      setNotify('Não foi possível alterar o status do usuário.');
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
    setIsSenhaModalOpen(true);
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setSenhaError(null);

    if (!novaSenha || novaSenha.length < 6) {
      setSenhaError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaError('A confirmação não confere com a nova senha.');
      return;
    }
    if (!senhaTarget) return;

    try {
      await usuarioService.trocarSenhaAdmin(senhaTarget.id, novaSenha);
      setNotify('Senha redefinida. O usuário deverá trocá-la no próximo login.');
      setIsSenhaModalOpen(false);
      setSenhaTarget(null);
      await loadData();
    } catch (err: any) {
      setSenhaError(
        err.response?.data && typeof err.response.data === 'string'
          ? err.response.data
          : 'Não foi possível redefinir a senha.'
      );
    }
  };

  const handleNovoPapel = async (papel: string) => {
    try {
      await papelService.criar(papel);
      await loadData();
      setNotify(`Papel "${papel}" criado.`);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeletePapel = async (papel: Papel) => {
    const count = usuarios.filter((u) => u.papel === papel.papel).length;
    const mensagem =
      count > 0
        ? `O papel "${papel.papel}" está vinculado a ${count} usuário(s) (incluindo desativados). Ele será ocultado do sistema e os usuários manterão o vínculo. Continuar?`
        : `Excluir o papel "${papel.papel}"?`;

    if (!confirm(mensagem)) return;

    try {
      await papelService.excluir(papel.id);
      await loadData();
      setNotify(`Papel "${papel.papel}" excluído.`);
    } catch (err: any) {
      const message =
        err.response?.data && typeof err.response.data === 'string'
          ? err.response.data
          : 'Não foi possível excluir o papel.';
      setNotify(message);
    }
  };

  const labelStatus = (u: Usuario) => (u.ativo ? 'Ativo' : 'Inativo');

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
              <UserCog size={24} />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-ink tracking-tight">Gerenciamento de Usuários</h1>
              <p className="text-muted">Controle o acesso da equipe à plataforma</p>
            </div>
          </div>
          <button
            onClick={openNovo}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-btn font-semibold shadow-btn hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>

        {notify && (
          <div className="mb-6 bg-[#eaf1f8] border border-[#cfe0ef] px-4 py-3 text-sm text-[#274b6b] rounded-btn flex items-center justify-between">
            <span>{notify}</span>
            <button onClick={() => setNotify(null)} className="text-primary-500 hover:text-primary-700">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 border border-line rounded-card shadow-card">
            <p className="text-sm text-muted mb-1">Total de Usuários</p>
            <p className="text-3xl font-bold text-ink">{stats.total}</p>
          </div>
          <div className="bg-white p-5 border border-line rounded-card shadow-card">
            <p className="text-sm text-muted mb-1">Ativos</p>
            <p className="text-3xl font-bold text-[#0f8a52]">{stats.ativos}</p>
          </div>
          <div className="bg-white p-5 border border-line rounded-card shadow-card">
            <p className="text-sm text-muted mb-1">Inativos</p>
            <p className="text-3xl font-bold text-muted">{stats.inativos}</p>
          </div>
        </div>

        {/* Papéis */}
        <div className="bg-white border border-line rounded-card shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              <span className="font-semibold text-ink">Papéis da equipe</span>
            </div>
            <button
              onClick={() => setIsPapelModalOpen(true)}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary-700 font-medium"
            >
              <Plus size={16} />
              Novo Papel
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {papeis.map((p) => {
              const isSystem = p.papel === 'admin' || p.papel === 'corretor';
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
                    className={`p-0.5 ${
                      isSystem
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-[#c0392b] hover:text-red-700'
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
        <div className="bg-white border border-line rounded-card shadow-card p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou matrícula..."
                className="w-full pl-10 pr-4 py-2.5 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <select
              value={papelFilter}
              onChange={(e) => setPapelFilter(e.target.value)}
              className="px-3 py-2.5 border border-line rounded-btn focus:outline-none focus:border-primary-300"
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
              className="px-3 py-2.5 border border-line rounded-btn focus:outline-none focus:border-primary-300"
            >
              <option value="all">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-line rounded-card shadow-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-muted mb-4" />
              <p className="text-muted text-lg">Nenhum usuário encontrado</p>
              <button
                onClick={openNovo}
                className="mt-4 text-primary hover:text-primary-700 font-medium"
              >
                Adicionar primeiro usuário
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#eef2f7] border-b border-line text-left text-xs font-bold text-muted uppercase tracking-wide">
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
                            <div className="w-10 h-10 bg-primary-50 text-primary rounded-xl flex items-center justify-center shrink-0 font-bold">
                              <span className="text-sm">
                                {usuario.nome.split(' ').slice(0, 2).map((n) => n.charAt(0)).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate">
                                {usuario.nome}
                                {isMe && <span className="ml-2 text-xs text-primary font-normal">(você)</span>}
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
                                ? 'bg-[#e8f6ee] text-[#0f8a52]'
                                : 'bg-[#fdeceb] text-[#c0392b]'
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
                              className="p-2 rounded-lg text-muted hover:text-primary hover:bg-primary-50"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => openRedefinirSenha(usuario)}
                              title="Redefinir senha"
                              className="p-2 rounded-lg text-muted hover:text-amber-600 hover:bg-amber-50"
                            >
                              <KeyRound size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleAtivo(usuario)}
                              disabled={isMe}
                              title={usuario.ativo ? 'Desativar usuário' : 'Reativar usuário'}
                              className={`p-2 rounded-lg ${
                                isMe
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : usuario.ativo
                                    ? 'text-muted hover:text-[#c0392b] hover:bg-[#fdeceb]'
                                    : 'text-muted hover:text-[#0f8a52] hover:bg-[#e8f6ee]'
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

        <PapelModal
          isOpen={isPapelModalOpen}
          onClose={() => setIsPapelModalOpen(false)}
          onSave={handleNovoPapel}
        />

        {/* Modal redefinir senha */}
        {isSenhaModalOpen && senhaTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-md w-full rounded-card shadow-card-lg">
              <div className="flex justify-between items-center p-6 border-b border-line">
                <h2 className="text-xl font-bold text-ink">Redefinir Senha</h2>
                <button
                  onClick={() => {
                    setIsSenhaModalOpen(false);
                    setSenhaTarget(null);
                  }}
                  className="p-2 rounded-lg hover:bg-surface"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRedefinirSenha} className="p-6 space-y-4">
                <p className="text-sm text-muted">
                  Definindo a nova senha de <strong className="text-ink">{senhaTarget.nome}</strong>. O usuário
                  precisará trocá-la no próximo login.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Nova senha *
                  </label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
                    placeholder="Mínimo de 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                    Confirmar nova senha *
                  </label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10"
                    placeholder="Repita a nova senha"
                  />
                </div>

                {senhaError && (
                  <p className="text-[#c0392b] text-sm">{senhaError}</p>
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
                    className="flex-1 px-4 py-2.5 bg-primary text-white rounded-btn font-semibold shadow-btn hover:bg-primary-700 transition-colors"
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
