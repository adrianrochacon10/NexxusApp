"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Edit, PackagePlus, Plus } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"
import { formatCurrency } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { Producto } from "@/types/inventario.types"

export default function CategoriaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const { categorias, productos: todosProductos } = useStore()

  const categoria = categorias.find((c) => c.id === id)
  const productos  = todosProductos.filter((p) => p.categoria.id === id)

  const stockTotal      = productos.reduce((s, p) => s + p.stock, 0)
  const inventarioTotal = productos.reduce((s, p) => s + p.precioVenta * p.stock, 0)
  const alertas         = productos.filter((p) => p.stock <= p.stockMinimo).length

  if (!categoria) {
    return (
      <>
        <Navbar title="Categoría no encontrada" hideActions />
        <div className="page">
          <p style={{ color: "var(--text-secondary)" }}>Esta categoría no existe o fue eliminada.</p>
          <Link href="/inventario" className="button" style={{ marginTop: 16, width: "fit-content" }}>
            <ArrowLeft size={15} aria-hidden="true" />
            Volver al inventario
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar
        title={categoria.nombre}
        subtitle={`${productos.length} productos · ${stockTotal} unidades · ${formatCurrency(inventarioTotal)}`}
      />
      <div className="page" style={{ display: "grid", gap: 18 }}>

        <section className="toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/inventario" className="button" style={{ padding: "0 12px", flexShrink: 0 }} aria-label="Volver">
              <ArrowLeft size={17} aria-hidden="true" />
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 10, height: 10, borderRadius: 999, flexShrink: 0,
                  background: categoria.color ?? "var(--accent-gold)",
                  boxShadow: `0 0 14px ${categoria.color ?? "var(--accent-gold)"}`,
                }}
              />
              {alertas > 0 && (
                <span className="badge" style={{ background: "rgba(155,122,74,0.15)", color: "var(--warning)", border: "1px solid rgba(155,122,74,0.3)", fontSize: 11 }}>
                  {alertas} alerta{alertas > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <Link href="/inventario/nuevo" className="button button-primary">
            <Plus size={17} aria-hidden="true" />
            Nuevo producto
          </Link>
        </section>

        {productos.length === 0 ? (
          <article className="surface" style={{ padding: 32, textAlign: "center", display: "grid", gap: 12, justifyItems: "center" }}>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>Esta categoría aún no tiene productos.</p>
            <Link href="/inventario/nuevo" className="button button-primary" style={{ width: "fit-content" }}>
              <Plus size={17} aria-hidden="true" />
              Agregar producto
            </Link>
          </article>
        ) : (
          <div className="product-card-grid">
            {productos.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>
        )}

      </div>
    </>
  )
}

function ProductoCard({ producto }: { producto: Producto }) {
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
        <div style={{ border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>Stock</div>
          <div className="font-mono" style={{ marginTop: 4, fontSize: 13, color: agotado || stockBajo ? "var(--warning)" : undefined }}>
            {producto.stock}
          </div>
        </div>
        <div style={{ border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>Precio</div>
          <div className="font-mono" style={{ marginTop: 4, fontSize: 13 }}>{formatCurrency(producto.precioVenta)}</div>
        </div>
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
