export type EstatusProducto = "disponible" | "pausado" | "agotado"
export type TipoMovimientoStock = "entrada" | "salida" | "ajuste"

export interface Categoria {
  id: string
  nombre: string
  tipo: "producto" | "gasto" | "ingreso"
  color?: string
  atributosBase?: string[]
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  categoria: Categoria
  precioVenta: number
  precioCosto: number
  stock: number
  stockMinimo: number
  imagenUrl?: string
  estatus: EstatusProducto
  sku: string
  atributos?: Record<string, string | number>
  createdAt: string
}

export interface MovimientoStock {
  id: string
  productoId: string
  tipo: TipoMovimientoStock
  cantidad: number
  stockAntes: number
  stockDespues: number
  notas?: string
  createdAt: string
}
