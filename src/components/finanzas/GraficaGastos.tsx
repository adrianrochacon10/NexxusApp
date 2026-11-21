"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { PuntoGrafica } from "@/types/finanzas.types"
import { formatCurrency } from "@/lib/utils"
import { tooltipStyle } from "@/components/finanzas/GraficaCategoria"

const C_INGRESOS = "var(--nx-accent)"
const C_EGRESOS  = "var(--nx-cat-6)"

interface GraficaGastosProps {
  data: PuntoGrafica[]
  /** "octubre" */
  periodo: string
}

function eje(v: number) {
  if (v === 0) return "$0"
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toLocaleString("es-MX", { maximumFractionDigits: 1 })} mil`
  return `$${v}`
}

function balance(v: number) {
  return v < 0 ? `−${formatCurrency(-v)}` : formatCurrency(v)
}

/** Ingresos vs. egresos por semana: gráfica o tabla en escritorio, barras horizontales en móvil. */
export function GraficaGastos({ data, periodo }: GraficaGastosProps) {
  const [vista, setVista] = useState<"grafica" | "tabla">("grafica")
  const max = Math.max(1, ...data.flatMap((d) => [d.ingresos, d.gastos]))
  const resumen = data.map((d) => `${d.nombre}: ingresos ${formatCurrency(d.ingresos)}, egresos ${formatCurrency(d.gastos)}`).join("; ")

  return (
    <section className="nx-card fz-report-card" aria-labelledby="fz-h-sem">
      <div className="nx-row gap-12" style={{ flexWrap: "wrap" }}>
        <div className="grow">
          <h2 className="t-h3" id="fz-h-sem">Ingresos vs. egresos</h2>
          <div className="t-small">Por semana · {periodo}</div>
        </div>
        <div className="nx-seg fz-desk" style={{ width: 200 }} role="group" aria-label="Vista">
          <button type="button" className={vista === "grafica" ? "is-on" : undefined} aria-pressed={vista === "grafica"} onClick={() => setVista("grafica")}>Gráfica</button>
          <button type="button" className={vista === "tabla" ? "is-on" : undefined} aria-pressed={vista === "tabla"} onClick={() => setVista("tabla")}>Tabla</button>
        </div>
      </div>

      <div className="nx-row gap-16" aria-hidden="true">
        <span className="nx-row gap-8 t-small" style={{ color: "var(--nx-ink)" }}><span className="nx-catdot" style={{ background: C_INGRESOS, borderRadius: 3 }} />Ingresos</span>
        <span className="nx-row gap-8 t-small" style={{ color: "var(--nx-ink)" }}><span className="nx-catdot" style={{ background: C_EGRESOS, borderRadius: 3 }} />Egresos</span>
      </div>

      {/* escritorio */}
      <div className="fz-desk">
        {vista === "grafica" ? (
          <div className="fz-bars" role="img" aria-label={`Barras de ingresos y egresos por semana. ${resumen}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                <CartesianGrid stroke="var(--nx-line)" vertical={false} />
                <XAxis
                  dataKey="nombre"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--nx-ink-2)", fontSize: 12, fontWeight: 500, fontFamily: "var(--nx-font)" }}
                  dy={6}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={eje}
                  tick={{ fill: "var(--nx-ink-3)", fontSize: 11, fontWeight: 500, fontFamily: "var(--nx-font)" }}
                />
                <Tooltip
                  cursor={{ fill: "var(--nx-sunken)", opacity: 0.6 }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ fontWeight: 500, opacity: 0.8, marginBottom: 2 }}
                  itemStyle={{ color: "#fff", padding: 0 }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Bar dataKey="ingresos" name="Ingresos" fill={C_INGRESOS} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                <Bar dataKey="gastos" name="Egresos" fill={C_EGRESOS} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="nx-table-wrap" style={{ boxShadow: "none" }}>
            <table className="nx-table">
              <thead>
                <tr><th scope="col">Semana</th><th scope="col" className="r">Ingresos</th><th scope="col" className="r">Egresos</th><th scope="col" className="r">Balance</th></tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.nombre}>
                    <td>{d.nombre}</td>
                    <td className="r nx-num">{formatCurrency(d.ingresos)}</td>
                    <td className="r nx-num">{formatCurrency(d.gastos)}</td>
                    <td className="r nx-num"><b>{balance(d.ingresos - d.gastos)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* móvil */}
      <ul className="fz-mob fz-weeks">
        {data.map((d) => (
          <li key={d.nombre}>
            <div className="nx-row nx-num" style={{ justifyContent: "space-between" }}>
              <span className="t-small" style={{ color: "var(--nx-ink)" }}>{d.nombre}</span>
              <span className="t-small">Balance {balance(d.ingresos - d.gastos)}</span>
            </div>
            <div className="nx-row gap-8">
              <div className="fz-hbar" style={{ background: C_INGRESOS, width: `${(d.ingresos / max) * 70}%` }} aria-hidden="true" />
              <span className="t-small nx-num"><span className="fz-sr">Ingresos </span>{formatCurrency(d.ingresos)}</span>
            </div>
            <div className="nx-row gap-8">
              <div className="fz-hbar" style={{ background: C_EGRESOS, width: `${(d.gastos / max) * 70}%` }} aria-hidden="true" />
              <span className="t-small nx-num"><span className="fz-sr">Egresos </span>{formatCurrency(d.gastos)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
