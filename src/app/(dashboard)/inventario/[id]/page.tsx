import Image from "next/image"
import { notFound } from "next/navigation"
import { DataTable } from "@/components/shared/DataTable"
import { Navbar } from "@/components/shared/Navbar"
import { StockActualizador } from "@/components/inventario/StockActualizador"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { movimientosStock, productos } from "@/lib/demo-data"
import type { MovimientoStock } from "@/types/inventario.types"

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const producto = productos.find((p) => p.id === id)
  if (!producto) notFound()

  const movimientos = movimientosStock.filter((m) => m.productoId === producto.id)

  return (
    <>
      <Navbar title={producto.nombre} subtitle="Detalle operativo, atributos, stock e historial de movimientos." />
      <div className="page" style={{ display: "grid", gap: 18 }}>

        <section className="surface product-detail-grid">
          {producto.imagenUrl ? (
            <Image
              src={producto.imagenUrl}
              alt={producto.nombre}
              width={280}
              height={280}
              style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 8, objectFit: "cover" }}
            />
          ) : (
            <div style={{ aspectRatio: "1 / 1", borderRadius: 8, background: "var(--surface-3)" }} aria-hidden="true" />
          )}

          <div>
            <EstatusBadge estatus={producto.estatus} />
            <h2 className="font-display" style={{ margin: "16px 0 6px", fontSize: 36, fontWeight: 500 }}>
              {producto.nombre}
            </h2>
            {producto.descripcion && (
              <p style={{ color: "var(--text-secondary)", maxWidth: 540, margin: "0 0 16px" }}>{producto.descripcion}</p>
            )}

            <div className="metric-grid">
              <Metric label="Stock actual"  value={String(producto.stock)}           warn={producto.stock <= producto.stockMinimo} />
              <Metric label="Stock mínimo"  value={String(producto.stockMinimo)} />
              <Metric label="Precio venta"  value={formatCurrency(producto.precioVenta)} />
            </div>

            {producto.atributos && Object.keys(producto.atributos).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Atributos
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(producto.atributos).map(([k, v]) => (
                    <div key={k} style={{ border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "6px 12px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <StockActualizador productoId={producto.id} />
        </section>

        <DataTable<MovimientoStock>
          data={movimientos}
          getRowKey={(row) => row.id}
          columns={[
            { key: "fecha",    header: "Fecha",    cell: (row) => formatDate(row.createdAt) },
            { key: "tipo",     header: "Tipo",     cell: (row) => <span className="badge">{row.tipo}</span> },
            { key: "cantidad", header: "Cantidad", cell: (row) => <span className="font-mono">{row.cantidad}</span> },
            { key: "antes",    header: "Antes",    cell: (row) => <span className="font-mono">{row.stockAntes}</span> },
            { key: "despues",  header: "Después",  cell: (row) => <span className="font-mono">{row.stockDespues}</span> },
            { key: "notas",    header: "Notas",    cell: (row) => row.notas ?? "—" },
          ]}
        />
      </div>
    </>
  )
}

function Metric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="surface elevated" style={{ padding: 14 }}>
      <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{label}</div>
      <div className="font-mono" style={{ marginTop: 8, fontSize: 22, color: warn ? "var(--warning)" : undefined }}>{value}</div>
    </div>
  )
}
