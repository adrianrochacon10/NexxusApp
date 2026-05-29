import Link from "next/link"
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function FinanzasPage() {
  const { supabase, business } = await requireBusinessContext()

  const mesActual = new Date().toISOString().slice(0, 7) // "2026-05"
  const desde     = `${mesActual}-01`

  const { data: transacciones } = await supabase
    .from("transacciones")
    .select(`
      id, fecha, concepto, monto, tipo, forma_pago,
      categorias:categoria_id (nombre, color)
    `)
    .eq("business_id", business.id)
    .gte("fecha", desde)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })

  const todas    = transacciones ?? []
  const ingresos = todas.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.monto, 0)
  const gastos   = todas.filter((t) => t.tipo === "gasto").reduce((s, t) => s + t.monto, 0)
  const balance  = ingresos - gastos

  const porFecha = todas.reduce<Record<string, typeof todas>>((acc, t) => {
    if (!acc[t.fecha]) acc[t.fecha] = []
    acc[t.fecha].push(t)
    return acc
  }, {})
  const fechas = Object.keys(porFecha).sort((a, b) => b.localeCompare(a))

  return (
    <>
      <Navbar title="Finanzas" subtitle="Ingresos, gastos y balance general de tu negocio." />
      <div className="page" style={{ display: "grid", gap: 20 }}>

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
          <div className="surface" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, borderColor: "rgba(201,168,76,0.3)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(201,168,76,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Wallet size={18} color="var(--accent-gold)" aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Balance neto</div>
              <div className="font-mono" style={{ fontSize: 20, marginTop: 4, color: balance >= 0 ? "var(--accent-gold)" : "var(--error)" }}>{formatCurrency(balance)}</div>
            </div>
          </div>
        </section>

        <section className="toolbar">
          <div />
          <Link href="/finanzas/nueva" className="button button-primary">
            <Plus size={17} aria-hidden="true" />
            Registrar gasto
          </Link>
        </section>

        {todas.length === 0 && (
          <div className="surface" style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
            No hay transacciones registradas este mes.
          </div>
        )}

        <section style={{ display: "grid", gap: 24 }}>
          {fechas.map((fecha) => {
            const items    = porFecha[fecha]
            const totalDia = items.reduce((s, t) => t.tipo === "ingreso" ? s + t.monto : s - t.monto, 0)
            return (
              <div key={fecha}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span className="font-mono" style={{ fontSize: 12, color: totalDia >= 0 ? "var(--success)" : "var(--error)" }}>
                    {totalDia >= 0 ? "+" : ""}{formatCurrency(totalDia)}
                  </span>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {items.map((trx) => {
                    const cat = Array.isArray(trx.categorias)
                      ? trx.categorias[0]
                      : (trx.categorias as { nombre: string; color: string | null } | null)
                    return (
                      <div key={trx.id} className="surface elevated" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", padding: "12px 16px" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trx.concepto}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                            {cat && (
                              <>
                                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 999, background: cat.color ?? "var(--surface-3)", flexShrink: 0 }} aria-hidden="true" />
                                {cat.nombre}
                                <span style={{ color: "var(--text-tertiary)" }}>·</span>
                              </>
                            )}
                            {trx.forma_pago}
                          </div>
                        </div>
                        <span className="font-mono" style={{ fontSize: 15, flexShrink: 0, color: trx.tipo === "gasto" ? "var(--error)" : "var(--success)" }}>
                          {trx.tipo === "gasto" ? "−" : "+"}{formatCurrency(trx.monto)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </>
  )
}
