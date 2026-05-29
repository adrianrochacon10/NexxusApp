"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireBusinessContext } from "@/server/business/business-context"

export interface LineaInput {
  productoId:     string
  varianteId?:    string
  productoNombre: string
  varianteNombre?: string
  cantidad:       number
  precioUnitario: number
}

export interface NuevaVentaInput {
  lineas: LineaInput[]
  pagoInicial?: {
    monto:     number
    formaPago: "efectivo" | "transferencia" | "tarjeta" | "adeudo"
  }
  cliente?: { nombre: string; telefono?: string }
  notas?:   string
}

export async function registrarVenta(input: NuevaVentaInput): Promise<string> {
  const { supabase, business, user } = await requireBusinessContext()

  const subtotal = input.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0)
  const montoPagado    = input.pagoInicial?.monto ?? 0
  const saldoPendiente = Math.max(0, subtotal - montoPagado)
  const estadoPago     =
    saldoPendiente === 0 ? "pagada" :
    montoPagado    > 0  ? "parcial" : "pendiente"
  const formaPago = input.pagoInicial?.formaPago ?? "adeudo"

  // Generar folio
  const { data: folioData } = await supabase
    .rpc("next_venta_folio", { target_business_id: business.id })
  const folio = folioData as string

  // Insertar venta
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      business_id:         business.id,
      user_id:             user.id,
      folio,
      subtotal,
      descuento:           0,
      total:               subtotal,
      monto_pagado:        montoPagado,
      saldo_pendiente:     saldoPendiente,
      forma_pago_inicial:  formaPago === "adeudo" ? null : formaPago,
      estado_pago:         estadoPago,
      cliente_nombre:      input.cliente?.nombre || null,
      cliente_telefono:    input.cliente?.telefono || null,
      notas:               input.notas || null,
    })
    .select("id")
    .single()

  if (ventaError || !venta) throw new Error(ventaError?.message ?? "Error al crear la venta")

  // Insertar líneas
  const lineas = input.lineas.map((l) => ({
    business_id:     business.id,
    venta_id:        venta.id,
    producto_id:     l.productoId,
    variante_id:     l.varianteId || null,
    producto_nombre: l.productoNombre,
    variante_nombre: l.varianteNombre || null,
    cantidad:        l.cantidad,
    precio_unitario: l.precioUnitario,
    subtotal:        l.cantidad * l.precioUnitario,
  }))

  const { error: lineasError } = await supabase.from("venta_lineas").insert(lineas)
  if (lineasError) throw new Error(lineasError.message)

  // Registrar pago si hubo
  if (montoPagado > 0 && formaPago !== "adeudo") {
    await supabase.from("venta_pagos").insert({
      business_id: business.id,
      venta_id:    venta.id,
      user_id:     user.id,
      monto:       montoPagado,
      forma_pago:  formaPago,
    })

    // Transacción financiera del pago
    const { data: catVentas } = await supabase
      .from("categorias")
      .select("id")
      .eq("business_id", business.id)
      .eq("tipo", "ingreso")
      .limit(1)
      .maybeSingle()

    await supabase.from("transacciones").insert({
      business_id:  business.id,
      user_id:      user.id,
      fecha:        new Date().toISOString().split("T")[0],
      concepto:     `Venta ${folio}`,
      categoria_id: catVentas?.id || null,
      cantidad:     input.lineas.reduce((s, l) => s + l.cantidad, 0),
      forma_pago:   formaPago,
      monto:        montoPagado,
      tipo:         "ingreso",
      venta_id:     venta.id,
    })
  }

  // Descontar stock por producto/variante
  for (const linea of input.lineas) {
    if (linea.varianteId) {
      const { data: variante } = await supabase
        .from("producto_variantes")
        .select("stock")
        .eq("id", linea.varianteId)
        .single()
      if (variante) {
        const nuevoStock = Math.max(0, variante.stock - linea.cantidad)
        await supabase.from("producto_variantes").update({
          stock:   nuevoStock,
          estatus: nuevoStock === 0 ? "agotado" : "disponible",
        }).eq("id", linea.varianteId)
      }
    } else {
      const { data: producto } = await supabase
        .from("productos")
        .select("stock, stock_minimo")
        .eq("id", linea.productoId)
        .single()
      if (producto) {
        const nuevoStock = Math.max(0, producto.stock - linea.cantidad)
        await supabase.from("productos").update({
          stock:   nuevoStock,
          estatus: nuevoStock === 0 ? "agotado" : nuevoStock <= producto.stock_minimo ? "agotado" : "disponible",
        }).eq("id", linea.productoId)
      }
    }

    // Movimiento de stock
    const { data: prod } = await supabase.from("productos").select("stock").eq("id", linea.productoId).single()
    await supabase.from("movimientos_stock").insert({
      business_id:     business.id,
      producto_id:     linea.productoId,
      variante_id:     linea.varianteId || null,
      user_id:         user.id,
      tipo:            "venta",
      cantidad:        linea.cantidad,
      stock_antes:     (prod?.stock ?? 0) + linea.cantidad,
      stock_despues:   prod?.stock ?? 0,
      referencia_tipo: "venta",
      referencia_id:   venta.id,
    })
  }

  revalidatePath("/ventas")
  revalidatePath("/inventario")
  revalidatePath("/dashboard")

  return venta.id
}

