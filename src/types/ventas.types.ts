import type { FormaPago } from "@/types/finanzas.types"

export type EstatusPagoVenta     = "pagada" | "parcial" | "pendiente"
export type EstatusOperativoVenta = "activa" | "cancelada"

export interface ClienteVenta {
  nombre: string
  telefono?: string
}

export interface Abono {
  id: string
  ventaId: string
  monto: number
  formaPago: "efectivo" | "tarjeta" | "transferencia"
  fecha: string
  hora: string
  notas?: string
}

export interface LineaVenta {
  productoId: string
  varianteId?: string
  productoNombre: string
  varianteNombre?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Venta {
  id: string
  folio: string
  fecha: string
  hora: string
  lineas: LineaVenta[]
  total: number
  montoPagado: number
  saldoPendiente: number
  estatusPago: EstatusPagoVenta
  estatusOperativo: EstatusOperativoVenta
  abonos: Abono[]
  formaPago: FormaPago
  cliente?: ClienteVenta
  notas?: string
  motivoCancelacion?: string
}
