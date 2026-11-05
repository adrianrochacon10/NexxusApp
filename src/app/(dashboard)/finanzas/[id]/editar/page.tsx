import { notFound } from "next/navigation"
import { TransaccionForm } from "@/components/finanzas/TransaccionForm"
import { Navbar } from "@/components/shared/Navbar"
import { requireBusinessContext } from "@/server/business/business-context"
import "@/styles/finanzas.css"

export const dynamic = "force-dynamic"

export default async function EditarTransaccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, business } = await requireBusinessContext()

  const [{ data: transaccion }, { data: categorias }, { data: productos }] = await Promise.all([
    supabase
      .from("transacciones")
      .select("id, fecha, concepto, categoria_id, cantidad, forma_pago, monto, tipo, producto_id, notas, venta_id")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle(),
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

  if (!transaccion || transaccion.venta_id) notFound()

  return (
    <>
      <Navbar title="Editar movimiento" eyebrow="Finanzas" subtitle={transaccion.concepto} />
      <div className="page fz-page">
        <TransaccionForm
          categorias={categorias ?? []}
          productos={productos ?? []}
          transaccionId={transaccion.id}
          defaultValues={{
            fecha:       transaccion.fecha,
            concepto:    transaccion.concepto,
            categoriaId: transaccion.categoria_id ?? "",
            cantidad:    transaccion.cantidad,
            formaPago:   (transaccion.forma_pago ?? "transferencia") as "efectivo" | "transferencia" | "adeudo" | "tarjeta",
            monto:       transaccion.monto,
            tipo:        transaccion.tipo as "ingreso" | "gasto" | "transferencia",
            productoId:  transaccion.producto_id ?? "",
            notas:       transaccion.notas ?? "",
          }}
        />
      </div>
    </>
  )
}
