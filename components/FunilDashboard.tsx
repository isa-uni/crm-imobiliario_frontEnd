"use client";

import { Lead } from "@/types";

interface FunilProps {
  leads: Lead[];
}

const ETAPAS = [
  { status: "lead", label: "Leads", cor: "bg-primary-500" },
  { status: "oportunidade", label: "Ops", cor: "bg-primary-400" },
  { status: "visita-agendada", label: "Agend.", cor: "bg-accent-500" },
  { status: "visita-realizada", label: "Visitas", cor: "bg-[#4a9c76]" },
  { status: "pasta", label: "Pastas", cor: "bg-[#e8914a]" },
  { status: "aprovado", label: "Aprov.", cor: "bg-[#3fb3b3]" },
  { status: "contrato", label: "Vendas", cor: "bg-[#7a5ca8]" },
] as const;

export default function Funil({ leads }: FunilProps) {
  const contagens: Record<string, number> = {};
  ETAPAS.forEach((etapa) => {
    contagens[etapa.status] = leads.filter((l) => l.status === etapa.status).length;
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
    <div className="w-full bg-white border border-line rounded-card shadow-card p-6">
      <h2 className="mb-4 text-xl font-semibold text-ink">
        Funil de processos
      </h2>

      <div className="flex flex-col items-center">
        {rows.map((row) => (
          <div key={row.status} className="flex items-center gap-2 mb-1 w-full max-w-lg">
            <div className="relative flex-1">
              <div
                className={`${row.cor} h-6 flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                style={{
                  width: `${100 - row.index * 12}%`,
                  clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
                  margin: "0 auto",
                }}
              >
                {row.quantidade}
              </div>
            </div>
            {/* <span className="w-16 text-[10px] text-gray-500 bg-gray-200 px-1 py-0.5 text-center whitespace-nowrap">
              {row.index === 0 ? "Topo" : `Conv: ${row.conversao !== null ? row.conversao : "--"}%`}
            </span> */}
          </div>
        ))}
      </div>
    </div>
  );
}