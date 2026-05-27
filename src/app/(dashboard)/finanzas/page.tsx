"use client"

import Link from "next/link"
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { Transaccion } from "@/types/finanzas.types"

function agruparPorFecha(items: Transaccion[]) {
  return items.reduce<Record<string, Transaccion[]>>((acc, t) => {
    if (!acc[t.fecha]) acc[t.fecha] = []
    acc[t.fecha].push(t)
    return acc
  }, {})
}

export default function FinanzasPage() {
  const transacciones = useStore((s) => s.transacciones)
  const ingresos = transacciones.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.monto, 0)
  const gastos   = transacciones.filter((t) => t.tipo === "gasto").reduce((s, t) => s + t.monto, 0)
  const balance  = ingresos - gastos

  const porFecha = agruparPorFecha([...transacciones].sort((a, b) => b.fecha.localeCompare(a.fecha)))
  const fechas   = Object.keys(porFecha)

  return (
    <>
      <Navbar title="Finanzas" subtitle="Ingresos, gastos y balance general de tu negocio." />
      <div className="page" style={{ display: "grid", gap: 20 }}>

        {/* ── Resumen visual ────────────────────────────────────────────────── */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <div className="surface" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(74,155,111,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <TrendingUp size={18} color="var(--success)" aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Ingresos del mes</div>
              <div className="font-mono" style={{ fontSize: 20, marginTop: 4, color: "var(--success)" }}>{formatCurrency(ingresos)}</div>
            </div>
          </div>

          <div className="surface" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(155,74,74,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <TrendingDown size={18} color="var(--error)" aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Gastos del mes</div>
              <div className="font-mono" style={{ fontSize: 20, marginTop: 4, color: "var(--error)" }}>{formatCurrency(gastos)}</div>
            </div>
          </div>

          <div className="surface" style={{
            padding: 18, display: "flex", alignItems: "center", gap: 14,
            borderColor: "rgba(201,168,76,0.3)",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(201,168,76,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Wallet size={18} color="var(--accent-gold)" aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Balance neto</div>
              <div className="font-mono" style={{ fontSize: 20, marginTop: 4, color: balance >= 0 ? "var(--accent-gold)" : "var(--error)" }}>
                {formatCurrency(balance)}
              </div>
            </div>
          </div>
        </section>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <section className="toolbar">
          <div className="responsive-cluster">
            <select className="input" aria-label="Filtrar por tipo" style={{ width: 180 }}>
              <option value="">Todos los movimientos</option>
              <option value="ingreso">Solo ingresos</option>
              <option value="gasto">Solo gastos</option>
            </select>
            <select className="input" aria-label="Filtrar por forma de pago" style={{ width: 180 }}>
              <option value="">Todas las formas de pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="adeudo">Adeudo</option>
            </select>
          </div>
          <Link href="/finanzas/nueva" className="button button-primary">
            <Plus size={17} aria-hidden="true" />
            Registrar gasto
          </Link>
        </section>

        {/* ── Movimientos agrupados por fecha ──────────────────────────────── */}
        <section style={{ display: "grid", gap: 24 }}>
          {fechas.map((fecha) => {
            const items     = porFecha[fecha]
            const totalDia  = items.reduce((s, t) => t.tipo === "ingreso" ? s + t.monto : s - t.monto, 0)

            return (
              <div key={fecha}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {formatDate(fecha)}
                  </span>
                  <span className="font-mono" style={{ fontSize: 12, color: totalDia >= 0 ? "var(--success)" : "var(--error)" }}>
                    {totalDia >= 0 ? "+" : ""}{formatCurrency(totalDia)}
                  </span>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {items.map((trx) => (
                    <div
                      key={trx.id}
                      className="surface elevated"
                      style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", padding: "12px 16px" }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {trx.concepto}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              display: "inline-block", width: 7, height: 7, borderRadius: 999,
                              background: trx.categoria.color ?? "var(--surface-3)", flexShrink: 0,
                            }}
                            aria-hidden="true"
                          />
                          {trx.categoria.nombre}
                          <span style={{ color: "var(--text-tertiary)" }}>·</span>
                          {trx.formaPago}
                        </div>
                      </div>
                      <span
                        className="font-mono"
                        style={{ fontSize: 15, flexShrink: 0, color: trx.tipo === "gasto" ? "var(--error)" : "var(--success)" }}
                      >
                        {trx.tipo === "gasto" ? "−" : "+"}{formatCurrency(trx.monto)}
                      </span>
                    </div>
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
