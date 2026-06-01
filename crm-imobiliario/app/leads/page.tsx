'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/types';
// import { getLeads, saveLead, updateLead, deleteLead } from '@/lib/data';
import { leadService } from '@/service/leadService';
import LeadsTable from '@/components/LeadsTable';
import LeadModal from '@/components/LeadModal';
import LeadViewModal from '@/components/LeadViewModal';
import { Plus, Users, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await leadService.getAll();
    setLeads(data);
  };

  const limparTelefone = (telefone: string) => {
    return telefone.replace(/\D/g, '');
  };

  const handleSaveLead = async (leadData: Omit<Lead, 'id' | 'dataCriacao' | 'dataAtualizacao'>) => {
    try {
      setErrors({});
      const { observacao, motivoDescarte, ...rest } = leadData;

      const payload = {
        ...rest,
        observacao,
        motivoDescarte,
        telefone: limparTelefone(leadData.telefone),
      };

      if (editingLead) {
        await leadService.atualizar(editingLead.id, payload);
      } else {
        await leadService.cadastrar(payload);
      }

      await loadData(); // recarrega lista
      setEditingLead(null);
      setErrors({}); // limpa erros
      setIsModalOpen(false); 
      return true;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const backendErrors: any = {};

        error.response.data.errors.forEach((err: any) => {
          backendErrors[err.field] = err.message;
        });

        setErrors(backendErrors);
      } else {
        alert("Erro ao salvar lead");
      }
      return false;
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsViewModalOpen(false);
    setIsModalOpen(true);
  };

  const handleViewLead = (lead: Lead) => {
    setViewingLead(lead);
    setIsViewModalOpen(true);
  };

  const handleDeleteLead = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      await leadService.inativar(id);
      await loadData();
    }
  };

  const handleStatusChange = async (id: number, newStatus: Lead['status']) => {
    await leadService.atualizar(id, { status: newStatus });
    await loadData();
  };

  const handleExport = () => {
    const csvData = [
      ['Nome', 'Telefone', 'Email', 'Status', 'Valor', 'Origem', 'Data Criação'],
      ...leads.map((lead) => [
        lead.nome,
        lead.telefone,
        lead.email,
        lead.status,
        lead.valorInteresse.toString(),
        // lead.tipoImovel,
        lead.origem,
        format(lead.dataCriacao, 'dd/MM/yyyy'),
      ]),
    ];

    const csvContent = csvData.map((row) => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `todos_leads_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users size={32} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Leads</h1>
                <p className="text-gray-600">Gerencie todos os seus leads de forma eficiente</p>
              </div>
            </div>
            <div className="flex gap-3">
              {/*<button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
              >
                <Download size={20} />
                Exportar
              </button>*/}
              <button
                onClick={() => {
                  setEditingLead(null);
                  setErrors({});
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Plus size={20} />
                Novo Lead
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total de Leads</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Ativos</p>
              <p className="text-2xl font-bold text-blue-600">
                {leads.filter(l => l.status !== 'contrato' && l.status !== 'descarte').length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Contrato</p>
              <p className="text-2xl font-bold text-green-600">
                {leads.filter(l => l.status === 'contrato').length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Este Mês</p>
              <p className="text-2xl font-bold text-purple-600">
                {leads.filter(l => {
                  const leadDate = new Date(l.dataCriacao);
                  const now = new Date();
                  return leadDate.getMonth() === now.getMonth() && 
                         leadDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <LeadsTable
          leads={leads}
          onEdit={handleEditLead}
          // onDelete={handleDeleteLead}
          onView={handleViewLead}
          onStatusChange={handleStatusChange}
        />

        {/* Modais */}
        <LeadModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
            setErrors({});
          }}
          onSave={handleSaveLead}
          editingLead={editingLead}
          errors={errors}
        />

        <LeadViewModal
          lead={viewingLead}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingLead(null);
          }}
          onEdit={() => {
            if (viewingLead) {
              handleEditLead(viewingLead);
            }
          }}
        />
      </div>
    </div>
  );
}
