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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Novo Papel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do papel *
            </label>
            <input
              type="text"
              required
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex.: gerente, recepcionista"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Criando...' : 'Criar Papel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
