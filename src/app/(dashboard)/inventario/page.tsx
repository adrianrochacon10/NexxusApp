"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Edit, PackagePlus, Plus } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"
import { formatCurrency } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { Producto } from "@/types/inventario.types"

export default function InventarioPage() {
  const { categorias: todasCategorias, productos: todosProductos } = useStore()
  const categorias = todasCategorias.filter((c) => c.tipo === "producto")
  const productos  = todosProductos

  const categoriasProducto = categorias.map((categoria) => ({
    categoria,
    productos: productos.filter((p) => p.categoria.id === categoria.id),
  }))

  return (
    <>
      <Navbar title="Inventario" subtitle="Catálogo organizado por categoría. Agrega y administra tus productos." />
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="toolbar">
          <div className="responsive-cluster">
            <input className="input" placeholder="Buscar producto, SKU o categoría…" aria-label="Buscar producto" style={{ width: 320 }} />
            <select className="input" aria-label="Filtrar por estatus" style={{ width: 170 }}>
              <option>Todos los estatus</option>
              <option>Disponible</option>
              <option>Pausado</option>
              <option>Agotado</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/inventario/categorias/nueva" className="button">
              <Plus size={17} aria-hidden="true" />
              Nueva categoría
            </Link>
            <Link href="/inventario/nuevo" className="button button-primary">
              <Plus size={17} aria-hidden="true" />
              Nuevo producto
            </Link>
          </div>
        </section>

        {categoriasProducto.length === 0 && (
          <article className="surface" style={{ padding: 32, textAlign: "center", display: "grid", gap: 12, justifyItems: "center" }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>Sin categorías</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", maxWidth: 360 }}>
              Crea tu primera categoría para empezar a agregar productos al catálogo.
            </p>
            <Link href="/inventario/categorias/nueva" className="button button-primary" style={{ width: "fit-content" }}>
              <Plus size={17} aria-hidden="true" />
              Crear categoría
            </Link>
          </article>
        )}

        <section className="category-grid">
          {categoriasProducto.map(({ categoria, productos: prods }) => {
            const stockTotal      = prods.reduce((s, p) => s + p.stock, 0)
            const inventarioTotal = prods.reduce((s, p) => s + p.precioVenta * p.stock, 0)
            const alertas         = prods.filter((p) => p.stock <= p.stockMinimo).length

            return (
              <article key={categoria.id} className="surface" style={{ display: "grid", gap: 16, padding: 20 }}>
                <div className="toolbar">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10, height: 10, borderRadius: 999, flexShrink: 0,
                          background: categoria.color ?? "var(--accent-gold)",
                          boxShadow: `0 0 14px ${categoria.color ?? "var(--accent-gold)"}`,
                        }}
                      />
                      <h2 className="font-display" style={{ margin: 0, fontSize: 28, fontWeight: 500 }}>
                        {categoria.nombre}
                      </h2>
                      {alertas > 0 && (
                        <span className="badge" style={{ background: "rgba(155,122,74,0.15)", color: "var(--warning)", border: "1px solid rgba(155,122,74,0.3)", fontSize: 11 }}>
                          {alertas} alerta{alertas > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>
                      {prods.length} productos · {stockTotal} unidades · {formatCurrency(inventarioTotal)}
                    </p>
                  </div>
                  <Link className="button" href={`/inventario/nuevo`} aria-label={`Agregar producto en ${categoria.nombre}`}>
                    <Plus size={16} aria-hidden="true" />
                  </Link>
                </div>

                {prods.length > 0 ? (
                  <>
                    <div className="product-card-grid">
                      {prods.slice(0, 2).map((producto) => (
                        <ProductoCategoriaCard key={producto.id} producto={producto} />
                      ))}
                    </div>
                    {prods.length > 2 && (
                      <Link
                        href={`/inventario/categorias/${categoria.id}`}
                        className="button"
                        style={{ width: "100%", justifyContent: "center", color: "var(--text-secondary)", fontSize: 13 }}
                      >
                        Ver los {prods.length - 2} productos restantes de {categoria.nombre}
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="surface elevated" style={{ padding: 16, color: "var(--text-secondary)", fontSize: 13 }}>
                    Esta categoría aún no tiene productos.
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
  const stockBajo = producto.stock <= producto.stockMinimo && producto.stock > 0
  const agotado   = producto.stock === 0

  return (
    <article className="surface elevated" style={{ display: "grid", gap: 12, padding: 14 }}>
      <Link
        href={`/inventario/${producto.id}`}
        style={{ display: "grid", gridTemplateColumns: "52px minmax(0,1fr)", gap: 12, alignItems: "center" }}
      >
        {producto.imagenUrl ? (
          <Image
            src={producto.imagenUrl}
            alt={producto.nombre}
            width={52}
            height={52}
            style={{ width: 52, height: 52, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: 6, background: "var(--surface-3)", flexShrink: 0 }} aria-hidden="true" />
        )}
        <div style={{ minWidth: 0 }}>
          <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14 }}>
            {producto.nombre}
          </strong>
          <span className="font-mono" style={{ color: "var(--text-secondary)", fontSize: 11 }}>{producto.sku}</span>
        </div>
      </Link>

      {producto.atributos && Object.keys(producto.atributos).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(producto.atributos).slice(0, 3).map(([k, v]) => (
            <span key={k} className="badge" style={{ fontSize: 11 }}>
              {k}: {v}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <MiniMetric label="Stock" value={String(producto.stock)} warn={agotado || stockBajo} />
        <MiniMetric label="Precio" value={formatCurrency(producto.precioVenta)} />
      </div>

      <div className="toolbar" style={{ gap: 8 }}>
        <EstatusBadge estatus={producto.estatus} />
        <div style={{ display: "flex", gap: 6 }}>
          <Link className="button" href={`/inventario/${producto.id}/editar`} aria-label={`Editar ${producto.nombre}`} style={{ padding: "0 10px", minHeight: 34, height: 34 }}>
            <Edit size={14} aria-hidden="true" />
          </Link>
          <Link className="button" href={`/inventario/${producto.id}`} aria-label={`Actualizar stock de ${producto.nombre}`} style={{ padding: "0 10px", minHeight: 34, height: 34 }}>
            <PackagePlus size={14} aria-hidden="true" />
          </Link>
          <Link className="button" href={`/inventario/${producto.id}`} aria-label={`Ver ${producto.nombre}`} style={{ padding: "0 10px", minHeight: 34, height: 34 }}>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

function MiniMetric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px" }}>
      <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{label}</div>
      <div className="font-mono" style={{ marginTop: 4, fontSize: 13, color: warn ? "var(--warning)" : undefined }}>{value}</div>
    </div>
  )
}
