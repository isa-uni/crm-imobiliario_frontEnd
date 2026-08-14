"use client";

import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
} from "recharts";



const dados = [
  {
    nome: "Novos",
    valor: 1250,
  },
  {
    nome: "Em análise",
    valor: 980,
  },
  {
    nome: "Aprovados",
    valor: 620,
  },
  {
    nome: "Negociação",
    valor: 410,
  },
  {
    nome: "Finalizados",
    valor: 180,
  },
];

export default function Funil() {
  return (
    <div className="w-full rounded-xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Funil de processos
      </h2>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip />

            <Funnel
              dataKey="valor"
              data={dados}
              isAnimationActive
            >
              <LabelList
                position="right"
                fill="#333"
                stroke="none"
                dataKey="nome"
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}