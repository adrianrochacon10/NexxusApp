import type { EstatusOperativoVenta, EstatusPagoVenta } from "@/types/ventas.types"

/* ============================================================
   Modelo de vista de una venta (serializable: viaja de server
   a client components) + utilidades de formato compartidas.
   ============================================================ */

export type FormaPagoAbono = "efectivo" | "transferencia" | "tarjeta"
export type EstadoVisual = EstatusPagoVenta | "cancelada"

export interface VentaLineaVM {
  id: string
  nombre: string
  variante: string | null
  cantidad: number
  precio: number
  subtotal: number
}

export interface VentaPagoVM {
  id: string
  monto: number
  formaPago: string
  notas: string | null
  createdAt: string
}

export interface VentaVM {
  id: string
  folio: string
  fecha: string
  hora: string
  total: number
  montoPagado: number
  saldo: number
  formaPagoInicial: string | null
  estadoPago: EstatusPagoVenta
  estatus: EstatusOperativoVenta
  cliente: string | null
  telefono: string | null
  notas: string | null
  motivoCancelacion: string | null
  lineas: VentaLineaVM[]
  pagos: VentaPagoVM[]
}

/** Forma cruda que devuelve Supabase; todos los campos anidados son opcionales. */
export interface VentaRow {
  id: string
  folio: string
  fecha: string
  hora: string | null
  total: number
  monto_pagado: number
  saldo_pendiente: number
  forma_pago_inicial?: string | null
  estado_pago: string
  estatus: string
  cliente_nombre?: string | null
  cliente_telefono?: string | null
  notas?: string | null
  motivo_cancelacion?: string | null
  venta_lineas?: {
    id?: string
    producto_nombre: string
    variante_nombre: string | null
    cantidad: number
    precio_unitario?: number
    subtotal?: number
  }[] | null
  venta_pagos?: {
    id: string
    monto?: number
    forma_pago?: string
    notas?: string | null
    created_at?: string
  }[] | null
}

export function toVentaVM(row: VentaRow): VentaVM {
  const pagos = [...(row.venta_pagos ?? [])].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""))
  return {
    id: row.id,
    folio: row.folio,
    fecha: row.fecha,
    hora: row.hora ?? "",
    total: Number(row.total) || 0,
    montoPagado: Number(row.monto_pagado) || 0,
    saldo: Number(row.saldo_pendiente) || 0,
    formaPagoInicial: row.forma_pago_inicial ?? null,
    estadoPago: (["pagada", "parcial", "pendiente"].includes(row.estado_pago) ? row.estado_pago : "pendiente") as EstatusPagoVenta,
    estatus: row.estatus === "cancelada" ? "cancelada" : "activa",
    cliente: row.cliente_nombre?.trim() || null,
    telefono: row.cliente_telefono?.trim() || null,
    notas: row.notas ?? null,
    motivoCancelacion: row.motivo_cancelacion ?? null,
    lineas: (row.venta_lineas ?? []).map((l, i) => {
      const precio = Number(l.precio_unitario) || 0
      return {
        id: l.id ?? `${row.id}-${i}`,
        nombre: l.producto_nombre,
        variante: l.variante_nombre,
        cantidad: l.cantidad,
        precio,
        subtotal: l.subtotal != null ? Number(l.subtotal) : precio * l.cantidad,
      }
    }),
    pagos: pagos.map((p) => ({
      id: p.id,
      monto: Number(p.monto) || 0,
      formaPago: p.forma_pago ?? "",
      notas: p.notas ?? null,
      createdAt: p.created_at ?? "",
    })),
  }
}

/* ---------- estado ---------- */

export function estadoVisual(v: Pick<VentaVM, "estatus" | "estadoPago">): EstadoVisual {
  return v.estatus === "cancelada" ? "cancelada" : v.estadoPago
}

export const ESTADO_BADGE: Record<EstadoVisual, { cls: string; label: string }> = {
  pagada:    { cls: "is-ok",   label: "Pagada" },
  parcial:   { cls: "is-warn", label: "Parcial" },
  pendiente: { cls: "is-warn", label: "Pendiente" },
  cancelada: { cls: "is-bad",  label: "Cancelada" },
}

export function admiteAbono(v: Pick<VentaVM, "estatus" | "saldo">) {
  return v.estatus === "activa" && v.saldo > 0.004
}

export function porcentajeCobrado(v: Pick<VentaVM, "total" | "montoPagado">) {
  if (v.total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((v.montoPagado / v.total) * 100)))
}

/* ---------- textos ---------- */

const FORMA_PAGO_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  adeudo: "A crédito",
}

export function formaPagoLabel(forma: string | null | undefined) {
  if (!forma) return "A crédito"
  return FORMA_PAGO_LABEL[forma] ?? forma.charAt(0).toUpperCase() + forma.slice(1)
}

export function lineaTexto(l: Pick<VentaLineaVM, "nombre" | "variante" | "cantidad">) {
  return `${l.nombre}${l.variante ? ` (${l.variante})` : ""} × ${l.cantidad}`
}

export function productosTexto(lineas: VentaLineaVM[]) {
  return lineas.map(lineaTexto).join(", ")
}

export function clienteTexto(v: Pick<VentaVM, "cliente">) {
  return v.cliente ?? "Mostrador"
}

export function iniciales(nombre: string | null) {
  if (!nombre) return "—"
  const ini = nombre
    .split(/\s+/)
    .map((p) => p.at(0))
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return ini || "—"
}

/* ---------- fechas ---------- */

/** Fecha de hoy en formato YYYY-MM-DD (misma convención que el resto de la app). */
export function hoyISO() {
  return new Date().toISOString().split("T")[0]
}

function parseFecha(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function diasEntre(desde: string, hasta: string) {
  const ms = parseFecha(hasta).getTime() - parseFecha(desde).getTime()
  return Math.max(0, Math.round(ms / 86400000))
}

/** "16 oct" */
export function fechaCorta(fecha: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(parseFecha(fecha)).replace(".", "")
}

/** "Hoy", "Ayer" o "16 oct" */
export function fechaRelativa(fecha: string, hoy: string) {
  const dias = diasEntre(fecha, hoy)
  if (fecha === hoy) return "Hoy"
  if (dias === 1 && fecha < hoy) return "Ayer"
  return fechaCorta(fecha)
}

/** Etiqueta de grupo del historial: "Hoy", "Ayer", "Jueves 16 de octubre" */
export function fechaGrupo(fecha: string, hoy: string) {
  const rel = fechaRelativa(fecha, hoy)
  if (rel === "Hoy" || rel === "Ayer") return rel
  const txt = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(parseFecha(fecha))
  return txt.charAt(0).toUpperCase() + txt.slice(1)
}

export function edadTexto(dias: number) {
  if (dias <= 0) return "hoy"
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`
}

export function horaCorta(hora: string) {
  return hora ? hora.slice(0, 5) : ""
}

export function fechaHoraPago(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  // Zona fija para que servidor y navegador muestren lo mismo
  const timeZone = "America/Mexico_City"
  const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone }).format(d).replace(".", "")
  const hora = new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(d)
  return `${fecha} · ${hora}`
}
