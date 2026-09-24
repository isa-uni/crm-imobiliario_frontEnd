"use client"
import { Building2, MapPin, BedDouble, Maximize, Car, DollarSign } from "lucide-react"
import Link from "next/link"
import { EmpreendimentoCard as CardType } from "@/service/empreendimentoIaService"

export default function EmpreendimentoCard({ emp }: { emp: CardType }) {
  const faixaPreco = emp.precoMin ? `A partir de R$ ${Number(emp.precoMin).toLocaleString('pt-BR')}` : "Preço sob consulta"
  const metragem = emp.metragemMin && emp.metragemMax ? `${emp.metragemMin} – ${emp.metragemMax} m²` : emp.metragemMin ? `${emp.metragemMin} m²` : "—"
  const quartos = emp.quartosMin != null ? `${emp.quartosMin}${emp.quartosMax && emp.quartosMax!==emp.quartosMin ? `–${emp.quartosMax}` : ""} quartos` : "—"
  const vagas = emp.vagasMin != null ? `${emp.vagasMin} vaga${emp.vagasMin!==1?'s':''}` : "—"
  return (
    <Link href={`/empreendimentos/${emp.id}`} className="block group">
      <div className="bg-card border border-line rounded-card shadow-card overflow-hidden hover:shadow-card-lg hover:border-focus transition-all">
        <div className="h-44 bg-gradient-to-br from-brand-soft to-subtle flex items-center justify-center border-b border-line relative overflow-hidden">
          {emp.imagemUrl ? (
            <img src={emp.imagemUrl} alt={emp.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <span className="w-14 h-14 rounded-xl bg-card shadow-card flex items-center justify-center">
              <Building2 size={28} className="text-brand-fg" />
            </span>
          )}
          {emp.status && (
            <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-full bg-accent text-on-accent shadow-btn">
              {emp.status}
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-bold text-ink line-clamp-1 group-hover:text-brand-fg">{emp.nome}</h3>
          <div className="flex items-center gap-1 text-sm text-muted mt-1">
            <MapPin size={14} />
            <span className="truncate">{emp.bairro ? `${emp.bairro} • ` : ""}{emp.cidade}{emp.uf ? `/${emp.uf}` : ""}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 my-4 text-xs text-muted">
            <span className="flex items-center gap-1"><BedDouble size={12}/>{quartos}</span>
            <span className="flex items-center gap-1"><Maximize size={12}/>{metragem}</span>
            <span className="flex items-center gap-1"><Car size={12}/>{vagas}</span>
          </div>
          <div className="border-t border-dashed pt-3 flex items-center gap-2 text-success font-bold">
            <DollarSign size={18}/> {faixaPreco}
          </div>
          <div className="mt-4">
            <span className="inline-flex px-3 py-1.5 bg-brand-soft text-brand-fg rounded-btn text-xs font-semibold group-hover:bg-brand group-hover:text-on-brand transition-colors">Ver empreendimento</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
