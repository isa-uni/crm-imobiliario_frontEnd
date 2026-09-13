"use client"
import { useEffect, useState } from "react"
import { FileSearch } from "lucide-react"
import { empreendimentoIaService, FonteDTO } from "@/service/empreendimentoIaService"
import { BadgeConfianca } from "@/components/ui/Badge"

const ROTULOS_CAMPO: Record<string, string> = {
  "identificacao.nome": "Nome",
  "localizacao.endereco": "Endereço",
  "localizacao.numero": "Número",
  "localizacao.cidade": "Cidade",
  "localizacao.estado": "UF",
  "caracteristicas.quartos_min": "Quartos (mín.)",
  "caracteristicas.quartos_max": "Quartos (máx.)",
}

function rotulo(campo: string): string {
  if (ROTULOS_CAMPO[campo]) return ROTULOS_CAMPO[campo]
  if (campo.startsWith("diferenciais")) return "Diferencial"
  return campo
}

export default function FontesOrigem({ empreendimentoId }: { empreendimentoId: number }) {
  const [fontes, setFontes] = useState<FonteDTO[] | null>(null)

  useEffect(() => {
    let ativo = true
    empreendimentoIaService.listarFontes(empreendimentoId)
      .then(f => { if (ativo) setFontes(f) })
      .catch(() => { if (ativo) setFontes([]) })
    return () => { ativo = false }
  }, [empreendimentoId])

  if (!fontes || fontes.length === 0) return null

  return (
    <div className="bg-white border border-line rounded-card p-6">
      <h3 className="font-semibold text-ink flex items-center gap-2"><FileSearch size={18} className="text-primary" /> Origem dos dados</h3>
      <p className="text-xs text-muted mt-1 mb-4">Cada campo abaixo mostra de qual documento, página e trecho o valor foi extraído — para conferência antes de usar com o cliente.</p>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {fontes.map(f => (
          <div key={f.id} className="border border-line rounded-btn p-3 bg-surface/30">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-muted">{rotulo(f.campo)}</span>
              <BadgeConfianca confianca={f.confianca} />
            </div>
            <p className="text-sm font-medium text-ink mt-1">{f.valorExtraido || "—"}</p>
            <p className="text-xs text-muted mt-1">📄 {f.documentoNome || "—"}{f.pagina ? ` • p.${f.pagina}` : ""}</p>
            {f.trecho && <p className="text-xs text-muted mt-1 italic line-clamp-2">“{f.trecho}”</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
