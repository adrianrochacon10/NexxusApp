"use server"

import { revalidatePath } from "next/cache"
import { abonoSchema, cancelacionSchema, nuevaVentaSchema, type AbonoInput, type NuevaVentaInput } from "@/lib/validations/venta.schema"
import { requireBusinessContext } from "@/server/business/business-context"
import { runAction, unwrap, type ActionResult } from "@/server/actions/result"

// Todas las reglas (precio, stock, saldo, folio, finanzas) viven en las
// funciones SQL; aquí solo se valida la forma de la entrada y se llama la RPC.

function revalidarVentas(ventaId?: string) {
  revalidatePath("/ventas", "layout")
  revalidatePath("/inventario", "layout")
  revalidatePath("/finanzas", "layout")
  revalidatePath("/dashboard")
  if (ventaId) revalidatePath(`/ventas/${ventaId}`)
}

export async function registrarVenta(input: NuevaVentaInput): Promise<ActionResult<{ ventaId: string; folio: string }>> {
  return runAction(async () => {
    const values = nuevaVentaSchema.parse(input)
    const { supabase, business } = await requireBusinessContext()

    const pago = values.pagoInicial && values.pagoInicial.formaPago !== "adeudo" && values.pagoInicial.monto > 0
      ? { monto: values.pagoInicial.monto, forma_pago: values.pagoInicial.formaPago }
      : null

    const resultado = unwrap(await supabase.rpc("registrar_venta", {
      p_business_id: business.id,
      p_lineas: values.lineas.map((l) => ({ producto_id: l.productoId, variante_id: l.varianteId ?? null, cantidad: l.cantidad })),
      p_pago: pago,
      p_cliente: values.cliente ? { nombre: values.cliente.nombre, telefono: values.cliente.telefono ?? null } : null,
      p_notas: values.notas ?? "",
      p_idempotency_key: values.idempotencyKey,
    })) as { venta_id: string; folio: string }

    revalidarVentas()
    return { ventaId: resultado.venta_id, folio: resultado.folio }
  })
}

export async function registrarAbono(input: AbonoInput): Promise<ActionResult<{ saldoPendiente: number; estadoPago: string }>> {
  return runAction(async () => {
    const values = abonoSchema.parse(input)
    const { supabase, business } = await requireBusinessContext()

    const resultado = unwrap(await supabase.rpc("registrar_abono", {
      p_business_id: business.id,
      p_venta_id: values.ventaId,
      p_monto: values.monto,
      p_forma_pago: values.formaPago,
      p_idempotency_key: values.idempotencyKey,
    })) as { saldo_pendiente: number | string; estado_pago: string }

    revalidarVentas(values.ventaId)
    return { saldoPendiente: Number(resultado.saldo_pendiente), estadoPago: resultado.estado_pago }
  })
}

export async function cancelarVenta(ventaId: string, motivo: string): Promise<ActionResult> {
  return runAction(async () => {
    const values = cancelacionSchema.parse({ ventaId, motivo })
    const { supabase, business } = await requireBusinessContext()

    unwrap(await supabase.rpc("cancelar_venta", {
      p_business_id: business.id,
      p_venta_id: values.ventaId,
      p_motivo: values.motivo,
    }))

    revalidarVentas(values.ventaId)
  })
}
