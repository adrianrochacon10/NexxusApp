"use client"

import Link from "next/link"
import { AlertCircle, Plus, ShoppingBag, TrendingUp } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { formatCurrency } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { EstatusPagoBadge, EstatusOperativoBadge } from "@/components/ventas/EstatusPagoBadge"

const FORMA_PAGO_LABEL: Record<string, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", adeudo: "Adeudo",
}

function formatFechaRelativa(fecha: string) {
  const hoy  = new Date().toISOString().split("T")[0]
  const ayer = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  if (fecha === hoy)  return "Hoy"
  if (fecha === ayer) return "Ayer"
  return fecha
}

export default function VentasPage() {
  const ventas = useStore((s) => s.ventas)
  const hoy    = new Date().toISOString().split("T")[0]

  const ventasHoy   = ventas.filter((v) => v.fecha === hoy)
  const totalHoy    = ventasHoy.filter((v) => v.estatusOperativo === "activa").reduce((s, v) => s + v.montoPagado, 0)
  const unidadesHoy = ventasHoy.filter((v) => v.estatusOperativo === "activa").reduce((s, v) => s + v.lineas.reduce((a, l) => a + l.cantidad, 0), 0)
  const cuentasPendientes = ventas.filter((v) => v.estatusOperativo === "activa" && v.estatusPago !== "pagada").length

  const porFecha = ventas.reduce<Record<string, typeof ventas>>((acc, v) => {
    if (!acc[v.fecha]) acc[v.fecha] = []
    acc[v.fecha].push(v)
    return acc
  }, {})
  const fechas = Object.keys(porFecha).sort((a, b) => b.localeCompare(a))

  return (
    <>
      <Navbar title="Ventas" subtitle="Historial de ventas y acceso rápido al registro de nuevas operaciones." />
      <div className="page" style={{ display: "grid", gap: 20 }}>

        <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="surface" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <TrendingUp size={17} color="var(--accent-gold)" aria-hidden="true" />
              <div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Cobrado hoy</div>
                <div className="font-mono" style={{ fontSize: 19, marginTop: 2 }}>{formatCurrency(totalHoy)}</div>
              </div>
            </div>
            <div className="surface" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <ShoppingBag size={17} color="var(--text-secondary)" aria-hidden="true" />
              <div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Unidades hoy</div>
                <div className="font-mono" style={{ fontSize: 19, marginTop: 2 }}>{unidadesHoy}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {cuentasPendientes > 0 && (
              <Link href="/ventas/pendientes" className="button" style={{ position: "relative", color: "var(--warning)", borderColor: "rgba(155,122,74,0.35)" }}>
                <AlertCircle size={16} aria-hidden="true" />
                Cuentas por cobrar
                <span style={{
                  position: "absolute", top: -6, right: -6,
                  background: "var(--warning)", color: "#0a0a0a",
                  borderRadius: 999, fontSize: 10, fontWeight: 700,
                  minWidth: 18, height: 18, display: "grid", placeItems: "center", padding: "0 4px",
                }}>
                  {cuentasPendientes}
                </span>
              </Link>
            )}
            <Link href="/ventas/nueva" className="button button-primary">
              <Plus size={17} aria-hidden="true" />
              Nueva venta
            </Link>
          </div>
        </section>

        <section style={{ display: "grid", gap: 28 }}>
          {fechas.map((fecha) => {
            const items      = porFecha[fecha]
            const totalFecha = items
              .filter((v) => v.estatusOperativo === "activa")
              .reduce((s, v) => s + v.montoPagado, 0)

            return (
              <div key={fecha}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {formatFechaRelativa(fecha)}
                  </span>
                  <span className="font-mono" style={{ fontSize: 12, color: "var(--success)" }}>
                    +{formatCurrency(totalFecha)}
                  </span>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  {items.map((venta) => (
                    <Link
                      key={venta.id}
                      href={`/ventas/${venta.id}`}
                      className="surface elevated"
                      style={{
                        display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16,
                        alignItems: "center", padding: "14px 16px", textDecoration: "none",
                        opacity: venta.estatusOperativo === "cancelada" ? 0.55 : 1,
                      }}
                    >
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace", whiteSpace: "nowrap" }}>
                        {venta.hora}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                          {venta.folio}
                          <EstatusPagoBadge estatus={venta.estatusPago} />
                          {venta.estatusOperativo === "cancelada" && <EstatusOperativoBadge estatus="cancelada" />}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {venta.lineas.map((l) => `${l.productoNombre}${l.varianteNombre ? ` (${l.varianteNombre})` : ""} ×${l.cantidad}`).join(" · ")}
                        </div>
                        {venta.cliente && (
                          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
                            {venta.cliente.nombre}{venta.cliente.telefono ? ` · ${venta.cliente.telefono}` : ""}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <span className="badge" style={{ fontSize: 11 }}>{FORMA_PAGO_LABEL[venta.formaPago]}</span>
                        <span className="font-mono" style={{ fontSize: 15, color: venta.estatusOperativo === "cancelada" ? "var(--text-tertiary)" : "var(--success)" }}>
                          {venta.estatusOperativo === "cancelada" ? formatCurrency(venta.total) : `+${formatCurrency(venta.montoPagado)}`}
                        </span>
                        {venta.saldoPendiente > 0 && venta.estatusOperativo === "activa" && (
                          <span style={{ fontSize: 11, color: "var(--warning)" }}>
                            Saldo: {formatCurrency(venta.saldoPendiente)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </section>

      </div>
    </>
  )
}
