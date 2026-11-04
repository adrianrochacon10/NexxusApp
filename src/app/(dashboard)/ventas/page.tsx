import Link from "next/link"
import { Plus, Receipt } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"
import { VentasHistorial } from "@/components/ventas/historial/VentasHistorial"
import { hoyISO, toVentaVM, type VentaRow } from "@/components/ventas/historial/venta-data"
import "@/styles/ventas.css"

export const dynamic = "force-dynamic"

export default async function VentasPage() {
  const { supabase, business } = await requireBusinessContext()

  const { data } = await supabase
    .from("ventas")
    .select(`
      id, folio, fecha, hora, total, monto_pagado, saldo_pendiente,
      forma_pago_inicial, estado_pago, estatus, cliente_nombre, cliente_telefono, notas,
      motivo_cancelacion,
      venta_lineas (id, producto_nombre, variante_nombre, cantidad, precio_unitario, subtotal),
      venta_pagos (id, monto, forma_pago, notas, created_at)
    `)
    .eq("business_id", business.id)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })

  const ventas = ((data ?? []) as unknown as VentaRow[]).map(toVentaVM)
  const hoy = hoyISO()

  const activasHoy  = ventas.filter((v) => v.fecha === hoy && v.estatus === "activa")
  const cobradoHoy  = activasHoy.reduce((s, v) => s + v.montoPagado, 0)
  const unidadesHoy = activasHoy.reduce((s, v) => s + v.lineas.reduce((a, l) => a + l.cantidad, 0), 0)
  const pendientes  = ventas.filter((v) => v.estatus === "activa" && v.estadoPago !== "pagada")
  const porCobrar   = pendientes.reduce((s, v) => s + v.saldo, 0)

  const nuevaVenta = (
    <Link href="/ventas/nueva" className="nx-btn nx-btn-primary">
      <Plus size={20} aria-hidden="true" />
      Nueva venta
    </Link>
  )

  return (
    <>
      <Navbar title="Ventas" actions={nuevaVenta} />
      <div className="page vx-page">
        {ventas.length === 0 ? (
          <EmptyState
            icon={<Receipt size={28} strokeWidth={1.8} />}
            title="Aún no hay ventas"
            description="Cuando registres tu primera venta aparecerá aquí, agrupada por día."
            actionHref="/ventas/nueva"
            actionLabel="Registrar venta"
          />
        ) : (
          <>
            {/* KPIs escritorio */}
            <section className="vx-kpis vx-only-desk" aria-label="Resumen de hoy">
              <article className="nx-card nx-kpi">
                <span className="nx-kpi-label">Cobrado hoy</span>
                <span className="nx-kpi-value">{formatCurrency(cobradoHoy)}</span>
                <span className="nx-kpi-foot">{activasHoy.length} {activasHoy.length === 1 ? "venta" : "ventas"}</span>
              </article>
              <article className="nx-card nx-kpi">
                <span className="nx-kpi-label">Unidades vendidas hoy</span>
                <span className="nx-kpi-value">{unidadesHoy}</span>
                <span className="nx-kpi-foot">Sin contar canceladas</span>
              </article>
              <Link href="/ventas/pendientes" className="nx-card nx-kpi vx-kpi-link" aria-label={`Cuentas pendientes: ${pendientes.length}, ${formatCurrency(porCobrar)} por cobrar. Ver cuentas por cobrar`}>
                <span className="nx-kpi-label">Cuentas pendientes</span>
                <span className="nx-kpi-value">{pendientes.length}</span>
                <span className="nx-kpi-foot">{formatCurrency(porCobrar)} por cobrar</span>
              </Link>
            </section>

            {/* KPIs móvil */}
            <section className="vx-kpis-mob vx-only-mob" aria-label="Resumen de hoy">
              <div className="nx-card" style={{ padding: "12px 14px" }}>
                <div className="t-small">Cobrado hoy</div>
                <div className="nx-num t-h2">{formatCurrency(cobradoHoy)}</div>
              </div>
              <Link href="/ventas/pendientes" className="nx-card vx-kpi-link" style={{ padding: "12px 14px" }}>
                <div className="t-small">Por cobrar</div>
                <div className="nx-num t-h2" style={{ color: "var(--nx-warn-fg)" }}>{formatCurrency(porCobrar)}</div>
              </Link>
            </section>

            <VentasHistorial ventas={ventas} hoy={hoy} />
          </>
        )}
      </div>
    </>
  )
}
