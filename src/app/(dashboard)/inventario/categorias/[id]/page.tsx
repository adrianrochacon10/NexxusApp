import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EmptyState } from "@/components/shared/EmptyState"
import { InventarioLista, type ProductoListado } from "@/components/inventario/InventarioLista"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function CategoriaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, business } = await requireBusinessContext()

  const [{ data: categoria }, { data: productos }] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, nombre, color, tipo, atributos_base")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("productos")
      .select("id, nombre, sku, precio_venta, precio_costo, stock, stock_minimo, imagen_url, estatus, categoria_id")
      .eq("categoria_id", id)
      .eq("business_id", business.id)
      .order("nombre"),
  ])

  if (!categoria) notFound()

  const ids = (productos ?? []).map((p) => p.id)
  const { data: variantes } = ids.length
    ? await supabase
        .from("producto_variantes")
        .select("id, producto_id, nombre, sku, stock, stock_minimo")
        .eq("business_id", business.id)
        .in("producto_id", ids)
        .order("nombre")
    : { data: [] }

  const prods: ProductoListado[] = (productos ?? []).map((p) => ({
    ...p,
    variantes: (variantes ?? [])
      .filter((v) => v.producto_id === p.id),
  }))
  const atributos = (categoria.atributos_base as string[] | null) ?? []
  const unidades = prods.reduce((s, p) => s + p.stock, 0)
  const valor = prods.reduce((s, p) => s + p.stock * p.precio_costo, 0)

  return (
    <>
      <Navbar
        eyebrow="Inventario · Categoría"
        title={categoria.nombre}
        subtitle={`${prods.length} ${prods.length === 1 ? "producto" : "productos"} · ${unidades} uds · ${formatCurrency(valor)} a costo${atributos.length ? ` · Atributos: ${atributos.join(", ")}` : ""}`}
        actions={
          <>
            <Link href="/inventario" className="nx-btn nx-btn-secondary">
              <ArrowLeft size={20} aria-hidden="true" />
              Inventario
            </Link>
            <Link href={`/inventario/nuevo?cat=${id}`} className="nx-btn nx-btn-primary">
              <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
              Nuevo producto
            </Link>
          </>
        }
      />
      <div className="page">
        {prods.length === 0 ? (
          <EmptyState
            title="Esta categoría aún no tiene productos"
            description="Agrega el primero: tendrá los atributos de la categoría listos para llenar."
            actionHref={`/inventario/nuevo?cat=${id}`}
            actionLabel="Agregar producto"
          />
        ) : (
          <InventarioLista
            categorias={[{ id: categoria.id, nombre: categoria.nombre, color: categoria.color, atributos_base: atributos }]}
            productos={prods}
            categoriaUnica
          />
        )}
      </div>
    </>
  )
}
