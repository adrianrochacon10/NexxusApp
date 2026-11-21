import Link from "next/link"
import { ChartPie } from "lucide-react"
import { GraficaCategoria } from "@/components/finanzas/GraficaCategoria"
import { GraficaGastos } from "@/components/finanzas/GraficaGastos"
import { FinanzasTabs } from "@/components/finanzas/FinanzasTabs"
import { EmptyState } from "@/components/shared/EmptyState"
import { Navbar } from "@/components/shared/Navbar"
import {
  SIN_CATEGORIA,
  mesCorto,
  montoConSigno,
  nombreMes,
  pct,
  rankingEgresos,
  resolverPeriodo,
  una,
} from "@/components/finanzas/finanzas-utils"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"
import type { CategoriaReporte, PuntoGrafica } from "@/types/finanzas.types"
import "@/styles/finanzas.css"

export const dynamic = "force-dynamic"

export default async function ReportesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params  = await searchParams
  const periodo = resolverPeriodo(params.mes)
  const { supabase, business } = await requireBusinessContext()

  const { data: transacciones } = await supabase
    .from("transacciones")
    .select("tipo, monto, fecha, categorias:categoria_id(nombre, color)")
    .eq("business_id", business.id)
    .gte("fecha", periodo.desde)
    .lt("fecha", periodo.hasta)

  const todas       = transacciones ?? []
  const gastos      = todas.filter((t) => t.tipo === "gasto")
  const totalGastos = gastos.reduce((s, t) => s + t.monto, 0)
  const ingresos    = todas.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.monto, 0)
  const neto        = ingresos - totalGastos

  // Egresos por categoría (top 5 + "Otros", colores --nx-cat-*)
  const { ranking, total } = rankingEgresos(
    gastos.map((g) => ({
      categoria: una(g.categorias as { nombre: string } | { nombre: string }[] | null)?.nombre ?? SIN_CATEGORIA,
      monto:     g.monto,
    })),
  )
  const reporte: CategoriaReporte[] = ranking.map((c) => ({
    nombre:        c.nombre,
    transacciones: c.count,
    monto:         c.monto,
    porcentaje:    total > 0 ? (c.monto / total) * 100 : 0,
    color:         c.color,
  }))

  // Semanas del mes: 1–7, 8–14, 15–21, 22–fin (hasta hoy si es el mes actual)
  const mc = mesCorto(periodo.mes)
  const diasMes = new Date(Date.UTC(Number(periodo.mes.slice(0, 4)), Number(periodo.mes.slice(5, 7)), 0)).getUTCDate()
  const semanas: (PuntoGrafica & { ini: number; fin: number })[] = []
  for (let ini = 1; ini <= periodo.ultimoDia; ini += 7) {
    const finNatural = ini + 6 >= 22 ? diasMes : ini + 6
    const fin = Math.min(finNatural, periodo.ultimoDia)
    const parcial = fin < finNatural
    semanas.push({ ini, fin, nombre: `${ini}–${fin} ${mc}${parcial ? "*" : ""}`, ingresos: 0, gastos: 0 })
    if (finNatural === diasMes) break
  }
  for (const t of todas) {
    const dia = Number(t.fecha.slice(8, 10))
    const s = semanas.find((w) => dia >= w.ini && dia <= w.fin) ?? semanas[semanas.length - 1]
    if (!s) continue
    if (t.tipo === "ingreso") s.ingresos += t.monto
    else if (t.tipo === "gasto") s.gastos += t.monto
  }
  const puntos: PuntoGrafica[] = semanas.map(({ nombre, ingresos, gastos }) => ({ nombre, ingresos, gastos }))

  // Periodos: mes actual y dos anteriores (más el elegido si es más antiguo)
  const actual = resolverPeriodo()
  const meses = [actual.mes, actual.anterior, resolverPeriodo(actual.anterior).anterior]
  if (!meses.includes(periodo.mes)) meses.push(periodo.mes)

  const top = ranking[0]

  return (
    <>
      <Navbar
        title="Reportes"
        eyebrow="Finanzas / Reportes"
        subtitle="Ganancia neta, egresos por categoría y evolución del mes."
        actions={
          <nav className="fz-periodos" aria-label="Periodo">
            {meses.map((m) => (
              <Link
                key={m}
                href={m === actual.mes ? "/finanzas/reportes" : `/finanzas/reportes?mes=${m}`}
                className={`nx-chip${m === periodo.mes ? " is-on" : ""}`}
                aria-current={m === periodo.mes ? "true" : undefined}
                scroll={false}
              >
                {nombreMes(m).split(" ")[0]}
              </Link>
            ))}
          </nav>
        }
      />
      <div className="page fz-page">
        <FinanzasTabs activa="reportes" mes={periodo.esActual ? undefined : periodo.mes} />

        <section className="fz-kpis" aria-label={`Resumen de ${periodo.nombre}`}>
          <article className="nx-card nx-kpi">
            <span className="nx-kpi-label">Ingresos</span>
            <span className="nx-kpi-value pos">{montoConSigno(ingresos)}</span>
            <span className="nx-kpi-foot">{periodo.esActual ? `Al ${periodo.ultimoDia} de ${periodo.nombre}` : `Mes completo · ${periodo.etiqueta}`}</span>
          </article>
          <article className="nx-card nx-kpi">
            <span className="nx-kpi-label">Egresos</span>
            <span className="nx-kpi-value">{totalGastos > 0 ? `−${formatCurrency(totalGastos)}` : formatCurrency(0)}</span>
            <span className="nx-kpi-foot">{top ? `${top.nombre} pesa ${pct(top.monto, total)}` : "Sin egresos registrados"}</span>
          </article>
          <article className="nx-card nx-kpi">
            <span className="nx-kpi-label">Ganancia neta</span>
            <span className={`nx-kpi-value${neto < 0 ? " neg" : ""}`}>{neto < 0 ? `−${formatCurrency(-neto)}` : formatCurrency(neto)}</span>
            <span className="nx-kpi-foot">{ingresos > 0 ? `Margen del ${pct(neto, ingresos)}` : "Sin ingresos en el periodo"}</span>
          </article>
        </section>

        {todas.length === 0 ? (
          <EmptyState
            icon={<ChartPie size={28} strokeWidth={1.8} />}
            title={`Sin movimientos en ${periodo.nombre}`}
            description="Cuando registres ventas, abonos o egresos verás aquí a dónde se va el dinero."
            actionHref="/finanzas/nueva"
            actionLabel="Nuevo movimiento"
          />
        ) : (
          <div className="fz-report-grid">
            <section className="nx-card fz-report-card" aria-labelledby="fz-h-cat">
              <div>
                <h2 className="t-h3" id="fz-h-cat">Egresos por categoría</h2>
                <div className="t-small">Dónde se fue el dinero en {periodo.nombre}</div>
              </div>
              {reporte.length === 0 ? (
                <p className="t-small" style={{ padding: "24px 0" }}>No hubo egresos en este periodo.</p>
              ) : (
                <GraficaCategoria data={reporte} total={total} />
              )}
            </section>

            <GraficaGastos data={puntos} periodo={periodo.nombre} />
          </div>
        )}
        {periodo.esActual && semanas.some((s) => s.nombre.endsWith("*")) && todas.length > 0 && (
          <p className="nx-hint">* Semana en curso, con datos hasta hoy.</p>
        )}
      </div>
    </>
  )
}
