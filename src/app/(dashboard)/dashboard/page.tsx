import Link from "next/link"
import { AlertCircle, AlertTriangle, Info, LineChart, Plus, ShoppingBag } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { KPICard } from "@/components/shared/KPICard"
import { EstatusPagoBadge } from "@/components/ventas/EstatusPagoBadge"
import { RetryButton } from "@/components/dashboard/RetryButton"
import { formatCurrency, getInitials } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"
import type { EstatusPagoVenta } from "@/types/ventas.types"
import type { FormaPago } from "@/types/finanzas.types"
import "@/styles/dashboard.css"

export const dynamic = "force-dynamic"

const FORMA_PAGO: Record<FormaPago, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  adeudo: "Adeudo",
}

const STOCK_VISIBLE = 5

type LineaResumen = { producto_nombre: string; variante_nombre: string | null; cantidad: number }
type VentaReciente = {
  id: string
  folio: string
  hora: string | null
  monto_pagado: number
  saldo_pendiente: number
  estado_pago: EstatusPagoVenta
  forma_pago_inicial: FormaPago | null
  cliente_nombre: string | null
  venta_lineas: LineaResumen[] | null
}
type TrxReciente = {
  id: string
  tipo: "ingreso" | "gasto" | "transferencia"
  monto: number
  concepto: string
  fecha: string
  forma_pago: FormaPago | null
  venta_id: string | null
  categoria_id: string | null
  categorias: { nombre: string } | { nombre: string }[] | null
}
type LineaVendida = { producto_id: string; producto_nombre: string; cantidad: number }

