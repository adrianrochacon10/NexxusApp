"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { transaccionSchema, type TransaccionInput } from "@/lib/validations/transaccion.schema"
import { requireBusinessContext } from "@/server/business/business-context"
import { AppError } from "@/server/errors/app-error"
import { runAction, unwrap, type ActionResult } from "@/server/actions/result"

// Las transacciones manuales se escriben directo (RLS solo permite origen
// 'manual'). Las automáticas (venta, abono, devolución) las crean las funciones
// de ventas y no se editan aquí.

function revalidarFinanzas() {
  revalidatePath("/finanzas", "layout")
  revalidatePath("/dashboard")
}

function columnas(values: TransaccionInput) {
  return {
    fecha:        values.fecha,
    concepto:     values.concepto,
    categoria_id: values.categoriaId,
    cantidad:     values.cantidad,
    forma_pago:   values.formaPago,
    monto:        values.monto,
    tipo:         values.tipo,
    producto_id:  values.productoId || null,
    notas:        values.notas || null,
  }
}

export async function registrarTransaccion(input: TransaccionInput): Promise<ActionResult> {
  return runAction(async () => {
    const values = transaccionSchema.parse(input)
    const { supabase, business } = await requireBusinessContext()

    unwrap(await supabase.from("transacciones").insert({ business_id: business.id, ...columnas(values) }))
    revalidarFinanzas()
  })
}

export async function actualizarTransaccion(id: string, input: TransaccionInput): Promise<ActionResult> {
  return runAction(async () => {
    const trxId = z.string().uuid().parse(id)
    const values = transaccionSchema.parse(input)
    const { supabase, business } = await requireBusinessContext()

    const existente = unwrap(await supabase
      .from("transacciones")
      .select("origen")
      .eq("id", trxId)
      .eq("business_id", business.id)
      .maybeSingle())

    if (!existente) throw new AppError("NOT_FOUND", "Transacción no encontrada.", 404)
    if (existente.origen !== "manual") {
      throw new AppError("CONFLICT", "Este movimiento lo generó una venta y no se puede editar desde aquí.", 409)
    }

    unwrap(await supabase.from("transacciones").update(columnas(values)).eq("id", trxId).eq("business_id", business.id))
    revalidarFinanzas()
  })
}

/**
 * Manual: se borra. Pago de venta/abono: se quita el pago (la venta recalcula
 * su saldo y el ingreso cae con él). Devolución: no se borra; es el rastro de
 * una cancelación.
 */
export async function eliminarTransaccion(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const trxId = z.string().uuid().parse(id)
    const { supabase, business } = await requireBusinessContext()

    const trx = unwrap(await supabase
      .from("transacciones")
      .select("origen, venta_id, venta_pago_id")
      .eq("id", trxId)
      .eq("business_id", business.id)
      .maybeSingle())

    if (!trx) throw new AppError("NOT_FOUND", "Transacción no encontrada.", 404)

    if (trx.origen === "devolucion") {
      throw new AppError("CONFLICT", "La devolución es parte de una venta cancelada y no se puede borrar.", 409)
    }

    if (trx.venta_pago_id) {
      unwrap(await supabase.rpc("eliminar_pago_venta", { p_business_id: business.id, p_pago_id: trx.venta_pago_id }))
      revalidatePath("/ventas", "layout")
    } else {
      unwrap(await supabase.from("transacciones").delete().eq("id", trxId).eq("business_id", business.id))
    }

    revalidarFinanzas()
  })
}
