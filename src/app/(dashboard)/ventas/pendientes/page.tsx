import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"
import { CuentasPorCobrar } from "@/components/ventas/historial/CuentasPorCobrar"
import { clienteTexto, diasEntre, hoyISO, toVentaVM, type VentaRow } from "@/components/ventas/historial/venta-data"
import "@/styles/ventas.css"

export const dynamic = "force-dynamic"

export default async function PendientesPage() {
  const { supabase, business } = await requireBusinessContext()

  const [{ data: abiertasData }, { data: canceladasData }] = await Promise.all([
    supabase
      .from("ventas")
      .select(`
        id, folio, fecha, hora, total, monto_pagado, saldo_pendiente,
        forma_pago_inicial, estado_pago, estatus, cliente_nombre, cliente_telefono,
        venta_lineas (id, producto_nombre, variante_nombre, cantidad),
        venta_pagos (id)
      `)
      .eq("business_id", business.id)
      .eq("estatus", "activa")
      .neq("estado_pago", "pagada")
      .order("fecha", { ascending: false }),
    // Ventas que se cancelaron teniendo saldo: se muestran como referencia
    supabase
      .from("ventas")
      .select(`
        id, folio, fecha, hora, total, monto_pagado, saldo_pendiente,
        estado_pago, estatus, cliente_nombre, motivo_cancelacion,
        venta_lineas (id, producto_nombre, variante_nombre, cantidad)
      `)
      .eq("business_id", business.id)
      .eq("estatus", "cancelada")
      .gt("saldo_pendiente", 0)
      .order("cancelada_at", { ascending: false })
      .limit(6),
  ])

  const cuentas    = ((abiertasData ?? []) as unknown as VentaRow[]).map(toVentaVM)
  const canceladas = ((canceladasData ?? []) as unknown as VentaRow[]).map(toVentaVM)
  const hoy        = hoyISO()

  const porCobrar  = cuentas.reduce((s, v) => s + v.saldo, 0)
  const cobrado    = cuentas.reduce((s, v) => s + v.montoPagado, 0)
  const vendido    = cuentas.reduce((s, v) => s + v.total, 0)
  const masAntigua = cuentas.reduce<(typeof cuentas)[number] | null>(
    (old, v) => (!old || `${v.fecha} ${v.hora}` < `${old.fecha} ${old.hora}` ? v : old),
    null,
  )
  const diasAntigua = masAntigua ? diasEntre(masAntigua.fecha, hoy) : 0

  const volver = (
    <Link href="/ventas" className="nx-btn nx-btn-secondary">
      <ArrowLeft size={18} aria-hidden="true" />
      Ventas
    </Link>
  )

  return (
    <>
      <Navbar title="Por cobrar" eyebrow="Ventas a crédito y con abonos" actions={volver} />
      <div className="page vx-page">
        <section className="vx-kpis" aria-label="Resumen de cuentas por cobrar">
          <article className="nx-card nx-kpi">
            <span className="nx-kpi-label">Total por cobrar</span>
            <span className="nx-kpi-value" style={{ color: porCobrar > 0 ? "var(--nx-warn-fg)" : undefined }}>{formatCurrency(porCobrar)}</span>
            <span className="nx-kpi-foot">{cuentas.length} {cuentas.length === 1 ? "cuenta abierta" : "cuentas abiertas"}</span>
          </article>
          <article className="nx-card nx-kpi vx-only-desk-flex">
            <span className="nx-kpi-label">Cobrado en abonos</span>
            <span className="nx-kpi-value">{formatCurrency(cobrado)}</span>
            <span className="nx-kpi-foot">De {formatCurrency(vendido)} vendidos</span>
          </article>
          <article className="nx-card nx-kpi vx-only-desk-flex">
            <span className="nx-kpi-label">Cuenta más antigua</span>
            <span className="nx-kpi-value">
              {masAntigua ? (diasAntigua === 0 ? "Hoy" : `Hace ${diasAntigua} ${diasAntigua === 1 ? "día" : "días"}`) : "—"}
            </span>
            <span className="nx-kpi-foot nx-ellipsis">{masAntigua ? `${clienteTexto(masAntigua)} · ${masAntigua.folio}` : "Sin cuentas"}</span>
          </article>
        </section>

        <CuentasPorCobrar cuentas={cuentas} canceladas={canceladas} hoy={hoy} />
      </div>
    </>
  )
}
