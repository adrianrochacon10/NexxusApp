import { formatCurrency } from "@/lib/utils"

/** Zona horaria del negocio: las fechas de transacciones son días calendario locales. */
const TZ = "America/Mexico_City"

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

/** Hoy como "YYYY-MM-DD" en horario de México. */
export function hoyMX(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

function desplazarMes(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

export interface Periodo {
  /** "YYYY-MM" */
  mes: string
  /** Primer día del mes, inclusivo */
  desde: string
  /** Primer día del mes siguiente, exclusivo */
  hasta: string
  esActual: boolean
  /** "octubre" */
  nombre: string
  /** "Octubre 2026" */
  etiqueta: string
  anterior: string
  siguiente: string
  /** Último día con datos posibles (hoy si es el mes actual) */
  ultimoDia: number
  hoy: string
}

/** Interpreta ?mes=YYYY-MM; si falta, es inválido o futuro, usa el mes actual. */
export function resolverPeriodo(param?: string | string[]): Periodo {
  const hoy    = hoyMX()
  const actual = hoy.slice(0, 7)
  const valor  = typeof param === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(param) && param <= actual ? param : actual
  const [y, m] = valor.split("-").map(Number)
  const nombre = MESES[m - 1]
  const diasMes = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const esActual = valor === actual
  return {
    mes:       valor,
    desde:     `${valor}-01`,
    hasta:     `${desplazarMes(valor, 1)}-01`,
    esActual,
    nombre,
    etiqueta:  `${nombre[0].toUpperCase()}${nombre.slice(1)} ${y}`,
    anterior:  desplazarMes(valor, -1),
    siguiente: desplazarMes(valor, 1),
    ultimoDia: esActual ? Number(hoy.slice(8, 10)) : diasMes,
    hoy,
  }
}

export function nombreMes(mes: string): string {
  const [y, m] = mes.split("-").map(Number)
  const n = MESES[m - 1]
  return `${n[0].toUpperCase()}${n.slice(1)} ${y}`
}

export function mesCorto(mes: string): string {
  return MESES_CORTOS[Number(mes.slice(5, 7)) - 1]
}

/** "Hoy", "Ayer" o "lun 16 oct" */
export function etiquetaDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return "Hoy"
  const ayer = new Date(`${hoy}T12:00:00Z`)
  ayer.setUTCDate(ayer.getUTCDate() - 1)
  if (fecha === ayer.toISOString().slice(0, 10)) return "Ayer"
  return new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-MX", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" })
}

/** Hora local "12:42" de un timestamp */
export function horaMX(ts: string | null | undefined): string {
  if (!ts) return ""
  return new Intl.DateTimeFormat("es-MX", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(ts))
}

export const FORMA_PAGO_LABEL: Record<string, string> = {
  efectivo:      "Efectivo",
  transferencia: "Transferencia",
  tarjeta:       "Tarjeta",
  adeudo:        "Adeudo",
}

export function formaPagoLabel(fp: string | null | undefined): string {
  return fp ? FORMA_PAGO_LABEL[fp] ?? fp : "Sin forma de pago"
}

/** +$1,000.00 · −$1,000.00 · $0.00 */
export function montoConSigno(valor: number): string {
  if (valor > 0) return `+${formatCurrency(valor)}`
  if (valor < 0) return `−${formatCurrency(Math.abs(valor))}`
  return formatCurrency(0)
}

export function pct(valor: number, total: number): string {
  if (total <= 0) return "0 %"
  return `${((valor / total) * 100).toFixed(1)} %`
}

/* ---------- colores de categoría ---------- */

export const CAT_COLORS = ["var(--nx-cat-1)", "var(--nx-cat-2)", "var(--nx-cat-3)", "var(--nx-cat-4)", "var(--nx-cat-5)", "var(--nx-cat-6)"]
export const COLOR_INGRESO = "var(--nx-accent)"
export const COLOR_TRANSFERENCIA = "var(--nx-ink-3)"
export const COLOR_EGRESO_SERIE = "var(--nx-cat-6)"

export const SIN_CATEGORIA = "Sin categoría"
const OTROS = "Otros"

export interface CategoriaRanking {
  nombre: string
  monto: number
  count: number
  color: string
}

/**
 * Agrupa egresos por categoría: las 5 más grandes con color propio
 * (--nx-cat-1..5) y el resto en "Otros" (--nx-cat-6).
 */
export function rankingEgresos(gastos: { categoria: string; monto: number }[]) {
  const acc = new Map<string, { monto: number; count: number }>()
  for (const g of gastos) {
    const prev = acc.get(g.categoria) ?? { monto: 0, count: 0 }
    acc.set(g.categoria, { monto: prev.monto + g.monto, count: prev.count + 1 })
  }
  const ordenadas = [...acc.entries()].map(([nombre, v]) => ({ nombre, ...v })).sort((a, b) => b.monto - a.monto)

  const colorDe = new Map<string, string>()
  const ranking: CategoriaRanking[] = []
  const caben = ordenadas.length <= 6 ? 6 : 5
  ordenadas.slice(0, caben).forEach((c, i) => {
    colorDe.set(c.nombre, CAT_COLORS[i])
    ranking.push({ ...c, color: CAT_COLORS[i] })
  })
  const resto = ordenadas.slice(caben)
  if (resto.length) {
    for (const r of resto) colorDe.set(r.nombre, CAT_COLORS[5])
    ranking.push({
      nombre: OTROS,
      monto:  resto.reduce((s, r) => s + r.monto, 0),
      count:  resto.reduce((s, r) => s + r.count, 0),
      color:  CAT_COLORS[5],
    })
  }
  const total = ranking.reduce((s, c) => s + c.monto, 0)
  return { ranking, colorDe, total }
}

/** Primer elemento de una relación de Supabase que puede venir como objeto o arreglo */
export function una<T>(rel: T | T[] | null | undefined): T | null {
  if (Array.isArray(rel)) return rel[0] ?? null
  return rel ?? null
}
