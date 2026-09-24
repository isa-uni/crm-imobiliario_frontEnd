"use client"

import React, { useEffect, useState, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, AlertTriangle, RefreshCw } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { dashboardCorretorService, PontoMensalDTO } from "@/service/dashboardCorretorService"
import { parseApiError } from "@/lib/errorHandler"
import { useThemeColors, chartTooltipStyle } from "@/hooks/useThemeColors"

type Periodo = 6 | 12

function getPeriodoDates(meses: Periodo) {
  const now = new Date()
  const inicio = startOfMonth(subMonths(now, meses - 1))
  const fim = endOfMonth(now)
  return {
    inicio: format(inicio, "yyyy-MM-dd"),
    fim: format(fim, "yyyy-MM-dd"),
  }
}

export default function LeadsContratosTimelineChart() {
  const cores = useThemeColors()
  const [periodo, setPeriodo] = useState<Periodo>(6)
  const [data, setData] = useState<PontoMensalDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async (p: Periodo = periodo) => {
    setLoading(true)
    setError(null)
    try {
      const { inicio, fim } = getPeriodoDates(p)
      const res = await dashboardCorretorService.getTimeline({ inicio, fim })
      setData(res.timeline || [])
    } catch (e: any) {
      const parsed = parseApiError(e)
      setError(parsed.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(periodo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo])

  const isEmpty = useMemo(() => {
    if (data.length === 0) return true
    return data.every((d) => d.leadsRecebidos === 0 && d.contratosFechados === 0)
  }, [data])

  const totalLeads = useMemo(() => data.reduce((acc, d) => acc + d.leadsRecebidos, 0), [data])
  const totalContratos = useMemo(() => data.reduce((acc, d) => acc + d.contratosFechados, 0), [data])

  return (
    <div className="bg-card border border-line rounded-card shadow-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
            <TrendingUp size={20} className="text-brand-fg" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink">Leads recebidos x Contratos fechados</h2>
            <p className="text-xs text-muted">
              Evolução mensal — {totalLeads} leads • {totalContratos} contratos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-btn border border-line overflow-hidden">
            {([6, 12] as Periodo[]).map((m) => (
              <button
                key={m}
                onClick={() => setPeriodo(m)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  periodo === m ? "bg-brand text-on-brand" : "bg-card text-muted hover:bg-surface"
                }`}
              >
                {m}M
              </button>
            ))}
          </div>
          <button
            onClick={() => load()}
            disabled={loading}
            className="w-8 h-8 rounded-btn border border-line bg-card text-muted flex items-center justify-center hover:bg-surface disabled:opacity-50"
            aria-label="Recarregar"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-muted animate-pulse">Carregando evolução mensal...</p>
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <AlertTriangle size={24} className="text-accent mb-2" />
          <p className="text-sm font-medium text-ink">Erro ao carregar gráfico</p>
          <p className="text-xs text-muted mt-1 max-w-md break-words">{error}</p>
          <button
            onClick={() => load()}
            className="mt-4 px-4 py-2 bg-brand text-on-brand rounded-btn text-sm font-semibold shadow-btn hover:bg-brand-hover"
          >
            Tentar novamente
          </button>
        </div>
      ) : isEmpty ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted">Nenhum dado no período selecionado.</p>
          <p className="text-xs text-muted mt-1">Leads e contratos aparecerão aqui mês a mês.</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={cores.line} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: cores.muted }} tickLine={false} axisLine={{ stroke: cores.line }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: cores.muted }} tickLine={false} axisLine={{ stroke: cores.line }} />
              <Tooltip
                {...chartTooltipStyle(cores)}
                formatter={(value: any, name?: string) => {
                  const n = Number(value ?? 0)
                  const label = name === "leadsRecebidos" ? "Leads recebidos" : "Contratos fechados"
                  return [n, label] as any
                }}
                labelFormatter={(label: any) => `${label}`}
              />
              <Legend
                iconType="plainline"
                wrapperStyle={{ fontSize: 12, paddingTop: 8, color: cores.muted }}
                formatter={(value: string) => (value === "leadsRecebidos" ? "Leads recebidos" : "Contratos fechados")}
              />
              <Line
                type="monotone"
                dataKey="leadsRecebidos"
                stroke={cores["chart-1"]}
                strokeWidth={2.5}
                dot={{ r: 3, fill: cores["chart-1"], strokeWidth: 1, stroke: cores.card }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="contratosFechados"
                stroke={cores.success}
                strokeWidth={2.5}
                dot={{ r: 3, fill: cores.success, strokeWidth: 1, stroke: cores.card }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="text-[11px] text-muted mt-3">
        Leads agrupados por <b>data de criação</b>; contratos por <b>data de fechamento</b> (trâmite para contrato). Meses sem movimentação exibem 0.
      </p>
    </div>
  )
}
