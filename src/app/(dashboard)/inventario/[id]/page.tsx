import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Edit } from "lucide-react"
import { DataTable } from "@/components/shared/DataTable"
import { Navbar } from "@/components/shared/Navbar"
import { StockActualizador } from "@/components/inventario/StockActualizador"
import { VariantesStockInline } from "@/components/inventario/VariantesStockInline"
import { ProductoAcciones } from "@/components/inventario/ProductoAcciones"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, business } = await requireBusinessContext()

  const [{ data: producto }, { data: variantes }, { data: movimientos }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, descripcion, precio_venta, precio_costo, stock, stock_minimo, imagen_url, estatus, sku, atributos, categoria_id")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("producto_variantes")
      .select("id, nombre, sku, atributos, stock, stock_minimo, estatus")
      .eq("producto_id", id)
      .eq("business_id", business.id)
      .order("nombre"),
    supabase
      .from("movimientos_stock")
      .select("id, tipo, cantidad, stock_antes, stock_despues, notas, created_at")
      .eq("producto_id", id)
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  if (!producto) notFound()

  const tieneVariantes = (variantes?.length ?? 0) > 0

  return (
    <>
      <Navbar title={producto.nombre} subtitle="Detalle operativo, atributos, stock e historial de movimientos." />
      <div className="page" style={{ display: "grid", gap: 18 }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/inventario" className="button" style={{ padding: "0 14px" }}>
            <ArrowLeft size={16} aria-hidden="true" />
            Inventario
          </Link>
          <Link href={`/inventario/${id}/editar`} className="button">
            <Edit size={15} aria-hidden="true" />
            Editar producto
          </Link>
        </div>

        <section className="surface product-detail-grid">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              width={280}
              height={280}
              style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 8, objectFit: "cover" }}
            />
          ) : (
            <div style={{ aspectRatio: "1 / 1", borderRadius: 8, background: "var(--surface-3)" }} aria-hidden="true" />
          )}

          <div>
            <EstatusBadge estatus={producto.estatus as "disponible" | "pausado" | "agotado"} />
            <h2 className="font-display" style={{ margin: "16px 0 6px", fontSize: 36, fontWeight: 500 }}>
              {producto.nombre}
            </h2>
            {producto.descripcion && (
              <p style={{ color: "var(--text-secondary)", maxWidth: 540, margin: "0 0 16px" }}>{producto.descripcion}</p>
            )}

            <div className="metric-grid">
              <Metric label="Stock total"  value={String(producto.stock)}          warn={producto.stock <= producto.stock_minimo} />
              <Metric label="Stock mínimo" value={String(producto.stock_minimo)} />
              <Metric label="Precio venta" value={formatCurrency(producto.precio_venta)} />
            </div>

            {producto.atributos && Object.keys(producto.atributos as object).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Atributos
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(producto.atributos as Record<string, string>).map(([k, v]) => (
                    <div key={k} style={{ border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "6px 12px" }}>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
            {!tieneVariantes && <StockActualizador productoId={producto.id} />}
            <ProductoAcciones
              productoId={producto.id}
              estatusActual={producto.estatus as "disponible" | "pausado" | "agotado"}
            />
          </div>
        </section>

        {tieneVariantes && (
          <section className="surface" style={{ padding: 20, display: "grid", gap: 14 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Variantes</h2>
            <VariantesStockInline
              productoId={producto.id}
              variantes={variantes!.map((v) => ({
                id:           v.id,
                nombre:       v.nombre,
                sku:          v.sku,
                stock:        v.stock,
                stock_minimo: v.stock_minimo,
                estatus:      v.estatus,
              }))}
            />
          </section>
        )}

        <DataTable
          data={movimientos ?? []}
          getRowKey={(row) => row.id}
          columns={[
            { key: "fecha",    header: "Fecha",    cell: (row) => new Date(row.created_at).toLocaleDateString("es-MX") },
            { key: "tipo",     header: "Tipo",     cell: (row) => <span className="badge">{row.tipo}</span> },
            { key: "cantidad", header: "Cantidad", cell: (row) => <span className="font-mono">{row.cantidad}</span> },
            { key: "antes",    header: "Antes",    cell: (row) => <span className="font-mono">{row.stock_antes}</span> },
            { key: "despues",  header: "Después",  cell: (row) => <span className="font-mono">{row.stock_despues}</span> },
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
