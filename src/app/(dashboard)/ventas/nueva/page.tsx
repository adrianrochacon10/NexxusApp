import { requireBusinessContext } from "@/server/business/business-context"
import { PosCliente } from "@/components/ventas/PosCliente"

export const dynamic = "force-dynamic"

type CategoriaRel = { nombre: string; color: string | null } | null

export default async function NuevaVentaPage() {
  const { supabase, business } = await requireBusinessContext()

  const { data: productos } = await supabase
    .from("productos")
    .select(`
      id, nombre, sku, precio_venta, stock, stock_minimo, estatus, imagen_url,
      categorias:categoria_id (nombre, color),
      producto_variantes (id, nombre, sku, stock, stock_minimo)
    `)
    .eq("business_id", business.id)
    .neq("estatus", "pausado")
    .order("nombre")

  const productosMapeados = (productos ?? []).map((p) => {
    const cat = (Array.isArray(p.categorias) ? p.categorias[0] : p.categorias) as CategoriaRel | undefined
    return {
      id:           p.id,
      nombre:       p.nombre,
      sku:          p.sku,
      precio_venta: p.precio_venta,
      imagen_url:   p.imagen_url ?? null,
      stock:        p.stock,
      stock_minimo: p.stock_minimo ?? 0,
      estatus:      p.stock > 0 ? p.estatus : "agotado", // "agotado" se deriva del stock
      categoria:    { nombre: cat?.nombre ?? "", color: cat?.color ?? null },
      variantes:    (p.producto_variantes ?? []).map((v) => ({
        id:           v.id,
        nombre:       v.nombre,
        sku:          v.sku,
        stock:        v.stock,
        stock_minimo: v.stock_minimo ?? 0,
        estatus:      v.stock > 0 ? "disponible" : "agotado",
      })),
    }
  })

  return <PosCliente productos={productosMapeados} />
}
