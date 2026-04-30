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
  const producto = productos.find((item) => item.id === id)
  if (!producto) notFound()

  const movimientos = movimientosStock.filter((movimiento) => movimiento.productoId === producto.id)

  return (
    <>
      <Navbar title={producto.nombre} subtitle="Detalle operativo, stock e historial de movimientos." />
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="surface product-detail-grid">
          {producto.imagenUrl ? (
            <Image src={producto.imagenUrl} alt={producto.nombre} width={280} height={280} style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <div style={{ aspectRatio: "1 / 1", borderRadius: 8, background: "var(--surface-3)" }} />
          )}
          <div>
            <EstatusBadge estatus={producto.estatus} />
            <h2 className="font-display" style={{ margin: "18px 0 8px", fontSize: 38, fontWeight: 500 }}>{producto.nombre}</h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: 620 }}>{producto.descripcion}</p>
            <div className="metric-grid">
              <Metric label="Stock actual" value={String(producto.stock)} />
              <Metric label="Stock minimo" value={String(producto.stockMinimo)} />
              <Metric label="Precio venta" value={formatCurrency(producto.precioVenta)} />
            </div>
          </div>
          <StockActualizador productoId={producto.id} />
        </section>
        <DataTable<MovimientoStock>
          data={movimientos}
          getRowKey={(row) => row.id}
          columns={[
            { key: "fecha", header: "Fecha", cell: (row) => formatDate(row.createdAt) },
            { key: "tipo", header: "Tipo", cell: (row) => <span className="badge">{row.tipo}</span> },
            { key: "cantidad", header: "Cantidad", cell: (row) => <span className="font-mono">{row.cantidad}</span> },
            { key: "antes", header: "Antes", cell: (row) => <span className="font-mono">{row.stockAntes}</span> },
            { key: "despues", header: "Despues", cell: (row) => <span className="font-mono">{row.stockDespues}</span> },
            { key: "notas", header: "Notas", cell: (row) => row.notas ?? "-" },
          ]}
        />
      </div>
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface elevated" style={{ padding: 14 }}>
      <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{label}</div>
      <div className="font-mono" style={{ marginTop: 8, fontSize: 22 }}>{value}</div>
    </div>
  )
}
