import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Edit, PackagePlus, Plus } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"
import { formatCurrency } from "@/lib/utils"
import { categorias, productos } from "@/lib/demo-data"
import type { Producto } from "@/types/inventario.types"

export default function InventarioPage() {
  const categoriasProducto = categorias
    .filter((categoria) => categoria.tipo === "producto")
    .map((categoria) => ({
      categoria,
      productos: productos.filter((producto) => producto.categoria.id === categoria.id),
    }))

  return (
    <>
      <Navbar title="Inventario" subtitle="Categorias primero; productos organizados dentro de cada linea." />
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="toolbar">
          <div className="responsive-cluster">
            <input className="input" placeholder="Buscar producto, SKU o categoria" aria-label="Buscar producto" style={{ width: 320 }} />
            <select className="input" aria-label="Filtrar estatus" style={{ width: 170 }}>
              <option>Todos</option>
              <option>Disponible</option>
              <option>Pausado</option>
              <option>Agotado</option>
            </select>
          </div>
          <Link href="/inventario/nuevo" className="button button-primary">
            <Plus size={17} aria-hidden="true" />
            Nuevo producto
          </Link>
        </section>

        <section className="category-grid">
          {categoriasProducto.map(({ categoria, productos: productosCategoria }) => {
            const stockTotal = productosCategoria.reduce((sum, producto) => sum + producto.stock, 0)
            const inventarioTotal = productosCategoria.reduce((sum, producto) => sum + producto.precioVenta * producto.stock, 0)

            return (
              <article key={categoria.id} className="surface" style={{ display: "grid", gap: 16, padding: 18 }}>
                <div className="toolbar">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: categoria.color ?? "var(--accent-gold)",
                          boxShadow: `0 0 18px ${categoria.color ?? "var(--accent-gold)"}`,
                        }}
                      />
                      <h2 className="font-display" style={{ margin: 0, fontSize: 30, fontWeight: 500 }}>{categoria.nombre}</h2>
                    </div>
                    <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
                      {productosCategoria.length} productos / {stockTotal} unidades / {formatCurrency(inventarioTotal)}
                    </p>
                  </div>
                  <Link className="button" href="/inventario/nuevo" aria-label={`Agregar producto en ${categoria.nombre}`}>
                    <Plus size={16} aria-hidden="true" />
                  </Link>
                </div>

                {productosCategoria.length > 0 ? (
                  <div className="product-card-grid">
                    {productosCategoria.map((producto) => (
                      <ProductoCategoriaCard key={producto.id} producto={producto} />
                    ))}
                  </div>
                ) : (
                  <div className="surface elevated" style={{ padding: 16, color: "var(--text-secondary)" }}>
                    Esta categoria aun no tiene productos.
                  </div>
                )}
              </article>
            )
          })}
        </section>
      </div>
    </>
  )
}

function ProductoCategoriaCard({ producto }: { producto: Producto }) {
  return (
    <article className="surface elevated" style={{ display: "grid", gap: 12, padding: 12 }}>
      <Link href={`/inventario/${producto.id}`} style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", gap: 12, alignItems: "center" }}>
        {producto.imagenUrl ? (
          <Image src={producto.imagenUrl} alt={producto.nombre} width={56} height={56} style={{ width: 56, height: 56, borderRadius: 6, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 6, background: "var(--surface-3)" }} aria-hidden="true" />
        )}
        <div style={{ minWidth: 0 }}>
          <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{producto.nombre}</strong>
          <span className="font-mono" style={{ color: "var(--text-secondary)", fontSize: 12 }}>{producto.sku}</span>
        </div>
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <MiniMetric label="Stock" value={String(producto.stock)} />
        <MiniMetric label="Precio" value={formatCurrency(producto.precioVenta)} />
      </div>

      <div className="toolbar" style={{ gap: 8 }}>
        <EstatusBadge estatus={producto.estatus} />
        <div style={{ display: "flex", gap: 8 }}>
          <Link className="button" href={`/inventario/${producto.id}/editar`} aria-label={`Editar ${producto.nombre}`}>
            <Edit size={15} aria-hidden="true" />
          </Link>
          <Link className="button" href={`/inventario/${producto.id}`} aria-label={`Actualizar stock de ${producto.nombre}`}>
            <PackagePlus size={15} aria-hidden="true" />
          </Link>
          <Link className="button" href={`/inventario/${producto.id}`} aria-label={`Ver ${producto.nombre}`}>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid var(--border-subtle)", borderRadius: 6, padding: 10 }}>
      <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{label}</div>
      <div className="font-mono" style={{ marginTop: 4, fontSize: 14 }}>{value}</div>
    </div>
  )
}
