"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, DollarSign } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusPagoBadge } from "@/components/ventas/EstatusPagoBadge"
import { AbonoModal } from "@/components/ventas/AbonoModal"
import { formatCurrency } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { Venta } from "@/types/ventas.types"

export default function PendientesPage() {
  const ventas = useStore((s) => s.ventas)
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null)

  const pendientes = ventas.filter(
    (v) => v.estatusOperativo === "activa" && v.estatusPago !== "pagada"
  )

  const totalPendiente = pendientes.reduce((s, v) => s + v.saldoPendiente, 0)
  const totalCobrado   = pendientes.reduce((s, v) => s + v.montoPagado,    0)

  return (
    <>
      <Navbar title="Cuentas por cobrar" subtitle="Ventas con saldo pendiente activas." />
      <div className="page" style={{ display: "grid", gap: 20 }}>

        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/ventas" className="button" style={{ padding: "0 12px", flexShrink: 0 }} aria-label="Volver">
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
        </div>

        {/* KPIs */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <KpiCard
            label="Cuentas abiertas"
            value={String(pendientes.length)}
            mono={false}
          />
          <KpiCard
            label="Ya cobrado"
            value={formatCurrency(totalCobrado)}
            color="var(--success)"
          />
          <KpiCard
            label="Por cobrar"
            value={formatCurrency(totalPendiente)}
            color="var(--warning)"
            highlight
          />
        </section>

        {/* Lista */}
        {pendientes.length === 0 ? (
          <div className="surface" style={{ padding: 40, textAlign: "center", display: "grid", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 20, color: "var(--success)" }}>✓</p>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Todo al día</p>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13 }}>No hay cuentas pendientes de pago.</p>
          </div>
        ) : (
          <section style={{ display: "grid", gap: 8 }}>
            {pendientes.map((venta) => {
              const porcentajeCobrado = venta.total > 0 ? (venta.montoPagado / venta.total) * 100 : 0

              return (
                <article
                  key={venta.id}
                  className="surface elevated"
                  style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "16px 18px", alignItems: "center" }}
                >
                  <div style={{ minWidth: 0 }}>

                    {/* Primera fila: folio + badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{venta.folio}</span>
                      <EstatusPagoBadge estatus={venta.estatusPago} />
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{venta.fecha}</span>
                    </div>

                    {/* Segunda fila: cliente + productos */}
                    {venta.cliente && (
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                        {venta.cliente.nombre}
                        {venta.cliente.telefono && (
                          <span style={{ color: "var(--text-tertiary)", marginLeft: 8 }}>{venta.cliente.telefono}</span>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 10 }}>
                      {venta.lineas.map((l) => `${l.productoNombre}${l.varianteNombre ? ` (${l.varianteNombre})` : ""} ×${l.cantidad}`).join(" · ")}
                    </div>

                    {/* Barra de progreso */}
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ height: 5, borderRadius: 999, background: "var(--surface-3)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 999,
                          width: `${porcentajeCobrado}%`,
                          background: porcentajeCobrado >= 100 ? "var(--success)" : "var(--accent-gold)",
                          transition: "width 400ms ease",
                        }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)" }}>
                        <span>Cobrado: <span style={{ color: "var(--success)", fontWeight: 500 }}>{formatCurrency(venta.montoPagado)}</span></span>
                        <span>Pendiente: <span style={{ color: "var(--warning)", fontWeight: 500 }}>{formatCurrency(venta.saldoPendiente)}</span></span>
                      </div>
                    </div>

                    {/* Abonos previos */}
                    {venta.abonos.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-tertiary)" }}>
                        {venta.abonos.length} abono{venta.abonos.length > 1 ? "s" : ""} registrado{venta.abonos.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <div style={{ textAlign: "right", marginBottom: 4 }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Total</div>
                      <div className="font-mono" style={{ fontSize: 17 }}>{formatCurrency(venta.total)}</div>
                    </div>
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => setVentaSeleccionada(venta)}
                      style={{ fontSize: 13, padding: "0 14px", whiteSpace: "nowrap" }}
                    >
                      <DollarSign size={14} aria-hidden="true" />
                      Abonar
                    </button>
                    <Link
                      href={`/ventas/${venta.id}`}
                      className="button"
                      style={{ fontSize: 12, padding: "0 10px", color: "var(--text-secondary)" }}
                    >
                      Ver detalle
                      <ArrowRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </section>
        )}

      </div>

      {/* Modal de abono */}
      {ventaSeleccionada && (
        <AbonoModal
          venta={ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
        />
      )}
    </>
  )
}

function KpiCard({ label, value, color, mono = true, highlight = false }: {
  label: string; value: string; color?: string; mono?: boolean; highlight?: boolean
}) {
  return (
    <div
      className="surface"
      style={{
        padding: "16px 18px",
        borderColor: highlight ? "rgba(201,168,76,0.35)" : undefined,
      }}
    >
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</div>
      <div
        className={mono ? "font-mono" : "font-display"}
        style={{ fontSize: mono ? 20 : 22, fontWeight: 500, color: color ?? "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  )
}
