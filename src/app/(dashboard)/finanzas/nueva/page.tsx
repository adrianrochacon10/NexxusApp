import { TransaccionForm } from "@/components/finanzas/TransaccionForm"
import { Navbar } from "@/components/shared/Navbar"
import { requireBusinessContext } from "@/server/business/business-context"

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
      <Navbar title="Nueva transacción" subtitle="Registra ingresos, gastos o transferencias." />
      <div className="page">
        <TransaccionForm
          categorias={categorias ?? []}
          productos={productos ?? []}
        />
      </div>
    </>
  )
}
