/** Estado visible en inventario. "bajo" no existe en BD: se deriva del stock. */
export type EstadoInventario = "ok" | "bajo" | "agotado" | "pausado"

export interface VarianteResumen {
  id:           string
  nombre:       string
  sku?:         string | null
  stock:        number
  stock_minimo: number
}

export const ESTADO_BADGE: Record<EstadoInventario, { cls: string; label: string }> = {
  ok:      { cls: "is-ok",   label: "Disponible" },
  bajo:    { cls: "is-warn", label: "Stock bajo" },
  agotado: { cls: "is-bad",  label: "Agotado" },
  pausado: { cls: "is-off",  label: "Pausado" },
}

/**
 * Estado según lo que el POS puede vender: pausado oculta el producto;
 * stock 0 lo agota; en o bajo el mínimo (de producto o de alguna variante) es "bajo".
 */
export function estadoProducto(
  producto: { stock: number; stock_minimo: number; estatus: string },
  variantes: VarianteResumen[] = [],
): { estado: EstadoInventario; bajoEn: string[] } {
  if (producto.estatus === "pausado") return { estado: "pausado", bajoEn: [] }
  if (producto.stock <= 0) return { estado: "agotado", bajoEn: [] }
  if (variantes.length > 0) {
    const bajoEn = variantes.filter((v) => v.stock <= v.stock_minimo).map((v) => v.nombre)
    return { estado: bajoEn.length > 0 ? "bajo" : "ok", bajoEn }
  }
  return { estado: producto.stock <= producto.stock_minimo ? "bajo" : "ok", bajoEn: [] }
}

export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
}

export function margenPct(precio: number, costo: number): number | null {
  if (!precio || precio <= 0 || Number.isNaN(costo)) return null
  return ((precio - costo) / precio) * 100
}

export function formatPct(valor: number | null): string {
  if (valor === null) return "— %"
  return `${valor.toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

/** Las server actions que hacen redirect() rechazan la promesa con NEXT_REDIRECT: no es un error real. */
export function esRedireccion(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")
}

/** Ruta destino de un NEXT_REDIRECT (digest "NEXT_REDIRECT;push;/ruta;307;"). */
export function destinoRedireccion(err: unknown): string | null {
  if (!esRedireccion(err)) return null
  const ruta = String((err as { digest: string }).digest).split(";")[2]
  return ruta && ruta.startsWith("/") ? ruta : null
}

export function mensajeError(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}
