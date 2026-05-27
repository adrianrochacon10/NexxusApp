import type { FormaPago } from "@/types/finanzas.types"

export interface LineaVenta {
  productoId: string
  productoNombre: string
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
  formaPago: FormaPago
}
