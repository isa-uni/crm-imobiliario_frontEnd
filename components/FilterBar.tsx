'use client';

import React, { useState } from 'react';
import { Filter, Download, Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilterBarProps {
  filters: {
    period: string;
    startDate: string | null;
    endDate: string | null;
    status?: string;
    origem?: string;
  };
  setFilters: (filters: any) => void;
  onExport: () => void;
}

export default function FilterBar({ filters, setFilters, onExport }: FilterBarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: filters.startDate,
    to: filters.endDate,
  });

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const periodOptions = [
    { value: 'all', label: 'Todo período' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: 'year', label: 'Este ano' },
    { value: 'custom', label: 'Período personalizado' },
  ];

  const handlePeriodChange = (value: string) => {
    const now = new Date();
    let startDate: string | null = null;
    let endDate: string | null = format(now, 'yyyy-MM-dd');


    if (value === '7d') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      startDate = format(date, 'yyyy-MM-dd');
    } else if (value === '30d') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      startDate = format(date, 'yyyy-MM-dd');
    } else if (value === '90d') {
      const date = new Date();
      date.setDate(date.getDate() - 90);
      startDate = format(date, 'yyyy-MM-dd');
    } else if (value === 'year') {
      startDate = `${new Date().getFullYear()}-01-01`;
    } else if (value === 'custom') {
      setShowDatePicker(true);
      return;
    } else {
      startDate = null;
      endDate = null;
    }

    setFilters({ ...filters, period: value, startDate, endDate });
    setDateRange({
      from: startDate,
      to: endDate,
    });
  };

  const handleDateInputChange = (type: 'from' | 'to', value: string) => {
    const newDateRange = { ...dateRange };

    if (type === 'from') {
      newDateRange.from = value || null;
    } else {
      newDateRange.to = value || null;
    }

    setDateRange(newDateRange);
    setFilters({
      ...filters,
      startDate: newDateRange.from,
      endDate: newDateRange.to,
      period: 'custom',
    });
  };


  const clearFilters = () => {
    setFilters({
      period: 'all',
      startDate: null,
      endDate: null,
      status: undefined,
      origem: undefined,
    });
    setDateRange({ from: null, to: null });
    setShowDatePicker(false);
  };

  const hasActiveFilters = filters.period !== 'all' || filters.startDate || filters.endDate;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros</span>
        </div>

        {/* Período */}
        <select
          value={filters.period}
          onChange={(e) => handlePeriodChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Data personalizada */}
        {(showDatePicker || filters.period === 'custom') && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.from || ''}
              onChange={(e) => handleDateInputChange('from', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Data inicial"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={dateRange.to || ''}
              onChange={(e) => handleDateInputChange('to', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Data final"
            />
            <button
              onClick={() => {
                setShowDatePicker(false);
                handlePeriodChange('all');
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Indicador de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {dateRange.from && dateRange.to
                ? `${format(parseLocalDate(dateRange.from), "dd/MM/yy", { locale: ptBR })} - ${format(parseLocalDate(dateRange.to), "dd/MM/yy", { locale: ptBR })}`
                : dateRange.from
                ? `A partir de ${format(parseLocalDate(dateRange.from), "dd/MM/yyyy", { locale: ptBR })}`
                : ''}
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* Botão de exportar */}
        <div className="ml-auto">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Exportar</span>
          </button>
        </div>
      </div>

      {/* Informação do período selecionado */}
      {hasActiveFilters && (
        <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Filtro ativo:</strong>{' '}
            {filters.period === 'custom' && dateRange.from && dateRange.to
              ? `Mostrando dados de ${format(parseLocalDate(dateRange.from), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} até ${format(parseLocalDate(dateRange.from), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
              : filters.period === '7d'
              ? 'Mostrando dados dos últimos 7 dias'
              : filters.period === '30d'
              ? 'Mostrando dados dos últimos 30 dias'
              : filters.period === '90d'
              ? 'Mostrando dados dos últimos 90 dias'
              : filters.period === 'year'
              ? 'Mostrando dados deste ano'
              : ''}
          </p>
        </div>
      )}
    </div>
  );
}
