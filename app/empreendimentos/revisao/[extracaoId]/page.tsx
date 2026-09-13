"use client"
import React from "react"
import EmpreendimentoRevisao from "@/components/empreendimento/EmpreendimentoRevisao"

export default function RevisaoPage({ params }: { params: { extracaoId: string } }) {
  const id = Number(params.extracaoId)
  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-2">Revisão da extração</h1>
        <p className="text-sm text-muted mb-6">Extração #{id} • Confira os dados extraídos automaticamente antes de salvar.</p>
        <EmpreendimentoRevisao extracaoId={id} />
      </div>
    </div>
  )
}