/** Color de categoría estable: cat-1 queda para ventas automáticas. */
function colorCategoria(categoriaId: string | null, automatica: boolean) {
  if (automatica) return "var(--nx-cat-1)"
  if (!categoriaId) return "var(--nx-cat-6)"
  let h = 0
  for (const c of categoriaId) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `var(--nx-cat-${2 + (h % 5)})`
}

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`
}

export default async function DashboardPage() {
  const { supabase, business, user } = await requireBusinessContext()

  // Las ventas guardan `fecha` con la fecha UTC; se usa la misma referencia aquí.
  const ahora    = new Date()
  const hoy      = ahora.toISOString().split("T")[0]
  const ayer     = new Date(ahora.getTime() - 86_400_000).toISOString().split("T")[0]
  const mesDesde = hoy.slice(0, 7) + "-01"

  const mesNombre = new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" }).format(new Date(`${mesDesde}T12:00:00Z`))
  const mes       = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)
  const mesAnio   = `${mes} ${hoy.slice(0, 4)}`

  const nombre = user.nombre?.trim().split(/\s+/)[0] || user.email || "de nuevo"

  const [ventasHoyRes, trxMesRes, trxRecientesRes, productosRes, ventasRecientesRes, vendidosRes] = await Promise.all([
    supabase
      .from("ventas")
      .select("monto_pagado, estatus")
      .eq("business_id", business.id)
      .eq("fecha", hoy),
    supabase
      .from("transacciones")
      .select("tipo, monto")
      .eq("business_id", business.id)
      .gte("fecha", mesDesde),
    supabase
      .from("transacciones")
      .select("id, tipo, monto, concepto, fecha, forma_pago, venta_id, categoria_id, categorias:categoria_id(nombre)")
      .eq("business_id", business.id)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    // PostgREST no compara dos columnas entre sí: el filtro de stock bajo se hace en JS
    supabase
      .from("productos")
      .select("id, nombre, sku, stock, stock_minimo")
      .eq("business_id", business.id),
    supabase
      .from("ventas")
      .select("id, folio, hora, monto_pagado, saldo_pendiente, estado_pago, forma_pago_inicial, cliente_nombre, venta_lineas(producto_nombre, variante_nombre, cantidad)")
      .eq("business_id", business.id)
      .eq("estatus", "activa")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("venta_lineas")
      .select("producto_id, producto_nombre, cantidad, ventas!inner(fecha, estatus)")
      .eq("business_id", business.id)
      .eq("ventas.estatus", "activa")
      .gte("ventas.fecha", mesDesde),
  ])

  // ── KPIs ──────────────────────────────────────────────
  const kpiError      = Boolean(ventasHoyRes.error || trxMesRes.error)
  const ventasHoy     = (ventasHoyRes.data ?? []).filter((v) => v.estatus === "activa")
  const cobradoHoy    = ventasHoy.reduce((s, v) => s + Number(v.monto_pagado), 0)
  const trxMes        = trxMesRes.data ?? []
  const ingresosMes   = trxMes.filter((t) => t.tipo === "ingreso")
  const egresosMes    = trxMes.filter((t) => t.tipo === "gasto")
  const ingresos      = ingresosMes.reduce((s, t) => s + Number(t.monto), 0)
  const egresos       = egresosMes.reduce((s, t) => s + Number(t.monto), 0)

  // ── Stock ─────────────────────────────────────────────
  const productos     = productosRes.data ?? []
  const negocioNuevo  = !productosRes.error && productos.length === 0
  const bajos         = productos.filter((p) => p.stock > 0 && p.stock <= p.stock_minimo).sort((a, b) => a.stock - b.stock)
  const agotados      = productos.filter((p) => p.stock <= 0)
  const porReponer    = [...bajos, ...agotados]

  let alertaStock = ""
  if (bajos.length > 0 && agotados.length > 0) {
    alertaStock = `${plural(bajos.length, "producto", "productos")} con stock bajo y ${plural(agotados.length, "agotado", "agotados")}`
  } else if (bajos.length > 0) {
    alertaStock = `${plural(bajos.length, "producto", "productos")} con stock bajo`
  } else if (agotados.length > 0) {
    alertaStock = `${plural(agotados.length, "producto agotado", "productos agotados")}`
  }

  // ── Ventas / transacciones ────────────────────────────
  const ventasRecientes = (ventasRecientesRes.data ?? []) as unknown as VentaReciente[]
  const trxRecientes    = (trxRecientesRes.data ?? []) as unknown as TrxReciente[]

  // ── Más vendidos del mes ──────────────────────────────
  const conteo = new Map<string, { nombre: string; unidades: number }>()
  for (const l of (vendidosRes.data ?? []) as unknown as LineaVendida[]) {
    const actual = conteo.get(l.producto_id) ?? { nombre: l.producto_nombre, unidades: 0 }
    actual.unidades += Number(l.cantidad)
    conteo.set(l.producto_id, actual)
  }
  const masVendidos = [...conteo.entries()].sort(([, a], [, b]) => b.unidades - a.unidades).slice(0, 3)
  const maxUnidades = masVendidos[0]?.[1].unidades ?? 0

  function fechaRelativa(fecha: string) {
    if (fecha === hoy) return "Hoy"
    if (fecha === ayer) return "Ayer"
    return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${fecha}T12:00:00Z`))
  }

  return (
    <>
      <Navbar title={`Hola, ${nombre}`} />
      <div className="page dash">

        {/* ── Avisos ── */}
        {kpiError && (
          <div className="nx-alert is-bad dash-alert" role="alert">
            <AlertCircle size={24} aria-hidden="true" style={{ flex: "none" }} />
            <div className="grow">
              <div className="ttl">No pudimos actualizar los totales</div>
              <div className="txt">Revisa tu conexión e inténtalo de nuevo.</div>
            </div>
            <RetryButton />
          </div>
        )}

        {negocioNuevo ? (
          <div className="nx-alert is-info dash-alert">
            <Info size={24} aria-hidden="true" style={{ flex: "none" }} />
            <div className="grow">
              <div className="ttl">Empieza por tu inventario</div>
              <div className="txt">Agrega tus productos para poder vender.</div>
            </div>
            <Link href="/inventario/nuevo" className="nx-btn nx-btn-primary">
              <Plus size={18} aria-hidden="true" />
              Agregar producto
            </Link>
          </div>
        ) : (
          alertaStock && (
            <div className="nx-alert is-warn dash-alert" role="alert">
              <AlertTriangle size={24} aria-hidden="true" style={{ flex: "none" }} />
              <div className="grow">
                <div className="ttl">{alertaStock}</div>
                <div className="txt">Repón antes de que se acaben: los productos agotados no se pueden vender en el POS.</div>
              </div>
              <Link href="/inventario" className="nx-btn nx-btn-secondary">Ver inventario</Link>
            </div>
          )
        )}

        {/* ── KPIs ── */}
        <section className="dash-kpis" aria-label="Métricas clave">
          {kpiError ? (
            ["Ventas cobradas hoy", "Ingresos del mes", "Egresos del mes", "Balance del mes"].map((label) => (
              <article key={label} className="nx-card nx-kpi dash-kpi-na">
                <span className="nx-kpi-label">{label}</span>
                <span className="nx-kpi-value" aria-label="No disponible">—</span>
                <span className="nx-kpi-foot">No disponible</span>
              </article>
            ))
          ) : (
            <>
              <KPICard
                label="Ventas cobradas hoy"
                value={cobradoHoy}
                foot={ventasHoy.length > 0 ? plural(ventasHoy.length, "venta", "ventas") : "Sin ventas hoy"}
              />
              <KPICard label="Ingresos del mes" value={ingresos} foot={mesAnio} />
              <KPICard
                label="Egresos del mes"
                value={egresos}
                foot={egresosMes.length > 0 ? plural(egresosMes.length, "movimiento", "movimientos") : "Sin movimientos"}
              />
              <KPICard label="Balance del mes" value={ingresos - egresos} foot="Ingresos menos egresos" signed />
            </>
          )}
        </section>

        <div className="dash-cols">
          <div className="dash-col">
            {/* ── Últimas ventas ── */}
            <section className="nx-list dash-p-ventas" aria-labelledby="h-ventas">
              <div className="nx-panel-head">
                <h2 className="t-h2" id="h-ventas">Últimas ventas</h2>
                <Link href="/ventas/nueva" className="nx-btn nx-btn-primary nx-btn-sm" style={{ minHeight: 44 }}>
                  <Plus size={18} aria-hidden="true" />
                  Nueva venta
                </Link>
              </div>
              {ventasRecientesRes.error ? (
                <PanelError />
              ) : ventasRecientes.length === 0 ? (
                <div className="nx-empty dash-empty">
                  <div className="nx-empty-ic" aria-hidden="true"><ShoppingBag size={26} strokeWidth={1.8} /></div>
                  <div className="ttl">Aún no hay ventas</div>
                  <div className="txt">Tu primera venta aparecerá aquí.</div>
                  <Link href="/ventas/nueva" className="nx-btn nx-btn-primary">
                    <Plus size={18} aria-hidden="true" />
                    Nueva venta
                  </Link>
                </div>
              ) : (
                ventasRecientes.map((v) => {
                  const lineas = v.venta_lineas ?? []
                  const primera = lineas[0]
                  const titulo = primera
                    ? `${primera.producto_nombre}${primera.variante_nombre ? ` (${primera.variante_nombre})` : ""}${primera.cantidad > 1 ? ` × ${primera.cantidad}` : ""}${lineas.length > 1 ? ` + ${lineas.length - 1} más` : ""}`
                    : v.folio
                  const saldo = Number(v.saldo_pendiente)
                  const cierre = saldo > 0
                    ? `Saldo ${formatCurrency(saldo)}`
                    : v.forma_pago_inicial ? FORMA_PAGO[v.forma_pago_inicial] : null
                  return (
                    <Link key={v.id} href={`/ventas/${v.id}`} className="nx-li">
                      <div className="nx-avatar" aria-hidden="true">{getInitials(primera?.producto_nombre ?? v.folio)}</div>
                      <div className="grow">
                        <div className="nx-li-title">{titulo}</div>
                        <div className="nx-li-meta">
                          {v.hora && <span>{v.hora.slice(0, 5)}</span>}
                          <span className="dash-hide-sm">{v.hora ? " · " : ""}{v.folio}</span>
                          <span className="dash-hide-sm"> · {v.cliente_nombre || "Mostrador"}</span>
                          {cierre && <span> · {cierre}</span>}
                        </div>
                      </div>
                      <div className="nx-li-end">
                        <span className="nx-li-amt">{formatCurrency(Number(v.monto_pagado))}</span>
                        <EstatusPagoBadge estatus={v.estado_pago} />
                      </div>
                    </Link>
                  )
                })
              )}
            </section>

            {/* ── Últimas transacciones ── */}
            <section className="nx-list dash-p-txs" aria-labelledby="h-fin">
              <div className="nx-panel-head">
                <h2 className="t-h2" id="h-fin">Últimas transacciones</h2>
                <Link href="/finanzas" className="nx-link">Ver finanzas</Link>
              </div>
              {trxRecientesRes.error ? (
                <PanelError />
              ) : trxRecientes.length === 0 ? (
                <div className="dash-note">
                  <span className="t-small">Sin movimientos registrados todavía.</span>
                </div>
              ) : (
                trxRecientes.map((t) => {
                  const cat = Array.isArray(t.categorias) ? t.categorias[0] : t.categorias
                  const automatica = Boolean(t.venta_id)
                  const meta = [fechaRelativa(t.fecha), cat?.nombre, t.forma_pago ? FORMA_PAGO[t.forma_pago] : null].filter(Boolean).join(" · ")
                  const monto = formatCurrency(Number(t.monto))
                  return (
                    <div key={t.id} className="nx-li" style={{ minHeight: 64 }}>
                      <span className="nx-catdot" style={{ background: colorCategoria(t.categoria_id, automatica) }} aria-hidden="true" />
                      <div className="grow">
                        <div className="nx-li-title">{t.concepto}</div>
                        <div className="nx-li-meta nx-row gap-8">
                          <span className="nx-ellipsis">{meta}</span>
                          {automatica && <span className="nx-tag-auto" style={{ flex: "none" }}>Automática</span>}
                        </div>
                      </div>
                      <span className={`nx-li-amt ${t.tipo === "ingreso" ? "pos" : ""}`}>
                        {t.tipo === "ingreso" ? `+${monto}` : t.tipo === "gasto" ? `−${monto}` : monto}
                      </span>
                    </div>
                  )
                })
              )}
            </section>
          </div>

          <div className="dash-col">
            {/* ── Stock bajo ── */}
            <section className="nx-list dash-p-stock" aria-labelledby="h-stock">
              <div className="nx-panel-head">
                <h2 className="t-h2" id="h-stock">Stock bajo</h2>
                <Link href="/inventario" className="nx-link">
                  {porReponer.length > STOCK_VISIBLE ? `Ver todo (${porReponer.length})` : "Ver todo"}
                </Link>
              </div>
              {productosRes.error ? (
                <PanelError />
              ) : porReponer.length === 0 ? (
                <div className="dash-note">
                  <span className="nx-badge is-ok">Todo en orden</span>
                  <span className="t-small">{negocioNuevo ? "Aún no tienes productos registrados" : "Sin productos por reponer"}</span>
                </div>
              ) : (
                porReponer.slice(0, STOCK_VISIBLE).map((p) => {
                  const agotado = p.stock <= 0
                  return (
                    <Link key={p.id} href={`/inventario/${p.id}`} className={`nx-li ${agotado ? "" : "is-low"}`}>
                      <div className="nx-avatar" aria-hidden="true">{getInitials(p.nombre)}</div>
                      <div className="grow">
                        <div className="nx-li-title" style={agotado ? { color: "var(--nx-ink-3)" } : undefined}>{p.nombre}</div>
                        <div className="nx-li-meta">
                          Mínimo {p.stock_minimo}
                          {p.sku && <span className="dash-hide-sm"> · {p.sku}</span>}
                        </div>
                      </div>
                      <span className={`nx-badge ${agotado ? "is-bad" : "is-warn"}`}>
                        {agotado ? "Agotado" : p.stock === 1 ? "Queda 1" : `Quedan ${p.stock}`}
                      </span>
                    </Link>
                  )
                })
              )}
            </section>

            {/* ── Más vendidos ── */}
            <section className="nx-card dash-p-top" aria-labelledby="h-top">
              <div className="nx-panel-head">
                <h2 className="t-h2" id="h-top">Más vendidos</h2>
                <span className="t-small">{mes}<span className="dash-hide-sm"> · unidades</span></span>
              </div>
              {vendidosRes.error ? (
                <PanelError />
              ) : masVendidos.length === 0 ? (
                <div className="nx-empty dash-empty">
                  <div className="nx-empty-ic" aria-hidden="true"><LineChart size={26} strokeWidth={1.8} /></div>
                  <div className="ttl">Sin datos todavía</div>
                  <div className="txt">Aquí verás tus 3 productos estrella del mes.</div>
                </div>
              ) : (
                masVendidos.map(([id, p], i) => (
                  <Link key={id} href={`/inventario/${id}`} className="dash-top-row">
                    <span className="nx-rank" aria-label={`Lugar ${i + 1}`}>{i + 1}</span>
                    <div className="grow nx-col gap-8">
                      <div className="nx-row gap-12" style={{ justifyContent: "space-between" }}>
                        <span className="t-h3">{p.nombre}</span>
                        <span className="nx-num t-h3" style={{ flex: "none" }}>{p.unidades} uds</span>
                      </div>
                      <div className="nx-bar" aria-hidden="true">
                        <i style={{ width: `${maxUnidades > 0 ? Math.round((p.unidades / maxUnidades) * 100) : 0}%` }} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

function PanelError() {
  return (
    <div className="dash-note" role="status">
      <span className="nx-badge is-bad">No disponible</span>
      <span className="t-small">No pudimos cargar esta sección. Recarga la página para intentarlo de nuevo.</span>
    </div>
  )
}
