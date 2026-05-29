import { notFound } from "next/navigation"
import { ProductoForm } from "@/components/inventario/ProductoForm"
import { Navbar } from "@/components/shared/Navbar"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function NuevoProductoPage() {
  const { supabase, business } = await requireBusinessContext()

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre, atributos_base")
    .eq("business_id", business.id)
    .eq("tipo", "producto")
    .order("nombre")

  if (!categorias || categorias.length === 0) notFound()

  return (
    <>
      <Navbar title="Nuevo producto" subtitle="Crea un producto con precio, stock inicial e imagen." />
      <div className="page">
        <ProductoForm categorias={categorias} />
      </div>
    </>
  )
}
