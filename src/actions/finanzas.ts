"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { transaccionSchema, type TransaccionInput } from "@/lib/validations/transaccion.schema"

export async function registrarTransaccion(input: TransaccionInput) {
  const values = transaccionSchema.parse(input)
  const supabase = await createSupabaseServerClient()

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    const { error } = await supabase.from("transacciones").insert({
      user_id: user.id,
      fecha: values.fecha,
      concepto: values.concepto,
      categoria_id: values.categoriaId,
      cantidad: values.cantidad,
      forma_pago: values.formaPago,
      monto: values.monto,
      tipo: values.tipo,
      producto_id: values.productoId || null,
      notas: values.notas || null,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  revalidatePath("/finanzas")
  revalidatePath("/dashboard")
  redirect("/finanzas")
}
