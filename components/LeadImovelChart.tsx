"use client";

import { Lead } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Building2 } from "lucide-react";

interface LeadImovelChartProps {
  leads: Lead[]; //recebendo os leads
}

const TOP_N = 8; //mostrar apenas os 8 primeiros

export default function LeadImovelChart({ leads }: LeadImovelChartProps) {
  const contagens: Record<string, number> = {};
  leads.forEach((l) => {
    const chave = l.empreendimentoNome?.trim() || "Sem empreendimento";
    contagens[chave] = (contagens[chave] || 0) + 1;
  }); //conta quantos clientes estão interessados em cada empreendimento

  const data = Object.entries(contagens)
    .map(([nome, valor]) => ({ name: nome, value: valor }))
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_N);

    //Transformando em:
    // [
    //   { name: "Vanguard", value: 2 },
    //   { name: "London", value: 1 }
    // ] ordena de maior para menor e pega somente os 8 primeiros

  const total = leads.length; //total leads

  return (
    <div className="w-full bg-white border border-line rounded-card shadow-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <Building2 size={20} className="text-primary" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink">Empreendimentos de Maior Interesse</h2>
          <p className="text-sm text-muted">Top {Math.min(TOP_N, data.length)} por interesse dos leads</p>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted py-10 text-center">Nenhum lead vinculado a empreendimento.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart //gráfico de barras verticalmente
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
              //eixo x, quantidade de leads
              //eixo y, nome do imovel
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" allowDecimals={false} stroke="#8698aa" fontSize={12} /> 
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                stroke="#8698aa"
                fontSize={12}
                tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
              />
              <Tooltip
              //quando passa o mouse em cima, calcula a quantidade e porcentagem
                formatter={(value, _name) => {
                  const n = Number(value ?? 0);
                  return [
                    `${n} lead(s) ${total ? `(${((n / total) * 100).toFixed(0)}%)` : ""}`,
                    "Interesse",
                  ];
                }}
                cursor={{ fill: "rgba(15,39,64,0.05)" }}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e1e8f0",
                  boxShadow: "0 4px 12px rgba(15,39,64,0.08)",
                  fontSize: 13,
                }}
              />
              <Bar //value determina o tamanho da barra
                dataKey="value" fill="#f2a900" radius={[0, 6, 6, 0]} barSize={18} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
