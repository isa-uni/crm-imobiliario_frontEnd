'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartDataPoint {
  month: string;
  leads: number;
  fechamentos: number;
  valorFechado: number;
}

interface LeadsEvolutionChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="text-sm mb-1" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            {entry.dataKey === 'valorFechado' 
              ? `R$ ${entry.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : entry.value
            }
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function LeadsEvolutionChart({ data }: LeadsEvolutionChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Evolução de Leads e Fechamentos</h3>
        <p className="text-sm text-gray-600 mt-1">Acompanhe o crescimento mensal do seu funil de vendas</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFechamentos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: 20 }} 
              iconType="circle"
            />
            <Area 
              type="monotone" 
              dataKey="leads" 
              name="Leads Captados" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorLeads)" 
            />
            <Area 
              type="monotone" 
              dataKey="fechamentos" 
              name="Contratos Fechados" 
              stroke="#10b981" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorFechamentos)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-700">Leads Captados</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {data.reduce((sum, item) => sum + item.leads, 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Total no período</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-700">Contratos Fechados</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {data.reduce((sum, item) => sum + item.fechamentos, 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Total no período</p>
        </div>
      </div>
    </div>
  );
}
