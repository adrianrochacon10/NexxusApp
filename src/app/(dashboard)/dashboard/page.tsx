import { AlertTriangle, ArrowRight, PackageOpen } from "lucide-react"
import Link from "next/link"
import { GraficaGastos } from "@/components/finanzas/GraficaGastos"
import { KPICard } from "@/components/shared/KPICard"
import { Navbar } from "@/components/shared/Navbar"
import { DataTable } from "@/components/shared/DataTable"
import { formatCurrency, formatDate } from "@/lib/utils"
import { graficaMensual, productos, transacciones } from "@/lib/demo-data"
import type { Transaccion } from "@/types/finanzas.types"

export default function DashboardPage() {
  const ingresos = transacciones.filter((item) => item.tipo === "ingreso").reduce((sum, item) => sum + item.monto, 0)
  const gastos = transacciones.filter((item) => item.tipo === "gasto").reduce((sum, item) => sum + item.monto, 0)
  const bajoStock = productos.filter((producto) => producto.stock <= producto.stockMinimo)

  return (
    <>
      <Navbar title="Dashboard" subtitle="Pulso financiero e inventario critico de tu negocio." />
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="kpi-grid">
          <KPICard label="Saldo total" value={ingresos - gastos} trend={12} />
          <KPICard label="Ingresos mes" value={ingresos} trend={18} tone="success" />
          <KPICard label="Gastos mes" value={gastos} trend={-4} tone="error" />
          <KPICard label="Ganancia neta" value={ingresos - gastos} trend={9} tone="info" />
        </section>

        <section className="dashboard-grid">
          <article className="surface" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <div>
                <h2 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>Evolucion mensual</h2>
                <p style={{ margin: "5px 0 0", color: "var(--text-secondary)" }}>Ingresos y gastos de los ultimos 6 meses.</p>
              </div>
              <Link href="/finanzas/reportes" className="button" aria-label="Ver reportes">
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <GraficaGastos data={graficaMensual} />
          </article>

          <article className="surface" style={{ padding: 18 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>Stock bajo</h2>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {bajoStock.map((producto) => (
                <Link key={producto.id} href={`/inventario/${producto.id}`} className="surface elevated" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}>
                  <AlertTriangle size={18} color="var(--warning)" aria-hidden="true" />
                  <div style={{ minWidth: 0 }}>
                    <strong>{producto.nombre}</strong>
                    <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{producto.stock} disponibles / minimo {producto.stockMinimo}</div>
                  </div>
                </Link>
              ))}
              {bajoStock.length === 0 && (
                <div style={{ color: "var(--text-secondary)", display: "flex", gap: 10 }}>
                  <PackageOpen size={18} aria-hidden="true" />
                  Inventario saludable
                </div>
              )}
            </div>
          </article>
        </section>

        <DataTable<Transaccion>
          data={transacciones.slice(0, 5)}
          getRowKey={(row) => row.id}
          columns={[
            { key: "fecha", header: "Fecha", cell: (row) => formatDate(row.fecha) },
            { key: "concepto", header: "Concepto", cell: (row) => row.concepto },
            { key: "categoria", header: "Categoria", cell: (row) => row.categoria.nombre },
            { key: "tipo", header: "Tipo", cell: (row) => <span className="badge">{row.tipo}</span> },
            { key: "monto", header: "Monto", cell: (row) => <span className="font-mono">{formatCurrency(row.monto)}</span> },
          ]}
        />
      </div>
    </>
  )
}
