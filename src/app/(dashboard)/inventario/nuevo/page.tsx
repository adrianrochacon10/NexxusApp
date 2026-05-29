import { notFound } from "next/navigation"
import { ProductoForm } from "@/components/inventario/ProductoForm"
import { Navbar } from "@/components/shared/Navbar"
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

  return (
    <>
      <Navbar
        title="Nuevo producto"
        subtitle={
          categoriaIdFija
            ? `Categoría: ${categorias.find((c) => c.id === categoriaIdFija)?.nombre}`
            : "Crea un producto con precio, stock inicial e imagen."
        }
      />
      <div className="page">
        <ProductoForm
          categorias={categorias}
          categoriaFija={categoriaIdFija}
          defaultValues={categoriaIdFija ? { categoriaId: categoriaIdFija } : undefined}
        />
      </div>
    </>
  )
}
