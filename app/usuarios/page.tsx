'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserCog, Plus, Search, Edit, KeyRound, UserX, UserCheck, Shield, Users, X, Loader2 } from 'lucide-react';
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

  const labelStatus = (u: Usuario) => (u.ativo ? 'Ativo' : 'Inativo');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCog size={32} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
              <p className="text-gray-600">Controle o acesso da equipe à plataforma</p>
            </div>
          </div>
          <button
            onClick={openNovo}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus size={20} />
            Novo Usuário
          </button>
        </div>

        {notify && (
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800 flex items-center justify-between">
            <span>{notify}</span>
            <button onClick={() => setNotify(null)} className="text-blue-500 hover:text-blue-700">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total de Usuários</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Ativos</p>
            <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Inativos</p>
            <p className="text-2xl font-bold text-gray-500">{stats.inativos}</p>
          </div>
        </div>

        {/* Papéis */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-700">Papéis da equipe</span>
            </div>
            <button
              onClick={() => setIsPapelModalOpen(true)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={16} />
              Novo Papel
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {papeis.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
              >
                {p.papel}
              </span>
            ))}
            {papeis.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum papel cadastrado.</p>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, e-mail ou matrícula..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={papelFilter}
              onChange={(e) => setPapelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Nenhum usuário encontrado</p>
              <button
                onClick={openNovo}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Adicionar primeiro usuário
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-6 py-3">Usuário</th>
                    <th className="px-6 py-3">Matrícula</th>
                    <th className="px-6 py-3">Telefone</th>
                    <th className="px-6 py-3">Papel</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsuarios.map((usuario) => {
                    const isMe = usuario.id === meId;
                    return (
                      <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-blue-600 font-semibold text-sm">
                                {usuario.nome.split(' ').slice(0, 2).map((n) => n.charAt(0)).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {usuario.nome}
                                {isMe && <span className="ml-2 text-xs text-blue-600 font-normal">(você)</span>}
                              </p>
                              <p className="text-sm text-gray-500 truncate">{usuario.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{usuario.matricula}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{usuario.telefone}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {usuario.papel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              usuario.ativo
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
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
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => openRedefinirSenha(usuario)}
                              title="Redefinir senha"
                              className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <KeyRound size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleAtivo(usuario)}
                              disabled={isMe}
                              title={usuario.ativo ? 'Desativar usuário' : 'Reativar usuário'}
                              className={`p-2 rounded-lg transition-colors ${
                                isMe
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : usuario.ativo
                                    ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
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
        />

        <PapelModal
          isOpen={isPapelModalOpen}
          onClose={() => setIsPapelModalOpen(false)}
          onSave={handleNovoPapel}
        />

        {/* Modal redefinir senha */}
        {isSenhaModalOpen && senhaTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Redefinir Senha</h2>
                <button
                  onClick={() => {
                    setIsSenhaModalOpen(false);
                    setSenhaTarget(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRedefinirSenha} className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Definindo a nova senha de <strong>{senhaTarget.nome}</strong>. O usuário
                  precisará trocá-la no próximo login.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova senha *
                  </label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mínimo de 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar nova senha *
                  </label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Repita a nova senha"
                  />
                </div>

                {senhaError && (
                  <p className="text-red-500 text-sm">{senhaError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSenhaModalOpen(false);
                      setSenhaTarget(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
