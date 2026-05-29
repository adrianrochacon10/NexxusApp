import { notFound } from "next/navigation"
import { ProductoForm } from "@/components/inventario/ProductoForm"
import { Navbar } from "@/components/shared/Navbar"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, business } = await requireBusinessContext()

  const [{ data: producto }, { data: categorias }, { data: variantesDB }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, sku, descripcion, categoria_id, precio_venta, precio_costo, stock, stock_minimo, estatus, imagen_url, atributos, business_id")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("categorias")
      .select("id, nombre, color, atributos_base")
      .eq("business_id", business.id)
      .eq("tipo", "producto")
      .order("nombre"),
    supabase
      .from("producto_variantes")
      .select("id, nombre, sku, atributos, stock, stock_minimo")
      .eq("producto_id", id)
      .order("nombre"),
  ])

  if (!producto || !categorias) notFound()

  const variantesIniciales = (variantesDB ?? []).map((v) => ({
    id:          v.id,
    nombre:      v.nombre,
    sku:         v.sku ?? "",
    atributos:   (v.atributos as Record<string, string>) ?? {},
    stock:       v.stock,
    stockMinimo: v.stock_minimo,
  }))

  return (
    <>
      <Navbar title="Editar producto" subtitle={producto.nombre} />
      <div className="page">
        <ProductoForm
          categorias={categorias}
          productoId={id}
          variantesIniciales={variantesIniciales}
          defaultValues={{
            nombre:      producto.nombre,
            sku:         producto.sku ?? "",
            descripcion: producto.descripcion ?? "",
            categoriaId: producto.categoria_id ?? "",
            precioVenta: producto.precio_venta,
            precioCosto: producto.precio_costo,
            stock:       producto.stock,
            stockMinimo: producto.stock_minimo,
            estatus:     producto.estatus as "disponible" | "pausado" | "agotado",
            imagenUrl:   producto.imagen_url ?? "",
            atributos:   (producto.atributos as Record<string, string>) ?? {},
          }}
        />
      </div>
    </>
  )
}
