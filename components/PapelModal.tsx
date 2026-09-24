'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PapelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (papel: string) => Promise<boolean>;
}

export default function PapelModal({ isOpen, onClose, onSave }: PapelModalProps) {
  const [papel, setPapel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!papel.trim()) {
      setError('Informe o nome do papel.');
      return;
    }

    setLoading(true);
    const sucesso = await onSave(papel.trim().toLowerCase());
    setLoading(false);

    if (sucesso) {
      setPapel('');
      onClose();
    } else {
      setError('Não foi possível criar o papel.');
    }
  };

  return (
    <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card max-w-md w-full rounded-card shadow-card-lg">
        <div className="flex justify-between items-center p-6 border-b border-line">
          <h2 className="text-xl font-bold text-ink">Novo Papel</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Nome do papel <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              className="w-full p-2.5 border border-line rounded-btn focus:outline-none focus:border-focus focus:ring-4 focus:ring-focus/30"
              placeholder="ex.: gerente, recepcionista"
            />
            {error && <p className="text-danger text-sm mt-1">{error}</p>}
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
              {loading ? 'Criando...' : 'Criar Papel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
