'use client';

import React from 'react';
import { FileText, Download, Calendar, DollarSign, Mail } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Central de Relatórios
            </h1>
            <p className="text-lg text-gray-600">
              Em breve: Exportação e envio automático de relatórios
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl mb-8">
              <p className="text-sm font-semibold text-green-900 mb-4">
                📄 Tipos de relatório que você poderá gerar:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar size={20} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Relatório Mensal</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Documento completo com métricas, gráficos e lista de fechamentos
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">PDF</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Excel</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Download size={20} className="text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Exportar Leads</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Export customizado de leads com filtros por status e período
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">CSV</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Excel</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <DollarSign size={20} className="text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Relatório de Comissões</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Cálculo automático de comissões por vendas fechadas
                  </p>
                  <div className="mt-3">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">PDF</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail size={20} className="text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Envio Automático</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Programe envios mensais por email ou WhatsApp
                  </p>
                  <div className="mt-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Automação</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                💡 Por enquanto, você pode exportar leads em CSV na tela de <strong>Leads</strong> e gerar relatórios via <strong>Relógio de Vendas</strong>
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href="/leads"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Exportar Leads
                </a>
                <a
                  href="/relogio-vendas"
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Gerar Relatório WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
