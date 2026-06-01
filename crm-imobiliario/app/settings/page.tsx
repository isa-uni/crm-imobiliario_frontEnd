'use client';

import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Settings size={32} className="text-gray-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
              <p className="text-gray-600">Personalize seu CRM</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-gray-600">
              Esta página está em desenvolvimento. Em breve você poderá configurar:
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                Perfil e dados pessoais
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                Notificações e alertas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                Integrações (WhatsApp, Email)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                Gerenciar usuários da equipe
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
