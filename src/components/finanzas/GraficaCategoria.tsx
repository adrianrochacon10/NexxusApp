"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { CategoriaReporte } from "@/types/finanzas.types"
import { formatCurrency } from "@/lib/utils"

interface GraficaCategoriaProps {
  data: CategoriaReporte[]
}

export function GraficaCategoria({ data }: GraficaCategoriaProps) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="monto" nameKey="nombre" innerRadius={70} outerRadius={105} paddingAngle={3}>
            {data.map((entry) => (
              <Cell key={entry.nombre} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
            formatter={(value: number) => formatCurrency(value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
