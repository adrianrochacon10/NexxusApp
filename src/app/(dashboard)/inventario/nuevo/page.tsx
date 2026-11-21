import { notFound } from "next/navigation"
import { ProductoForm } from "@/components/inventario/ProductoForm"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function NuevoProductoPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const { supabase, business } = await requireBusinessContext()

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre, color, atributos_base")
    .eq("business_id", business.id)
    .eq("tipo", "producto")
    .order("nombre")

  if (!categorias || categorias.length === 0) notFound()

  const categoriaIdFija = cat && categorias.some((c) => c.id === cat) ? cat : undefined
  const nombreCategoria = categoriaIdFija ? categorias.find((c) => c.id === categoriaIdFija)?.nombre : undefined

  return (
    <ProductoForm
      titulo="Nuevo producto"
      migas={nombreCategoria ? `${nombreCategoria} / Nuevo producto` : "Nuevo producto"}
      cancelHref={categoriaIdFija ? `/inventario/categorias/${categoriaIdFija}` : "/inventario"}
      categorias={categorias}
      categoriaFija={categoriaIdFija}
      defaultValues={categoriaIdFija ? { categoriaId: categoriaIdFija } : undefined}
    />
  )
}
