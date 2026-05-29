import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, User } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusPagoBadge, EstatusOperativoBadge } from "@/components/ventas/EstatusPagoBadge"
import { AbonoForm, CancelarVentaForm } from "@/components/ventas/VentaAcciones"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function VentaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, business } = await requireBusinessContext()

  const [{ data: venta }, { data: pagos }] = await Promise.all([
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

  if (!venta) notFound()

  const cancelada = venta.estatus === "cancelada"
  const pagada    = venta.estado_pago === "pagada"
  const formaPago = venta.forma_pago_inicial ?? "adeudo"

  return (
    <>
      <Navbar title={venta.folio} subtitle="Detalle de venta, abonos y acciones." hideActions />
      <div className="page" style={{ display: "grid", gap: 18, maxWidth: 860 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/ventas" className="button" style={{ padding: "0 12px", flexShrink: 0 }} aria-label="Volver">
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <EstatusPagoBadge estatus={venta.estado_pago as "pagada" | "parcial" | "pendiente"} />
            <EstatusOperativoBadge estatus={venta.estatus as "activa" | "cancelada"} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{venta.fecha} · {venta.hora}</span>
          </div>
        </div>

        {cancelada && (
          <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(155,74,74,0.35)", background: "rgba(155,74,74,0.08)", color: "var(--error)", fontSize: 13 }}>
            <strong>Venta cancelada.</strong>{venta.motivo_cancelacion ? ` Motivo: ${venta.motivo_cancelacion}` : ""}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 14 }}>

            {/* Líneas */}
            <section className="surface" style={{ padding: 20, display: "grid", gap: 14 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Productos</h2>
              {venta.venta_lineas.map((linea) => (
                <div key={linea.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--border-subtle)" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {linea.producto_nombre}
                      {linea.variante_nombre && <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: 6 }}>— {linea.variante_nombre}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      {linea.cantidad} × {formatCurrency(linea.precio_unitario)}
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: 15 }}>{formatCurrency(linea.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                <span className="font-mono" style={{ fontSize: 20 }}>{formatCurrency(venta.total)}</span>
              </div>
            </section>

            {/* Pagos registrados */}
            {(pagos ?? []).length > 0 && (
              <section className="surface" style={{ padding: 20, display: "grid", gap: 10 }}>
                <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Pagos</h2>
                {pagos!.map((pago) => (
                  <div key={pago.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "monospace" }}>
                      {new Date(pago.created_at).toLocaleDateString("es-MX")}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{pago.forma_pago.charAt(0).toUpperCase() + pago.forma_pago.slice(1)}</div>
                      {pago.notas && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{pago.notas}</div>}
                    </div>
                    <span className="font-mono" style={{ fontSize: 15, color: "var(--success)" }}>+{formatCurrency(pago.monto)}</span>
                  </div>
                ))}
              </section>
            )}

            {/* Form de abono */}
            {!cancelada && !pagada && (
              <AbonoForm ventaId={venta.id} saldoPendiente={venta.saldo_pendiente} />
            )}
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {/* Resumen */}
            <section className="surface elevated" style={{ padding: 20, display: "grid", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>Resumen</h3>
              <Row label="Total"   value={formatCurrency(venta.total)} />
              <Row label="Cobrado" value={formatCurrency(venta.monto_pagado)} color="var(--success)" />
              {venta.saldo_pendiente > 0 && <Row label="Saldo" value={formatCurrency(venta.saldo_pendiente)} color="var(--warning)" />}
              <div style={{ height: 1, background: "var(--border-subtle)" }} />
              <Row label="Forma de pago" value={formaPago.charAt(0).toUpperCase() + formaPago.slice(1)} />
            </section>

            {/* Cliente */}
            {venta.cliente_nombre && (
              <section className="surface elevated" style={{ padding: 20, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <User size={14} color="var(--text-secondary)" aria-hidden="true" />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Cliente</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{venta.cliente_nombre}</div>
                {venta.cliente_telefono && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{venta.cliente_telefono}</div>}
              </section>
            )}

            {venta.notas && (
              <section className="surface elevated" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Notas</div>
                <p style={{ margin: 0, fontSize: 13 }}>{venta.notas}</p>
              </section>
            )}

            {!cancelada && <CancelarVentaForm ventaId={venta.id} />}
          </div>
        </div>
      </div>
    </>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
      <span className="font-mono" style={{ fontSize: 14, color: color ?? "var(--text-primary)" }}>{value}</span>
    </div>
  )
}
