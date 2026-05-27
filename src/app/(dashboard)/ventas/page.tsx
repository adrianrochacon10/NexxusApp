"use client"

import Link from "next/link"
import { Plus, ShoppingBag, TrendingUp } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { formatCurrency } from "@/lib/utils"
import { useStore } from "@/lib/store"

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
  const totalHoy    = ventasHoy.reduce((s, v) => s + v.total, 0)
  const unidadesHoy = ventasHoy.reduce((s, v) => s + v.lineas.reduce((a, l) => a + l.cantidad, 0), 0)

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
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total hoy</div>
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
          <Link href="/ventas/nueva" className="button button-primary">
            <Plus size={17} aria-hidden="true" />
            Nueva venta
          </Link>
        </section>

        <section style={{ display: "grid", gap: 28 }}>
          {fechas.map((fecha) => {
            const items     = porFecha[fecha]
            const totalFecha = items.reduce((s, v) => s + v.total, 0)

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
                    <article
                      key={venta.id}
                      className="surface elevated"
                      style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 16, alignItems: "center", padding: "14px 16px" }}
                    >
                      <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace", whiteSpace: "nowrap" }}>
                        {venta.hora}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{venta.folio}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {venta.lineas.map((l) => `${l.productoNombre} ×${l.cantidad}`).join(" · ")}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span className="badge" style={{ fontSize: 11 }}>{FORMA_PAGO_LABEL[venta.formaPago]}</span>
                        <span className="font-mono" style={{ fontSize: 15, color: "var(--success)" }}>
                          +{formatCurrency(venta.total)}
                        </span>
                      </div>
                    </article>
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
