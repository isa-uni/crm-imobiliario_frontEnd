'use client';

import React from 'react';
import { BarChart3, TrendingUp, Target, Clock, Award } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 size={40} className="text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Central de Análises
            </h1>
            <p className="text-lg text-gray-600">
              Em breve: Insights poderosos sobre suas vendas
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl mb-8">
              <p className="text-sm font-semibold text-purple-900 mb-4">
                📊 O que você terá acesso em breve:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp size={20} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Comparação Mensal</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Compare seu desempenho mês a mês e identifique tendências
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Target size={20} className="text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Performance por Origem</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Descubra qual canal traz os leads que mais convertem
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock size={20} className="text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Tempo de Conversão</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Quanto tempo leva de lead até fechamento em cada etapa
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Award size={20} className="text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Melhores Dias</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Identifique os dias da semana com maior taxa de conversão
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                💡 Por enquanto, use o <strong>Dashboard</strong> para visão geral e o <strong>Relógio de Vendas</strong> para acompanhamento diário
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href="/dashboard"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Ir para Dashboard
                </a>
                <a
                  href="/relogio-vendas"
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Ver Relógio de Vendas
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}