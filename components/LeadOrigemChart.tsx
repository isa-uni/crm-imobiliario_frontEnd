"use client";

import { Lead } from "@/types";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tag } from "lucide-react";
import { origemOptions } from "@/service/origemOptions";
import { useThemeColors, chartSeries, chartTooltipStyle } from "@/hooks/useThemeColors";

interface LeadOrigemChartProps {
  leads: Lead[]; //recebendo os leads
}

const origemLabel = (origem: string) => {
  const opt = origemOptions.find((o) => o.value === origem);
  return opt ? opt.label : origem; //convertendo o valor da origem para um nome amigável
};

export default function LeadOrigemChart({ leads }: LeadOrigemChartProps) { //espera receber uma lista de obj lead
  const cores = useThemeColors();
  const CORES = chartSeries(cores);
  const contagens: Record<string, number> = {};
  leads.forEach((l) => {
    const chave = l.origem || "sem_origem";
    contagens[chave] = (contagens[chave] || 0) + 1;
  }); //percorre todos os leads e conta quantos leads existem por origem

  const data = Object.entries(contagens)
    .map(([origem, valor]) => ({
      name: origemLabel(origem),
      value: valor,
    }))
    .sort((a, b) => b.value - a.value);
    //tranforma em:
    // [
    //   { name: "Instagram", value: 3 },
    //   { name: "Site", value: 1 },
    //   { name: "Facebook", value: 1 }
    // ] e ordena de maior para menor

  const total = data.reduce((acc, d) => acc + d.value, 0); //Calcula o total

  return (
    <div className="w-full bg-card border border-line rounded-card shadow-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
          <Tag size={20} className="text-brand-fg" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink">Origem dos Leads</h2>
          <p className="text-sm text-muted">{total} lead(s) no total</p>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted py-10 text-center">Nenhum lead cadastrado ainda.</p>
      ) : (
        <div className="h-72"> 
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie //gráfico de pizza
                data={data} //passa os dados 
                dataKey="value" //tamanho
                nameKey="name" //Nome da categoria
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}//fazendo o gráfico ter um buraco no meio
                paddingAngle={2}
                strokeWidth={2}
                stroke={cores.card}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={CORES[index % CORES.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name) => {
                  const n = Number(value ?? 0);
                  return [
                    `${n} (${total ? ((n / total) * 100).toFixed(0) : 0}%)`, //calcula a porcentagem
                    "Leads",
                  ];
                }}
                {...chartTooltipStyle(cores)}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8, color: cores.muted }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
