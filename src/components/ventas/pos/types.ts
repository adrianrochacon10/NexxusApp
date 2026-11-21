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
  imagen_url:   string | null
  stock:        number
  stock_minimo: number
  estatus:      string
  categoria:    { nombre: string; color: string | null }
  variantes:    VariantePos[]
}

/** Ajuste de precio de una línea (descuento, precio especial) con su motivo. */
export interface AjustePrecio {
  precio: number
  motivo: string
}

export interface LineaInventario {
  tipo:      "inventario"
  producto:  ProductoPos
  variante?: VariantePos
  cantidad:  number
  ajuste?:   AjustePrecio
}

/** Artículo que no está en inventario (sobrecargo): no descuenta stock. */
export interface LineaLibre {
  tipo:        "libre"
  id:          string
  descripcion: string
  precio:      number
  cantidad:    number
}

export type LineaTicket = LineaInventario | LineaLibre

/** Precio unitario que se cobra en la línea. */
export function precioLinea(l: LineaTicket) {
  if (l.tipo === "libre") return l.precio
  return l.ajuste?.precio ?? l.producto.precio_venta
}

/** Clave estable de una línea del ticket. */
export function claveDe(l: LineaTicket) {
  return l.tipo === "libre" ? `libre:${l.id}` : claveLinea(l.producto.id, l.variante?.id)
}

/** Máximo vendible de la línea (los artículos libres no tienen tope de stock). */
export function maximoLinea(l: LineaTicket) {
  return l.tipo === "libre" ? 999 : stockDisponible(l.producto, l.variante)
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

/** Convierte "$1,299.50" o "199" en número (NaN si no es válido). */
export function parseMonto(v: string) {
  const limpio = v.replace(/[$,\s]/g, "")
  return limpio === "" ? NaN : Number(limpio)
}

export function piezasTexto(n: number) {
  return `${n} ${n === 1 ? "pieza" : "piezas"}`
}
