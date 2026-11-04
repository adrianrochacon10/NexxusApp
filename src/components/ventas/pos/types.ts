export interface VariantePos {
  id:           string
  nombre:       string
  sku:          string | null
  stock:        number
  stock_minimo: number
  estatus:      string
}

export interface ProductoPos {
  id:           string
  nombre:       string
  sku:          string | null
  precio_venta: number
  stock:        number
  stock_minimo: number
  estatus:      string
  categoria:    { nombre: string; color: string | null }
  variantes:    VariantePos[]
}

export interface LineaTicket {
  producto: ProductoPos
  variante?: VariantePos
  cantidad: number
}

/** completo = paga todo · parcial = abono + saldo · credito = todo a deber (forma "adeudo") */
export type ModoPago  = "completo" | "parcial" | "credito"
export type FormaPago = "efectivo" | "transferencia" | "tarjeta"

export type NivelStock = "ok" | "low" | "out"

export const SIN_CATEGORIA = "Sin categoría"

/** Stock vendible de un producto o variante (un producto con variantes solo se vende por variante). */
export function stockDisponible(producto: ProductoPos, variante?: VariantePos) {
  if (variante) return variante.stock
  if (producto.variantes.length > 0) return 0
  return producto.stock
}

/** Stock total mostrado en el catálogo (suma de variantes si las hay). */
export function stockTotal(producto: ProductoPos) {
  if (producto.variantes.length === 0) return producto.stock
  return producto.variantes.reduce((s, v) => s + v.stock, 0)
}

export function nivelStock(stock: number, minimo: number): NivelStock {
  if (stock <= 0) return "out"
  if (stock <= minimo) return "low"
  return "ok"
}

export function claveLinea(productoId: string, varianteId?: string) {
  return `${productoId}:${varianteId ?? ""}`
}

export function piezasTexto(n: number) {
  return `${n} ${n === 1 ? "pieza" : "piezas"}`
}
