import Link from "next/link"
import { Plus } from "lucide-react"
import { DataTable } from "@/components/shared/DataTable"
import { Navbar } from "@/components/shared/Navbar"
import { formatCurrency, formatDate } from "@/lib/utils"
import { transacciones } from "@/lib/demo-data"
import type { Transaccion } from "@/types/finanzas.types"

export default function FinanzasPage() {
  const ingresos = transacciones.filter((item) => item.tipo === "ingreso").reduce((sum, item) => sum + item.monto, 0)
  const gastos = transacciones.filter((item) => item.tipo === "gasto").reduce((sum, item) => sum + item.monto, 0)

  return (
    <>
      <Navbar title="Finanzas" subtitle="Transacciones, filtros y control de flujo de efectivo." />
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input className="input" type="date" aria-label="Fecha inicial" style={{ width: 170 }} />
            <select className="input" aria-label="Tipo de transaccion" style={{ width: 180 }}>
              <option>Todos</option>
              <option>Ingresos</option>
              <option>Gastos</option>
              <option>Transferencias</option>
            </select>
          </div>
          <Link href="/finanzas/nueva" className="button button-primary">
            <Plus size={17} aria-hidden="true" />
            Nueva transaccion
          </Link>
        </section>
        <DataTable<Transaccion>
          data={transacciones}
          getRowKey={(row) => row.id}
          columns={[
            { key: "fecha", header: "Fecha", cell: (row) => formatDate(row.fecha) },
            { key: "concepto", header: "Concepto", cell: (row) => row.concepto },
            { key: "categoria", header: "Categoria", cell: (row) => row.categoria.nombre },
            { key: "pago", header: "Forma pago", cell: (row) => row.formaPago },
            { key: "cantidad", header: "Cantidad", cell: (row) => <span className="font-mono">{row.cantidad}</span> },
            {
              key: "monto",
              header: "Monto",
              cell: (row) => (
                <span className="font-mono" style={{ color: row.tipo === "gasto" ? "var(--error)" : "var(--success)" }}>
                  {formatCurrency(row.monto)}
                </span>
              ),
            },
          ]}
        />
        <footer className="surface" style={{ display: "flex", justifyContent: "flex-end", gap: 20, padding: 16 }}>
          <span>Ingresos: <strong className="font-mono">{formatCurrency(ingresos)}</strong></span>
          <span>Gastos: <strong className="font-mono">{formatCurrency(gastos)}</strong></span>
          <span>Neto: <strong className="font-mono">{formatCurrency(ingresos - gastos)}</strong></span>
        </footer>
      </div>
    </>
  )
}
