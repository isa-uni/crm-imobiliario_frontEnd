'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PapelModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Retorna null em caso de sucesso ou o motivo do erro (ex.: "Já existe um papel com este nome."). */
  onSave: (papel: string) => Promise<string | null>;
}

export default function PapelModal({ isOpen, onClose, onSave }: PapelModalProps) {
  const [papel, setPapel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nome = papel.trim();
    if (!nome) {
      setError('Informe o nome do papel.');
      return;
    }
    if (nome.length < 2 || nome.length > 50) {
      setError('O nome do papel deve ter entre 2 e 50 caracteres.');
      return;
    }
    if (!/^[a-zà-ú0-9 _-]+$/i.test(nome)) {
      setError('O nome do papel pode conter apenas letras, números, espaço, hífen e sublinhado.');
      return;
    }

    setLoading(true);
    const erro = await onSave(papel.trim().toLowerCase());
    setLoading(false);

    if (erro == null) {
      setPapel('');
      onClose();
    } else {
      // motivo real vindo do backend (antes: sempre "Não foi possível criar o papel.")
      setError(erro);
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card max-w-md w-full rounded-card shadow-card-lg">
        <div className="flex justify-between items-center p-6 border-b border-line">
          <h2 className="text-xl font-bold text-ink">Novo Papel</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg hover:bg-surface"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div>
            <label htmlFor="papel-nome" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Nome do papel <span className="text-danger">*</span>
            </label>
            <input
              id="papel-nome"
              type="text"
              maxLength={50}
              value={papel}
              aria-invalid={!!error}
              aria-describedby={error ? 'papel-nome-erro' : undefined}
              onChange={(e) => { setPapel(e.target.value); setError(null); }}
              className={`w-full p-2.5 border ${error ? 'border-danger' : 'border-line'} rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30`}
              placeholder="ex.: gerente, recepcionista"
            />
            {error && <p id="papel-nome-erro" role="alert" className="text-danger text-sm mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
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
              className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover disabled:opacity-60 transition-colors"
            >
              {loading ? 'Criando papel...' : 'Criar papel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
