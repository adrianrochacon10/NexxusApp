import Link from "next/link"
import { ChartPie, Plus, Wallet } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EmptyState } from "@/components/shared/EmptyState"
import { TransaccionRow } from "@/components/finanzas/TransaccionRow"
import { FinanzasToastProvider } from "@/components/finanzas/FinanzasToast"
import { FinanzasTabs } from "@/components/finanzas/FinanzasTabs"
import { SelectorMes } from "@/components/finanzas/SelectorMes"
import {
  COLOR_INGRESO,
  COLOR_TRANSFERENCIA,
  SIN_CATEGORIA,
  etiquetaDia,
  formaPagoLabel,
  horaMX,
  montoConSigno,
  pct,
  rankingEgresos,
  resolverPeriodo,
  una,
} from "@/components/finanzas/finanzas-utils"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"
import "@/styles/finanzas.css"

export const dynamic = "force-dynamic"

type Filtro = "todos" | "ingreso" | "gasto" | "transferencia"
const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos",         label: "Todos" },
  { id: "ingreso",       label: "Ingresos" },
  { id: "gasto",         label: "Egresos" },
  { id: "transferencia", label: "Transferencias" },
]

export default async function FinanzasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params  = await searchParams
  const periodo = resolverPeriodo(params.mes)
  const filtro  = (FILTROS.find((f) => f.id === params.tipo)?.id ?? "todos") as Filtro

  const { supabase, business } = await requireBusinessContext()

  const { data: transacciones } = await supabase
    .from("transacciones")
    .select(`
      id, fecha, concepto, monto, tipo, forma_pago, venta_id, origen, created_at,
      categorias:categoria_id (nombre, color),
      ventas:venta_id (folio, estatus)
    `)
    .eq("business_id", business.id)
    .gte("fecha", periodo.desde)
    .lt("fecha", periodo.hasta)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })

  const todas = (transacciones ?? []).map((t) => {
    const cat   = una(t.categorias as { nombre: string; color: string | null } | { nombre: string; color: string | null }[] | null)
    const venta = una(t.ventas as { folio: string; estatus: string } | { folio: string; estatus: string }[] | null)
    return { ...t, cat, venta }
  })

  const ingresosTrx = todas.filter((t) => t.tipo === "ingreso")
  const gastosTrx   = todas.filter((t) => t.tipo === "gasto")
  const ingresos    = ingresosTrx.reduce((s, t) => s + t.monto, 0)
  const gastos      = gastosTrx.reduce((s, t) => s + t.monto, 0)
  const balance     = ingresos - gastos
  const autoCount   = ingresosTrx.filter((t) => t.venta_id).length

  const { ranking, colorDe, total: totalEgresos } = rankingEgresos(
    gastosTrx.map((g) => ({ categoria: g.cat?.nombre ?? SIN_CATEGORIA, monto: g.monto })),
  )
  const maxCat = ranking[0]?.monto ?? 0

  // Flujo neto del mes por forma de pago (no hay saldos de cuenta en el modelo)
  const porForma = new Map<string, { entra: number; sale: number }>()
  for (const t of todas) {
    if (t.tipo === "transferencia") continue
    const k = t.forma_pago ?? "sin"
    const v = porForma.get(k) ?? { entra: 0, sale: 0 }
    if (t.tipo === "ingreso") v.entra += t.monto
    else v.sale += t.monto
    porForma.set(k, v)
  }
  const formas = [...porForma.entries()].sort((a, b) => (b[1].entra + b[1].sale) - (a[1].entra + a[1].sale))

  const visibles = filtro === "todos" ? todas : todas.filter((t) => t.tipo === filtro)
  const porFecha = new Map<string, typeof todas>()
  for (const t of todas) {
    if (!porFecha.has(t.fecha)) porFecha.set(t.fecha, [])
    porFecha.get(t.fecha)!.push(t)
  }
  const grupos = [...porFecha.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([fecha, items]) => ({
      fecha,
      neto:  items.reduce((s, t) => (t.tipo === "ingreso" ? s + t.monto : t.tipo === "gasto" ? s - t.monto : s), 0),
      items: filtro === "todos" ? items : items.filter((t) => t.tipo === filtro),
    }))
    .filter((g) => g.items.length > 0)

  const qMes = periodo.esActual ? "" : `mes=${periodo.mes}`
  const hrefFiltro = (id: Filtro) => {
    const qs = [qMes, id === "todos" ? "" : `tipo=${id}`].filter(Boolean).join("&")
    return `/finanzas${qs ? `?${qs}` : ""}`
  }

  return (
    <FinanzasToastProvider>
      <Navbar
        title="Finanzas"
        subtitle="Ingresos, egresos y balance de tu negocio."
        actions={
          <>
            <Link href={`/finanzas/reportes${qMes ? `?${qMes}` : ""}`} className="nx-btn nx-btn-secondary fz-desk">
              <ChartPie size={20} aria-hidden="true" />
              Ver reportes
            </Link>
            <Link href="/finanzas/nueva" className="nx-btn nx-btn-primary">
              <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
              Nuevo movimiento
            </Link>
          </>
        }
      />
      <div className="page fz-page">
        <FinanzasTabs activa="movimientos" mes={periodo.esActual ? undefined : periodo.mes} />

        <SelectorMes periodo={periodo} basePath="/finanzas" extra={filtro === "todos" ? undefined : `tipo=${filtro}`} />

        {/* KPIs · escritorio */}
        <section className="fz-kpis fz-kpis-desk" aria-label="Resumen del mes">
          <article className="nx-card nx-kpi">
            <span className="nx-kpi-label">Ingresos del mes</span>
            <span className="nx-kpi-value pos">{montoConSigno(ingresos)}</span>
            <span className="nx-kpi-foot">
              {autoCount > 0 ? `${autoCount} de ventas y abonos cobrados` : `${ingresosTrx.length} ${ingresosTrx.length === 1 ? "movimiento" : "movimientos"}`}
            </span>
          </article>
          <article className="nx-card nx-kpi">
            <span className="nx-kpi-label">Egresos del mes</span>
            <span className="nx-kpi-value">{gastos > 0 ? `−${formatCurrency(gastos)}` : formatCurrency(0)}</span>
            <span className="nx-kpi-foot">
              {ranking.length ? ranking.slice(0, 3).map((c) => c.nombre).join(", ") : "Sin egresos registrados"}
            </span>
          </article>
          <article className="nx-card nx-kpi">
            <span className="nx-kpi-label">Balance</span>
            <span className={`nx-kpi-value${balance < 0 ? " neg" : ""}`}>{balance < 0 ? `−${formatCurrency(-balance)}` : formatCurrency(balance)}</span>
            <span className="nx-kpi-foot">{ingresos > 0 ? `Margen del ${pct(balance, ingresos)} sobre ingresos` : "Sin ingresos este mes"}</span>
          </article>
        </section>

        {/* Resumen · móvil */}
        <section className="nx-card fz-balance" aria-label="Resumen del mes">
          <div className="t-small">Balance del mes</div>
          <div className={`fz-balance-value nx-num${balance < 0 ? " neg" : ""}`}>{balance < 0 ? `−${formatCurrency(-balance)}` : formatCurrency(balance)}</div>
          <div className="fz-balance-split nx-num">
            <span className="t-small">Ingresos <b className="pos">{montoConSigno(ingresos)}</b></span>
            <span className="t-small">Egresos <b style={{ color: "var(--nx-ink)" }}>{gastos > 0 ? `−${formatCurrency(gastos)}` : formatCurrency(0)}</b></span>
          </div>
        </section>

        <nav className="fz-filtros" aria-label="Tipo de movimiento">
          {FILTROS.map((f) => (
            <Link
              key={f.id}
              href={hrefFiltro(f.id)}
              className={`nx-chip${filtro === f.id ? " is-on" : ""}`}
              aria-current={filtro === f.id ? "true" : undefined}
              scroll={false}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <div className="fz-cols">
          <div className="fz-main">
            {todas.length === 0 ? (
              <EmptyState
                icon={<Wallet size={28} strokeWidth={1.8} />}
                title={periodo.esActual ? "Aún no hay movimientos este mes" : `Sin movimientos en ${periodo.nombre}`}
                description="Las ventas y abonos se registran solos; aquí captura renta, compras, nómina y el resto."
                actionHref="/finanzas/nueva"
                actionLabel="Nuevo movimiento"
              />
            ) : visibles.length === 0 ? (
              <EmptyState
                icon={<Wallet size={28} strokeWidth={1.8} />}
                title="Sin movimientos de este tipo"
                description="Registra un ingreso, egreso o transferencia para verlo aquí."
                action={<Link href={hrefFiltro("todos")} className="nx-btn nx-btn-secondary">Ver todos</Link>}
              />
            ) : (
              <div className="nx-list fz-list">
                {grupos.map((g) => (
                  <section key={g.fecha} aria-label={etiquetaDia(g.fecha, periodo.hoy)}>
                    <div className="nx-group">
                      <span>{etiquetaDia(g.fecha, periodo.hoy)}</span>
                      <span className="nx-num fz-net" style={{ color: g.neto > 0 ? "var(--nx-ok-fg)" : "var(--nx-ink-2)" }}>
                        <span className="fz-desk-inline">Neto del día </span>
                        <span className="fz-mob-inline">Neto </span>
                        {montoConSigno(g.neto)}
                      </span>
                    </div>
                    {g.items.map((trx) => (
                      <TransaccionRow
                        key={trx.id}
                        trx={{
                          id:         trx.id,
                          concepto:   trx.concepto,
                          monto:      trx.monto,
                          tipo:       trx.tipo as "ingreso" | "gasto" | "transferencia",
                          forma_pago: trx.forma_pago,
                          venta_id:   trx.venta_id,
                          ventaFolio: trx.venta?.folio ?? null,
                          categoria:  trx.cat ?? null,
                          hora:       horaMX(trx.created_at),
                          cancelada:  trx.venta?.estatus === "cancelada" && trx.origen !== "devolucion",
                          color:
                            trx.tipo === "ingreso"       ? COLOR_INGRESO
                            : trx.tipo === "transferencia" ? COLOR_TRANSFERENCIA
                            : colorDe.get(trx.cat?.nombre ?? SIN_CATEGORIA),
                        }}
                      />
                    ))}
                  </section>
                ))}
              </div>
            )}
          </div>

          <aside className="fz-aside" aria-label="Resumen lateral">
            <section className="nx-card fz-side-card" aria-labelledby="fz-formas">
              <div>
                <h2 className="t-h3" id="fz-formas">Por forma de pago</h2>
                <div className="t-small">Flujo neto del mes</div>
              </div>
              {formas.length === 0 ? (
                <p className="t-small">Sin movimientos.</p>
              ) : (
                formas.map(([forma, v]) => (
                  <div key={forma} className="nx-row gap-12">
                    <div className="grow">
                      <div className="t-h3" style={{ fontSize: 14 }}>{forma === "sin" ? "Sin forma de pago" : formaPagoLabel(forma)}</div>
                      <div className="t-small nx-num">Entra {formatCurrency(v.entra)} · sale {formatCurrency(v.sale)}</div>
                    </div>
                    <b className="nx-num">{montoConSigno(v.entra - v.sale)}</b>
                  </div>
                ))
              )}
            </section>

            <section className="nx-card fz-side-card" aria-labelledby="fz-cats">
              <h2 className="t-h3" id="fz-cats">Egresos por categoría</h2>
              {ranking.length === 0 ? (
                <p className="t-small">Sin egresos este mes.</p>
              ) : (
                <ul className="fz-catbars">
                  {ranking.map((c) => (
                    <li key={c.nombre}>
                      <div className="nx-row gap-8">
                        <span className="nx-catdot" style={{ background: c.color }} aria-hidden="true" />
                        <span className="t-small grow" style={{ color: "var(--nx-ink)" }}>{c.nombre}</span>
                        <span className="t-small nx-num">{pct(c.monto, totalEgresos)}</span>
                      </div>
                      <div className="nx-bar" aria-hidden="true">
                        <i style={{ width: `${maxCat > 0 ? Math.max(2, Math.round((c.monto / maxCat) * 100)) : 0}%`, background: c.color }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link href={`/finanzas/reportes${qMes ? `?${qMes}` : ""}`} className="nx-link">Ver reportes completos</Link>
            </section>
          </aside>
        </div>
      </div>
    </FinanzasToastProvider>
  )
}
