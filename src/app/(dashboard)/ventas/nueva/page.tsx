import { requireBusinessContext } from "@/server/business/business-context"
import { PosCliente } from "@/components/ventas/PosCliente"

export const dynamic = "force-dynamic"

export default async function NuevaVentaPage() {
  const { supabase, business } = await requireBusinessContext()

  const { data: productos } = await supabase
    .from("productos")
    .select(`
      id, nombre, sku, precio_venta, stock, estatus,
      categorias:categoria_id (nombre, color),
      producto_variantes (id, nombre, sku, stock, estatus)
    `)
    .eq("business_id", business.id)
    .neq("estatus", "pausado")
    .order("nombre")

  const productosMapeados = (productos ?? []).map((p) => ({
    id:          p.id,
    nombre:      p.nombre,
    sku:         p.sku,
    precio_venta: p.precio_venta,
    stock:       p.stock,
    estatus:     p.estatus,
    categoria:   Array.isArray(p.categorias)
      ? { nombre: p.categorias[0]?.nombre ?? "", color: p.categorias[0]?.color ?? null }
      : { nombre: (p.categorias as { nombre: string; color: string | null } | null)?.nombre ?? "", color: (p.categorias as { nombre: string; color: string | null } | null)?.color ?? null },
    variantes:   (p.producto_variantes ?? []).map((v) => ({
      id:      v.id,
      nombre:  v.nombre,
      sku:     v.sku,
      stock:   v.stock,
      estatus: v.estatus,
    })),
  }))

  return <PosCliente productos={productosMapeados} />
}
