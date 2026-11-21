import { TransaccionForm } from "@/components/finanzas/TransaccionForm"
import { Navbar } from "@/components/shared/Navbar"
import { requireBusinessContext } from "@/server/business/business-context"
import "@/styles/finanzas.css"

export const dynamic = "force-dynamic"

export default async function NuevaTransaccionPage() {
  const { supabase, business } = await requireBusinessContext()

  const [{ data: categorias }, { data: productos }] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, nombre, tipo")
      .eq("business_id", business.id)
      .neq("tipo", "producto")
      .order("nombre"),
    supabase
      .from("productos")
      .select("id, nombre")
      .eq("business_id", business.id)
      .order("nombre"),
  ])

  return (
    <>
      <Navbar title="Nuevo movimiento" eyebrow="Finanzas" subtitle="Registra un ingreso, egreso o transferencia." />
      <div className="page fz-page">
        <TransaccionForm
          categorias={categorias ?? []}
          productos={productos ?? []}
        />
      </div>
    </>
  )
}
