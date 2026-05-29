import { AlertTriangle, ArrowRight, CheckCircle, Package, ShoppingCart, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/shared/Navbar"
import { KPICard } from "@/components/shared/KPICard"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { supabase, business } = await requireBusinessContext()

  const hoy       = new Date().toISOString().split("T")[0]
  const mesDesde  = hoy.slice(0, 7) + "-01"

  const [
    { data: ventasHoyData },
    { data: transacciones },
    { data: bajoStockData },
    { data: ventasRecientesData },
    { data: masVendidosData },
  ] = await Promise.all([
    supabase
      .from("ventas")
      .select("total, monto_pagado, estatus")
      .eq("business_id", business.id)
      .eq("fecha", hoy),
    supabase
      .from("transacciones")
      .select("id, tipo, monto, concepto, fecha, forma_pago, categorias:categoria_id(nombre)")
      .eq("business_id", business.id)
      .gte("fecha", mesDesde),
    supabase
      .from("productos")
      .select("id, nombre, stock, stock_minimo")
      .eq("business_id", business.id)
      .filter("stock", "lte", "stock_minimo"),
    supabase
      .from("ventas")
      .select("id, folio, hora, total, venta_lineas(producto_nombre, cantidad)")
      .eq("business_id", business.id)
      .eq("estatus", "activa")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("venta_lineas")
      .select("producto_id, producto_nombre, cantidad")
      .eq("business_id", business.id),
  ])

  const totalHoy   = (ventasHoyData ?? []).filter((v) => v.estatus === "activa").reduce((s, v) => s + v.monto_pagado, 0)
  const ingresos   = (transacciones ?? []).filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.monto, 0)
  const gastos     = (transacciones ?? []).filter((t) => t.tipo === "gasto").reduce((s, t) => s + t.monto, 0)
  const bajoStock  = bajoStockData ?? []

  // Top productos más vendidos
  const conteo: Record<string, { nombre: string; unidades: number }> = {}
  for (const linea of masVendidosData ?? []) {
    if (!conteo[linea.producto_id]) conteo[linea.producto_id] = { nombre: linea.producto_nombre, unidades: 0 }
    conteo[linea.producto_id].unidades += linea.cantidad
  }
  const masVendidos = Object.entries(conteo).sort(([, a], [, b]) => b.unidades - a.unidades).slice(0, 3)

  const ultimasTrx = (transacciones ?? []).slice(0, 5)

  return (
    <>
      <Navbar title="Dashboard" subtitle="Pulso operativo y financiero de tu negocio." />
      <div className="page" style={{ display: "grid", gap: 20 }}>

        {bajoStock.length > 0 && (
          <div role="alert" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(155,122,74,0.35)", background: "rgba(155,122,74,0.08)" }}>
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
          <KPICard label="Ventas hoy"   value={totalHoy}          tone="gold"    />
          <KPICard label="Ingresos mes" value={ingresos}          tone="success" />
          <KPICard label="Gastos mes"   value={gastos}            tone="error"   />
          <KPICard label="Balance neto" value={ingresos - gastos} tone="info"    highlighted />
        </section>

        <section className="dashboard-grid">
          {/* Stock bajo */}
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
                  <Link key={p.id} href={`/inventario/${p.id}`} className="surface elevated" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 6 }}>
                    <AlertTriangle size={15} color="var(--warning)" aria-hidden="true" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{p.stock} disponibles · mín. {p.stock_minimo}</div>
                    </div>
                    <ArrowRight size={13} color="var(--text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            )}
          </article>

          {/* Más vendidos */}
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
            {masVendidos.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Aún no hay ventas registradas.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {masVendidos.map(([id, data], i) => (
                  <Link key={id} href={`/inventario/${id}`} className="surface elevated" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 6 }}>
                    <span className="font-mono" style={{ fontSize: 11, color: "var(--text-tertiary)", width: 16, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.nombre}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{data.unidades} unidades vendidas</div>
                    </div>
                    <ArrowRight size={13} color="var(--text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            )}
          </article>
        </section>

        {/* Ventas recientes */}
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
          {(ventasRecientesData ?? []).length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Aún no hay ventas. ¡Registra la primera!</p>
          ) : (
            <div style={{ display: "grid" }}>
              {(ventasRecientesData ?? []).map((venta) => (
                <div key={venta.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains), monospace", whiteSpace: "nowrap" }}>{venta.hora}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{venta.folio}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(venta.venta_lineas as { producto_nombre: string; cantidad: number }[]).map((l) => `${l.producto_nombre} ×${l.cantidad}`).join(" · ")}
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: 14, color: "var(--success)", flexShrink: 0 }}>+{formatCurrency(venta.total)}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/ventas/nueva" className="button button-primary" style={{ width: "100%", marginTop: 16 }}>
            <ShoppingCart size={16} aria-hidden="true" />
            Nueva venta
          </Link>
        </article>

        {/* Últimas transacciones */}
        {ultimasTrx.length > 0 && (
          <article className="surface" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Últimas transacciones</h2>
              <Link href="/finanzas" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-secondary)" }}>
                Ver finanzas <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div style={{ display: "grid" }}>
              {ultimasTrx.map((trx, i) => {
                const cat = Array.isArray(trx.categorias)
                  ? trx.categorias[0]
                  : (trx.categorias as { nombre: string } | null)
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 14, alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{new Date(trx.fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trx.concepto}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{cat?.nombre} · {trx.forma_pago}</div>
                    </div>
                    <span className="font-mono" style={{ fontSize: 14, color: trx.tipo === "gasto" ? "var(--error)" : "var(--success)", flexShrink: 0 }}>
                      {trx.tipo === "gasto" ? "−" : "+"}{formatCurrency(trx.monto)}
                    </span>
                  </div>
                )
              })}
            </div>
          </article>
        )}

      </div>
    </>
  )
}
