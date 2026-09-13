export function brl(valor?: number | null): string {
  if (valor === null || valor === undefined) return "—"
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

export function m2(valor?: number | null): string {
  if (valor === null || valor === undefined) return "—"
  return `${valor.toLocaleString("pt-BR")} m²`
}

/** Uma faixa "min – max" quando os dois existem e diferem, um valor só quando são iguais ou só um existe, "—" quando nenhum existe. */
export function faixa(min?: number | null, max?: number | null, formatar: (v: number) => string = (v) => String(v)): string {
  const temMin = min !== null && min !== undefined
  const temMax = max !== null && max !== undefined
  if (!temMin && !temMax) return "—"
  if (temMin && temMax) return min === max ? formatar(min as number) : `${formatar(min as number)} – ${formatar(max as number)}`
  return formatar((temMin ? min : max) as number)
}

export function dataCurta(iso?: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("pt-BR")
  } catch {
    return "—"
  }
}

export function naoInformado(valor?: string | number | null): string {
  if (valor === null || valor === undefined) return "Não informado"
  if (typeof valor === "string" && valor.trim() === "") return "Não informado"
  return String(valor)
}
