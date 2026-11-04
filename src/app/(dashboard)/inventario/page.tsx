import Link from "next/link"
import { FolderPlus, Plus } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EmptyState } from "@/components/shared/EmptyState"
import { InventarioLista, type ProductoListado } from "@/components/inventario/InventarioLista"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function InventarioPage() {
  const { supabase, business } = await requireBusinessContext()

  const [{ data: categorias }, { data: productos }, { data: variantes }] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, nombre, color, atributos_base")
      .eq("business_id", business.id)
      .eq("tipo", "producto")
      .order("nombre"),
    supabase
      .from("productos")
      .select("id, nombre, sku, precio_venta, precio_costo, stock, stock_minimo, imagen_url, estatus, categoria_id")
      .eq("business_id", business.id)
      .order("nombre"),
    supabase
      .from("producto_variantes")
      .select("id, producto_id, nombre, sku, stock, stock_minimo")
      .eq("business_id", business.id)
      .order("nombre"),
  ])

  const cats = (categorias ?? []).map((c) => ({ ...c, atributos_base: (c.atributos_base as string[] | null) ?? [] }))
  const prods: ProductoListado[] = (productos ?? []).map((p) => ({
    ...p,
    variantes: (variantes ?? []).filter((v) => v.producto_id === p.id),
  }))

  return (
    <>
      <Navbar
        eyebrow="Catálogo"
        title="Inventario"
        actions={
          <>
            <Link href="/inventario/categorias/nueva" className="nx-btn nx-btn-secondary">
              <FolderPlus size={20} aria-hidden="true" />
              Nueva categoría
            </Link>
            {cats.length > 0 && (
              <Link href="/inventario/nuevo" className="nx-btn nx-btn-primary">
                <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
                Nuevo producto
              </Link>
            )}
          </>
        }
      />
      <div className="page">
        {cats.length === 0 && prods.length === 0 ? (
          <EmptyState
            title="Aún no tienes categorías"
            description="Crea tu primera categoría (por ejemplo, Blusas o Accesorios) para empezar a agregar productos."
            actionHref="/inventario/categorias/nueva"
            actionLabel="Crear categoría"
          />
        ) : (
          <InventarioLista categorias={cats} productos={prods} />
        )}
      </div>
    </>
  )
}
