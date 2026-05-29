import { GraficaCategoria } from "@/components/finanzas/GraficaCategoria"
import { DataTable } from "@/components/shared/DataTable"
import { KPICard } from "@/components/shared/KPICard"
import { Navbar } from "@/components/shared/Navbar"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"
import type { CategoriaReporte } from "@/types/finanzas.types"

export const dynamic = "force-dynamic"

export default async function ReportesPage() {
  const { supabase, business } = await requireBusinessContext()

  const mesDesde = new Date().toISOString().slice(0, 7) + "-01"

  const { data: transacciones } = await supabase
    .from("transacciones")
    .select("tipo, monto, categorias:categoria_id(nombre, color)")
    .eq("business_id", business.id)
    .gte("fecha", mesDesde)

  const todas      = transacciones ?? []
  const gastos     = todas.filter((t) => t.tipo === "gasto")
  const totalGastos = gastos.reduce((s, t) => s + t.monto, 0)
  const ingresos   = todas.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.monto, 0)

  // Agrupar gastos por categoría
  const porCategoria: Record<string, { nombre: string; color: string; monto: number; count: number }> = {}
  for (const g of gastos) {
    const cat = Array.isArray(g.categorias) ? g.categorias[0] : (g.categorias as { nombre: string; color: string | null } | null)
    const nombre = cat?.nombre ?? "Sin categoría"
    if (!porCategoria[nombre]) porCategoria[nombre] = { nombre, color: cat?.color ?? "#c9a84c", monto: 0, count: 0 }
    porCategoria[nombre].monto += g.monto
    porCategoria[nombre].count += 1
  }

  const reporte: CategoriaReporte[] = Object.values(porCategoria).map((c) => ({
    nombre:        c.nombre,
    transacciones: c.count,
    monto:         c.monto,
    porcentaje:    totalGastos > 0 ? Math.round((c.monto / totalGastos) * 100) : 0,
    color:         c.color,
  })).sort((a, b) => b.monto - a.monto)

  return (
    <>
      <Navbar title="Reportes" subtitle="Ganancia neta, gastos por categoría y evolución del negocio." />
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <KPICard label="Ganancia neta" value={ingresos - totalGastos} />
          <KPICard label="Ingresos"      value={ingresos}               tone="success" />
          <KPICard label="Gastos"        value={totalGastos}            tone="error"   />
        </section>

        {reporte.length === 0 ? (
          <div className="surface" style={{ padding: 32, textAlign: "center", color: "var(--text-secondary)" }}>
            No hay transacciones este mes para generar reportes.
          </div>
        ) : (
          <>
            <section className="report-grid">
              <article className="surface" style={{ padding: 18 }}>
                <h2 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>Gastos por categoría</h2>
                <GraficaCategoria data={reporte} />
              </article>
            </section>
            <DataTable<CategoriaReporte>
              data={reporte}
              getRowKey={(row) => row.nombre}
              columns={[
                { key: "categoria",  header: "Categoría",     cell: (row) => row.nombre },
                { key: "trx",        header: "Transacciones", cell: (row) => <span className="font-mono">{row.transacciones}</span> },
                { key: "monto",      header: "Monto total",   cell: (row) => <span className="font-mono">{formatCurrency(row.monto)}</span> },
                { key: "pct",        header: "% del total",   cell: (row) => <span className="font-mono">{row.porcentaje}%</span> },
              ]}
            />
          </>
        )}
      </div>
    </>
  )
}
