"use client";

import { Lead, LeadStatus } from "@/types";

interface FunilProps {
  leads: Lead[];
}

const ETAPAS = [
  { status: "lead", label: "Leads", cor: "bg-chart-3" },
  { status: "oportunidade", label: "Ops", cor: "bg-chart-1" },
  { status: "visita-agendada", label: "Agend.", cor: "bg-accent" },
  { status: "visita-realizada", label: "Visitas", cor: "bg-chart-5" },
  { status: "pasta", label: "Pastas", cor: "bg-chart-4" },
  { status: "aprovado", label: "Aprov.", cor: "bg-chart-6" },
  { status: "contrato", label: "Vendas", cor: "bg-chart-7" },
] as const;

// mesma ordem usada no Relógio de Vendas: um lead com status mais avançado é contado como
// tendo passado por todas as etapas anteriores, mesmo que tenha pulado etapas no meio do caminho
const STATUS_ORDER: LeadStatus[] = ETAPAS.map((e) => e.status);

export default function Funil({ leads }: FunilProps) {
  const contagens: Record<string, number> = {};
  ETAPAS.forEach((etapa, index) => {
    if (index === 0) {
      // topo do funil: todo lead que entrou conta aqui, independente do status atual
      contagens[etapa.status] = leads.length;
      return;
    }
    const statusValidos = STATUS_ORDER.slice(index);
    contagens[etapa.status] = leads.filter((l) => statusValidos.includes(l.status)).length;
  });

  const rows = ETAPAS.map((etapa, index) => {
    const quantidade = contagens[etapa.status];
    const anterior = index > 0 ? contagens[ETAPAS[index - 1].status] : 0;
    const conversao = anterior > 0 ? Math.round((quantidade / anterior) * 100) : null;

    return {
      ...etapa,
      quantidade,
      index,
      conversao,
    };
  });

  return (
    <div className="w-full bg-card border border-line rounded-card shadow-card p-6">
      <h2 className="mb-4 text-xl font-semibold text-ink">
        Funil de processos
      </h2>

      <div className="flex flex-col items-center gap-1">
        {rows.map((row) => (
          <div key={row.status} className="flex items-center gap-3 w-full max-w-lg" title={row.label}>
            <span className="w-16 shrink-0 text-xs font-semibold text-ink text-right">{row.label}</span>
            <div className="relative flex-1">
              <div
                className={`${row.cor} h-6 flex items-center justify-center text-on-chart text-xs font-bold shadow-sm`}
                style={{
                  width: `${100 - row.index * 12}%`,
                  clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
                  margin: "0 auto",
                }}
              >
                {row.quantidade}
              </div>
            </div>
            <span className="w-16 shrink-0 text-[10px] text-muted text-left whitespace-nowrap">
              {row.index === 0 ? "Topo" : `Conv: ${row.conversao !== null ? row.conversao : "--"}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}