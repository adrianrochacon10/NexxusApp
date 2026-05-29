import Link from "next/link"
import { ArrowLeft, ArrowRight, DollarSign } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusPagoBadge } from "@/components/ventas/EstatusPagoBadge"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"
import { AbonoRapidoBtn } from "@/components/ventas/AbonoRapidoBtn"

export const dynamic = "force-dynamic"

export default async function PendientesPage() {
  const { supabase, business } = await requireBusinessContext()

  const { data: ventas } = await supabase
    .from("ventas")
    .select(`
      id, folio, fecha, total, monto_pagado, saldo_pendiente,
      estado_pago, cliente_nombre, cliente_telefono,
      venta_lineas (producto_nombre, variante_nombre, cantidad),
      venta_pagos (id)
    `)
    .eq("business_id", business.id)
    .eq("estatus", "activa")
    .neq("estado_pago", "pagada")
    .order("fecha", { ascending: false })

  const pendientes      = ventas ?? []
  const totalPendiente  = pendientes.reduce((s, v) => s + v.saldo_pendiente, 0)
  const totalCobrado    = pendientes.reduce((s, v) => s + v.monto_pagado, 0)

  return (
    <>
      <Navbar title="Cuentas por cobrar" subtitle="Ventas con saldo pendiente activas." />
      <div className="page" style={{ display: "grid", gap: 20 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/ventas" className="button" style={{ padding: "0 12px", flexShrink: 0 }} aria-label="Volver">
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <KpiCard label="Cuentas abiertas" value={String(pendientes.length)} mono={false} />
          <KpiCard label="Ya cobrado"       value={formatCurrency(totalCobrado)}   color="var(--success)" />
          <KpiCard label="Por cobrar"       value={formatCurrency(totalPendiente)} color="var(--warning)" highlight />
        </section>

        {pendientes.length === 0 ? (
          <div className="surface" style={{ padding: 40, textAlign: "center", display: "grid", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 20, color: "var(--success)" }}>✓</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Todo al día</p>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13 }}>No hay cuentas pendientes de pago.</p>
          </div>
        ) : (
          <section style={{ display: "grid", gap: 8 }}>
            {pendientes.map((venta) => {
              const porcentaje = venta.total > 0 ? (venta.monto_pagado / venta.total) * 100 : 0
              const resumen    = venta.venta_lineas.map((l: { producto_nombre: string; variante_nombre: string | null; cantidad: number }) =>
                `${l.producto_nombre}${l.variante_nombre ? ` (${l.variante_nombre})` : ""} ×${l.cantidad}`
              ).join(" · ")

              return (
                <article key={venta.id} className="surface elevated" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "16px 18px", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{venta.folio}</span>
                      <EstatusPagoBadge estatus={venta.estado_pago as "parcial" | "pendiente" | "pagada"} />
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{venta.fecha}</span>
                    </div>
                    {venta.cliente_nombre && (
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                        {venta.cliente_nombre}
                        {venta.cliente_telefono && <span style={{ color: "var(--text-tertiary)", marginLeft: 8 }}>{venta.cliente_telefono}</span>}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10 }}>
                      {resumen}
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ height: 5, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 999, width: `${porcentaje}%`, background: "var(--accent-gold)", transition: "width 400ms ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)" }}>
                        <span>Cobrado: <span style={{ color: "var(--success)", fontWeight: 500 }}>{formatCurrency(venta.monto_pagado)}</span></span>
                        <span>Pendiente: <span style={{ color: "var(--warning)", fontWeight: 500 }}>{formatCurrency(venta.saldo_pendiente)}</span></span>
                      </div>
                    </div>
                    {venta.venta_pagos.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-tertiary)" }}>
                        {venta.venta_pagos.length} abono{venta.venta_pagos.length > 1 ? "s" : ""} registrado{venta.venta_pagos.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <div style={{ textAlign: "right", marginBottom: 4 }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Total</div>
                      <div className="font-mono" style={{ fontSize: 17 }}>{formatCurrency(venta.total)}</div>
                    </div>
                    <AbonoRapidoBtn ventaId={venta.id} saldoPendiente={venta.saldo_pendiente} />
                    <Link href={`/ventas/${venta.id}`} className="button" style={{ fontSize: 12, padding: "0 10px", color: "var(--text-secondary)" }}>
                      Ver detalle <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </>
  )
}

function KpiCard({ label, value, color, mono = true, highlight = false }: { label: string; value: string; color?: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="surface" style={{ padding: "16px 18px", borderColor: highlight ? "rgba(201,168,76,0.35)" : undefined }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</div>
      <div className={mono ? "font-mono" : "font-display"} style={{ fontSize: mono ? 20 : 22, fontWeight: 500, color: color ?? "var(--text-primary)" }}>{value}</div>
    </div>
  )
}
