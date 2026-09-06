'use client';

import React, { useState, useEffect } from 'react';
import { Papel, Usuario, UsuarioPayload } from '@/types';
import { X } from 'lucide-react';
import InputMask from 'react-input-mask';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: UsuarioPayload) => Promise<boolean>;
  editingUsuario?: Usuario | null;
  papeis: Papel[];
  errors?: any;
  usuarios?: Usuario[];
}

const formatarTelefone = (telefone: string) => {
  return telefone
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

export default function UsuarioModal({
  isOpen,
  onClose,
  onSave,
  editingUsuario,
  papeis,
  errors,
  usuarios = [],
}: UsuarioModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    genero: 'M',
    telefone: '',
    dataNascimento: '',
    papelId: '',
    gestorId: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (editingUsuario) {
      setFormData({
        nome: editingUsuario.nome,
        email: editingUsuario.email,
        cpf: editingUsuario.cpf,
        genero: editingUsuario.genero || 'M',
        telefone: formatarTelefone(editingUsuario.telefone),
        dataNascimento: editingUsuario.dataNascimento || '',
        papelId: String(
          papeis.find((p) => p.papel === editingUsuario.papel)?.id ?? ''
        ),
        gestorId: (editingUsuario as any).gestorId ? String((editingUsuario as any).gestorId) : '',
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        cpf: '',
        genero: 'M',
        telefone: '',
        dataNascimento: '',
        papelId: papeis.length > 0 ? String(papeis[0].id) : '',
        gestorId: '',
      });
    }
  }, [isOpen, editingUsuario, papeis]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: UsuarioPayload = {
      nome: formData.nome,
      email: formData.email,
      cpf: formData.cpf,
      genero: formData.genero,
      telefone: formData.telefone,
      dataNascimento: formData.dataNascimento,
      papelId: Number(formData.papelId),
      gestorId: formData.gestorId ? Number(formData.gestorId) : null,
    };

    const sucesso = await onSave(payload);
    setLoading(false);

    if (sucesso) {
      onClose();
    }
  };

  const inputClass =
    'w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-primary-300 focus:ring-4 focus:ring-primary/10';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-card shadow-card-lg">
        <div className="flex justify-between items-center p-6 border-b border-line">
          <h2 className="text-xl font-bold text-ink">
            {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!editingUsuario && (
            <div className="bg-[#eaf1f8] border border-[#cfe0ef] px-4 py-3 text-sm text-[#274b6b] rounded-btn">
              A senha inicial será os <strong>4 últimos dígitos do CPF</strong> e o
              usuário deverá trocá-la no primeiro acesso.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className={inputClass}
                placeholder="João Silva"
              />
              {errors?.nome && <p className="text-[#c0392b] text-sm mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
                placeholder="joao@email.com"
              />
              {errors?.email && <p className="text-[#c0392b] text-sm mt-1">{errors.email}</p>}
            </div>

            {!editingUsuario && (
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  CPF <span className="text-red-500">*</span>
                </label>
                <InputMask
                  mask="999.999.999-99"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                >
                  {(inputProps: any) => (
                    <input {...inputProps} type="text" required className={inputClass} placeholder="000.000.000-00" />
                  )}
                </InputMask>
                {errors?.cpf && <p className="text-[#c0392b] text-sm mt-1">{errors.cpf}</p>}
              </div>
            )}

            {editingUsuario && (
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                  CPF
                </label>
                <input type="text" value={formData.cpf} disabled className={`${inputClass} bg-surface`} />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Gênero <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.genero}
                onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                className={inputClass}
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Telefone <span className="text-red-500">*</span>
              </label>
              <InputMask
                mask="(99) 99999-9999"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              >
                {(inputProps: any) => (
                  <input {...inputProps} type="tel" required className={inputClass} placeholder="(11) 98765-4321" />
                )}
              </InputMask>
              {errors?.telefone && (
                <p className="text-[#c0392b] text-sm mt-1">{errors.telefone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Data de Nascimento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                className={inputClass}
              />
              {errors?.dataNascimento && (
                <p className="text-[#c0392b] text-sm mt-1">{errors.dataNascimento}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Papel <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.papelId}
                onChange={(e) => setFormData({ ...formData, papelId: e.target.value })}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {papeis.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.papel}
                  </option>
                ))}
              </select>
              {errors?.papelId && <p className="text-[#c0392b] text-sm mt-1">{errors.papelId}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Gestor responsável
              </label>
              <select
                value={formData.gestorId}
                onChange={(e) => setFormData({ ...formData, gestorId: e.target.value })}
                className={inputClass}
              >
                <option value="">Sem gestor (equipe sem vínculo)</option>
                {usuarios.filter(u=> u.papel==='gestor' || u.papel==='admin').map(g=> (
                  <option key={g.id} value={g.id}>{g.nome} ({g.papel})</option>
                ))}
              </select>
              <p className="text-xs text-muted mt-1">Selecione o gestor deste corretor para aparecer no Dashboard do Gestor.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted hover:bg-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-btn font-semibold shadow-btn hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Salvando...' : editingUsuario ? 'Salvar Alterações' : 'Adicionar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
