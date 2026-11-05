"use client"

import { useState } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { CategoriaReporte } from "@/types/finanzas.types"
import { formatCurrency } from "@/lib/utils"

interface GraficaCategoriaProps {
  data: CategoriaReporte[]
  /** Total de egresos del periodo */
  total: number
}

/** Dona de egresos por categoría con leyenda interactiva (la leyenda es la alternativa en texto). */
export function GraficaCategoria({ data, total }: GraficaCategoriaProps) {
  const [sel, setSel] = useState<string | null>(null)
  const elegida = sel ? data.find((d) => d.nombre === sel) ?? null : null
  const resumen = data.map((d) => `${d.nombre} ${d.porcentaje} %`).join(", ")

  return (
    <div className="fz-donut-wrap">
      <div className="fz-donut" role="img" aria-label={`Dona de egresos por categoría. Total ${formatCurrency(total)}. ${resumen}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="monto"
              nameKey="nombre"
              innerRadius="68%"
              outerRadius="96%"
              paddingAngle={data.length > 1 ? 1.5 : 0}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.nombre} fill={entry.color} fillOpacity={sel === null || sel === entry.nombre ? 1 : 0.25} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={{ color: "#fff" }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="fz-donut-center" aria-hidden="true">
          <span className="lbl">{elegida ? elegida.nombre : "Egresos"}</span>
          <span className="val nx-num">{formatCurrency(elegida ? elegida.monto : total)}</span>
        </div>
      </div>

      <div className="fz-legend">
        {data.map((c) => (
          <button
            key={c.nombre}
            type="button"
            className={`fz-seg-row${sel !== null && sel !== c.nombre ? " is-dim" : ""}`}
            aria-pressed={sel === c.nombre}
            onClick={() => setSel(sel === c.nombre ? null : c.nombre)}
          >
            <span className="nx-catdot" style={{ background: c.color }} aria-hidden="true" />
            <span className="grow">
              <span className="t-h3 nx-ellipsis" style={{ fontSize: 14, display: "block" }}>{c.nombre}</span>
              <span className="t-small">{c.transacciones} {c.transacciones === 1 ? "movimiento" : "movimientos"}</span>
            </span>
            <span className="nx-num t-small fz-legend-pct">{c.porcentaje.toFixed(1)} %</span>
            <b className="nx-num fz-legend-amt">{formatCurrency(c.monto)}</b>
          </button>
        ))}
      </div>
    </div>
  )
}

export const tooltipStyle: React.CSSProperties = {
  background: "var(--nx-ink)",
  border: 0,
  borderRadius: 10,
  padding: "8px 12px",
  color: "#fff",
  font: "600 13px/18px var(--nx-font)",
  fontVariantNumeric: "tabular-nums",
  boxShadow: "var(--nx-sh-pop)",
}
