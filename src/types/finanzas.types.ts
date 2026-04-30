import type { Categoria } from "@/types/inventario.types"

export type TipoTransaccion = "ingreso" | "gasto" | "transferencia"
export type FormaPago = "efectivo" | "transferencia" | "adeudo" | "tarjeta"

export interface Transaccion {
  id: string
  fecha: string
  concepto: string
  categoria: Categoria
  cantidad: number
  formaPago: FormaPago
  monto: number
  tipo: TipoTransaccion
  productoId?: string
  notas?: string
}

export interface PuntoGrafica {
  nombre: string
  ingresos: number
  gastos: number
}

export interface CategoriaReporte {
  nombre: string
  transacciones: number
  monto: number
  porcentaje: number
  color: string
}
