"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { PuntoGrafica } from "@/types/finanzas.types"
import { formatCurrency } from "@/lib/utils"

interface GraficaGastosProps {
  data: PuntoGrafica[]
}

export function GraficaGastos({ data }: GraficaGastosProps) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="nombre" stroke="#888888" tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" tickLine={false} axisLine={false} tickFormatter={(value: number) => `$${value / 1000}k`} />
          <Tooltip
            cursor={{ fill: "rgba(201,168,76,0.06)" }}
            contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Bar dataKey="ingresos" fill="#4a9b6f" radius={[4, 4, 0, 0]} />
          <Bar dataKey="gastos" fill="#c9a84c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