export async function registrarAbono(ventaId: string, monto: number, formaPago: "efectivo" | "transferencia" | "tarjeta") {
  const { supabase, business, user } = await requireBusinessContext()

  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .select("total, monto_pagado, saldo_pendiente, folio, estatus")
    .eq("id", ventaId)
    .eq("business_id", business.id)
    .single()

  if (ventaError || !venta) throw new Error("Venta no encontrada")
  if (venta.estatus === "cancelada") throw new Error("No se puede abonar a una venta cancelada")
  if (monto > venta.saldo_pendiente) throw new Error("El monto supera el saldo pendiente")

  const nuevoMontoPagado    = venta.monto_pagado + monto
  const nuevoSaldo          = Math.max(0, venta.total - nuevoMontoPagado)
  const nuevoEstadoPago     = nuevoSaldo === 0 ? "pagada" : "parcial"

  await supabase.from("venta_pagos").insert({
    business_id: business.id,
    venta_id:    ventaId,
    user_id:     user.id,
    monto,
    forma_pago:  formaPago,
  })

  await supabase.from("ventas").update({
    monto_pagado:    nuevoMontoPagado,
    saldo_pendiente: nuevoSaldo,
    estado_pago:     nuevoEstadoPago,
  }).eq("id", ventaId)

  // Transacción financiera del abono
  const { data: catVentas } = await supabase
    .from("categorias")
    .select("id")
    .eq("business_id", business.id)
    .eq("tipo", "ingreso")
    .limit(1)
    .maybeSingle()

  await supabase.from("transacciones").insert({
    business_id:  business.id,
    user_id:      user.id,
    fecha:        new Date().toISOString().split("T")[0],
    concepto:     `Abono ${venta.folio} — ${formaPago}`,
    categoria_id: catVentas?.id || null,
    cantidad:     1,
    forma_pago:   formaPago,
    monto,
    tipo:         "ingreso",
    venta_id:     ventaId,
  })

  revalidatePath(`/ventas/${ventaId}`)
  revalidatePath("/ventas")
  revalidatePath("/ventas/pendientes")
  revalidatePath("/dashboard")
}

export async function cancelarVenta(ventaId: string, motivo: string) {
  const { supabase, business } = await requireBusinessContext()

  const { error } = await supabase.from("ventas").update({
    estatus:            "cancelada",
    cancelada_at:       new Date().toISOString(),
    motivo_cancelacion: motivo,
  }).eq("id", ventaId).eq("business_id", business.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/ventas/${ventaId}`)
  revalidatePath("/ventas")
  revalidatePath("/dashboard")
  redirect("/ventas")
}
