import { AlertTriangle, ArrowRight, CheckCircle, Package, ShoppingCart, TrendingUp } from "lucide-react"
import Link from "next/link"
import { GraficaGastos } from "@/components/finanzas/GraficaGastos"
import { KPICard } from "@/components/shared/KPICard"
import { Navbar } from "@/components/shared/Navbar"
import { formatCurrency, formatDate } from "@/lib/utils"
import { graficaMensual, productos, transacciones, ventas } from "@/lib/demo-data"

const HOY = "2026-05-27"

export default function DashboardPage() {
  const ingresos   = transacciones.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.monto, 0)
  const gastos     = transacciones.filter((t) => t.tipo === "gasto").reduce((s, t) => s + t.monto, 0)
  const ventasHoy  = ventas.filter((v) => v.fecha === HOY)
  const totalHoy   = ventasHoy.reduce((s, v) => s + v.total, 0)
  const bajoStock  = productos.filter((p) => p.stock <= p.stockMinimo)

  const ventasRecientes = [...ventas]
    .sort((a, b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`))
    .slice(0, 3)

  const conteoProductos: Record<string, { nombre: string; unidades: number }> = {}
  for (const venta of ventas) {
    for (const linea of venta.lineas) {
      if (!conteoProductos[linea.productoId])
        conteoProductos[linea.productoId] = { nombre: linea.productoNombre, unidades: 0 }
      conteoProductos[linea.productoId].unidades += linea.cantidad
    }
  }
  const masVendidos = Object.entries(conteoProductos)
    .sort(([, a], [, b]) => b.unidades - a.unidades)
    .slice(0, 3)

  return (
    <>
      <Navbar title="Dashboard" subtitle="Pulso operativo y financiero de tu negocio." />
      <div className="page" style={{ display: "grid", gap: 20 }}>

        {bajoStock.length > 0 && (
          <div
            role="alert"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "12px 16px", borderRadius: 8,
              border: "1px solid rgba(155,122,74,0.35)", background: "rgba(155,122,74,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AlertTriangle size={17} color="var(--warning)" aria-hidden="true" />
              <span style={{ fontSize: 14, color: "var(--warning)" }}>
                <strong>{bajoStock.length} {bajoStock.length === 1 ? "producto" : "productos"}</strong> con stock bajo o agotado
              </span>
            </div>
            <Link href="/inventario" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--warning)", flexShrink: 0 }}>
              Ver inventario <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        )}

        <section className="kpi-grid" aria-label="Métricas clave">
          <KPICard label="Ventas hoy"   value={totalHoy}          trend={8}  tone="gold"    />
          <KPICard label="Ingresos mes" value={ingresos}          trend={14} tone="success" />
          <KPICard label="Gastos mes"   value={gastos}            trend={-3} tone="error"   />
          <KPICard label="Balance neto" value={ingresos - gastos} trend={22} tone="info" highlighted />
        </section>

        <section className="dashboard-grid">
          <article className="surface" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <h2 className="font-display" style={{ margin: 0, fontSize: 26, fontWeight: 500 }}>Evolución mensual</h2>
                <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>Ingresos y gastos — últimos 6 meses</p>
              </div>
              <Link href="/finanzas" className="button" aria-label="Ver finanzas" style={{ flexShrink: 0 }}>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <GraficaGastos data={graficaMensual} />
          </article>

          <article className="surface" style={{ padding: 20, display: "grid", alignContent: "start", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 26, fontWeight: 500 }}>Stock bajo</h2>
              <Package size={17} color="var(--text-secondary)" aria-hidden="true" />
            </div>
            {bajoStock.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--success)", fontSize: 13 }}>
                <CheckCircle size={16} aria-hidden="true" />
                Todo el inventario está saludable.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {bajoStock.map((p) => (
                  <Link key={p.id} href={`/inventario/${p.id}`} className="surface elevated"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 6 }}>
                    <AlertTriangle size={15} color="var(--warning)" aria-hidden="true" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{p.stock} disponibles · mín. {p.stockMinimo}</div>
                    </div>
                    <ArrowRight size={13} color="var(--text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            )}
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="surface" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShoppingCart size={17} color="var(--accent-gold)" aria-hidden="true" />
                <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Ventas recientes</h2>
              </div>
              <Link href="/ventas" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-secondary)" }}>
                Ver todas <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div style={{ display: "grid" }}>
              {ventasRecientes.map((venta) => (
                <div key={venta.id} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14,
                  alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)",
                }}>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace", whiteSpace: "nowrap" }}>
                    {venta.hora}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{venta.folio}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {venta.lineas.map((l) => `${l.productoNombre} ×${l.cantidad}`).join(" · ")}
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: 14, color: "var(--success)", flexShrink: 0 }}>
                    +{formatCurrency(venta.total)}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/ventas/nueva" className="button button-primary" style={{ width: "100%", marginTop: 16 }}>
              <ShoppingCart size={16} aria-hidden="true" />
              Nueva venta
            </Link>
          </article>

          <article className="surface" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <TrendingUp size={17} color="var(--text-secondary)" aria-hidden="true" />
                <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Más vendidos</h2>
              </div>
              <Link href="/inventario" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-secondary)" }}>
                Ver inventario <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {masVendidos.map(([id, data], i) => (
                <Link key={id} href={`/inventario/${id}`} className="surface elevated"
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 6 }}>
                  <span className="font-mono" style={{ fontSize: 11, color: "var(--text-tertiary)", width: 16, textAlign: "center", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.nombre}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{data.unidades} unidades vendidas</div>
                  </div>
                  <ArrowRight size={13} color="var(--text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </article>
        </section>

        <article className="surface" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Últimas transacciones</h2>
            <Link href="/finanzas" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-secondary)" }}>
              Ver finanzas <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <div style={{ display: "grid" }}>
            {transacciones.slice(0, 5).map((trx) => (
              <div key={trx.id} style={{
                display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 14,
                alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--border-subtle)",
              }}>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{formatDate(trx.fecha)}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trx.concepto}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{trx.categoria.nombre} · {trx.formaPago}</div>
                </div>
                <span className="font-mono" style={{ fontSize: 14, color: trx.tipo === "gasto" ? "var(--error)" : "var(--success)", flexShrink: 0 }}>
                  {trx.tipo === "gasto" ? "−" : "+"}{formatCurrency(trx.monto)}
                </span>
              </div>
            ))}
          </div>
        </article>

      </div>
    </>
  )
}
