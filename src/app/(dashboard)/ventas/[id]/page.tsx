import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { VentaDetalleAcciones } from "@/components/ventas/VentaAcciones"
import { DetalleCancelada, DetalleCliente, DetalleCobro, DetalleNotas, DetallePagos, DetalleProductos } from "@/components/ventas/historial/VentaDetalle"
import { ESTADO_BADGE, estadoVisual, fechaRelativa, formaPagoLabel, horaCorta, hoyISO, toVentaVM, type VentaRow } from "@/components/ventas/historial/venta-data"
import { requireBusinessContext } from "@/server/business/business-context"
import "@/styles/ventas.css"

export const dynamic = "force-dynamic"

export default async function VentaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, business } = await requireBusinessContext()

  const [{ data: ventaRow }, { data: pagos }] = await Promise.all([
    supabase
      .from("ventas")
      .select(`
        id, folio, fecha, hora, total, monto_pagado, saldo_pendiente,
        forma_pago_inicial, estado_pago, estatus, cliente_nombre, cliente_telefono, notas,
        cancelada_at, motivo_cancelacion,
        venta_lineas (id, producto_nombre, variante_nombre, cantidad, precio_unitario, subtotal)
      `)
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("venta_pagos")
      .select("id, monto, forma_pago, notas, created_at")
      .eq("venta_id", id)
      .eq("business_id", business.id)
      .order("created_at"),
  ])

  if (!ventaRow) notFound()

  const venta = toVentaVM({ ...(ventaRow as unknown as VentaRow), venta_pagos: (pagos ?? []) as VentaRow["venta_pagos"] })
  const estado = estadoVisual(venta)
  const badge = ESTADO_BADGE[estado]

  return (
    <>
      <Navbar
        eyebrow={`Venta · ${fechaRelativa(venta.fecha, hoyISO())} · ${horaCorta(venta.hora)} · ${formaPagoLabel(venta.formaPagoInicial)}`}
        title={venta.folio}
        actions={
          <Link href="/ventas" className="nx-btn nx-btn-secondary">
            <ArrowLeft size={18} aria-hidden="true" />
            Ventas
          </Link>
        }
      />
      <div className="page vx-page">
        <div className="nx-row gap-8" style={{ flexWrap: "wrap" }}>
          <span className={`nx-badge ${badge.cls}`}>{badge.label}</span>
        </div>

        <DetalleCancelada venta={venta} />

        <div className="vx-detail-grid">
          <section className="nx-card vx-detail-card" aria-label="Productos y pagos">
            <DetalleProductos venta={venta} />
            <DetallePagos venta={venta} />
            <DetalleNotas venta={venta} />
          </section>

          <aside className="vx-detail-side">
            <section className="nx-card vx-detail-card" aria-label="Cliente y cobro">
              <DetalleCliente venta={venta} />
              <DetalleCobro venta={venta} />
            </section>
            <section className="nx-card vx-detail-card" aria-label="Acciones">
              <VentaDetalleAcciones venta={venta} />
            </section>
          </aside>
        </div>
      </div>
    </>
  )
}
