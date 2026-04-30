import { GraficaCategoria } from "@/components/finanzas/GraficaCategoria"
import { GraficaGastos } from "@/components/finanzas/GraficaGastos"
import { DataTable } from "@/components/shared/DataTable"
import { KPICard } from "@/components/shared/KPICard"
import { Navbar } from "@/components/shared/Navbar"
import { formatCurrency } from "@/lib/utils"
import { graficaMensual, transacciones } from "@/lib/demo-data"
import type { CategoriaReporte } from "@/types/finanzas.types"

export default function ReportesPage() {
  const gastos = transacciones.filter((item) => item.tipo === "gasto")
  const totalGastos = gastos.reduce((sum, item) => sum + item.monto, 0)
  const ingresos = transacciones.filter((item) => item.tipo === "ingreso").reduce((sum, item) => sum + item.monto, 0)
  const reporte: CategoriaReporte[] = gastos.map((item) => ({
    nombre: item.categoria.nombre,
    transacciones: 1,
    monto: item.monto,
    porcentaje: Math.round((item.monto / totalGastos) * 100),
    color: item.categoria.color ?? "#c9a84c",
  }))

  return (
    <>
      <Navbar title="Reportes" subtitle="Ganancia neta, gastos por categoria y evolucion del negocio." />
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <KPICard label="Ganancia neta" value={ingresos - totalGastos} trend={9} />
          <KPICard label="Ingresos" value={ingresos} trend={18} tone="success" />
          <KPICard label="Gastos" value={totalGastos} trend={-4} tone="error" />
        </section>
        <section className="report-grid">
          <article className="surface" style={{ padding: 18 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>Gastos por categoria</h2>
            <GraficaCategoria data={reporte} />
          </article>
          <article className="surface" style={{ padding: 18 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>Ultimos 6 meses</h2>
            <GraficaGastos data={graficaMensual} />
          </article>
        </section>
        <DataTable<CategoriaReporte>
          data={reporte}
          getRowKey={(row) => row.nombre}
          columns={[
            { key: "categoria", header: "Categoria", cell: (row) => row.nombre },
            { key: "trx", header: "Transacciones", cell: (row) => <span className="font-mono">{row.transacciones}</span> },
            { key: "monto", header: "Monto total", cell: (row) => <span className="font-mono">{formatCurrency(row.monto)}</span> },
            { key: "pct", header: "% del total", cell: (row) => <span className="font-mono">{row.porcentaje}%</span> },
          ]}
        />
      </div>
    </>
  )
}
