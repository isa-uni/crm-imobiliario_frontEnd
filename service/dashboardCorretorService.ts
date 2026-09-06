import { api } from "./api"

export interface PontoMensalDTO {
  mes: string // yyyy-MM
  label: string // MMM yyyy
  leadsRecebidos: number
  contratosFechados: number
}

export interface DashboardCorretorTimelineDTO {
  timeline: PontoMensalDTO[]
}

export const dashboardCorretorService = {
  async getTimeline(params?: { inicio?: string; fim?: string }): Promise<DashboardCorretorTimelineDTO> {
    const q: Record<string, string> = {}
    if (params?.inicio) q.inicio = params.inicio
    if (params?.fim) q.fim = params.fim
    const res = await api.get("/dashboard/corretor/timeline", { params: Object.keys(q).length ? q : undefined })
    return res.data
  }
}
