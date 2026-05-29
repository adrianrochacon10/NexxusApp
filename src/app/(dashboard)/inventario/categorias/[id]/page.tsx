import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Edit, PackagePlus, Plus } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function CategoriaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, business } = await requireBusinessContext()

  const [{ data: categoria }, { data: productos }] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, nombre, color, tipo, atributos_base")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("productos")
      .select("id, nombre, sku, precio_venta, stock, stock_minimo, imagen_url, estatus, atributos")
      .eq("categoria_id", id)
      .eq("business_id", business.id)
      .order("nombre"),
  ])

  if (!categoria) notFound()

  const prods         = productos ?? []
  const stockTotal    = prods.reduce((s, p) => s + p.stock, 0)
  const valorTotal    = prods.reduce((s, p) => s + p.precio_venta * p.stock, 0)
  const alertas       = prods.filter((p) => p.stock <= p.stock_minimo).length

  return (
    <>
      <Navbar
        title={categoria.nombre}
        subtitle={`${prods.length} productos · ${stockTotal} unidades · ${formatCurrency(valorTotal)}`}
      />
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/inventario" className="button" style={{ padding: "0 12px", flexShrink: 0 }} aria-label="Volver">
              <ArrowLeft size={17} aria-hidden="true" />
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, flexShrink: 0, background: categoria.color ?? "var(--accent-gold)", boxShadow: `0 0 14px ${categoria.color ?? "var(--accent-gold)"}` }} />
              {alertas > 0 && (
                <span className="badge" style={{ background: "rgba(155,122,74,0.15)", color: "var(--warning)", border: "1px solid rgba(155,122,74,0.3)", fontSize: 11 }}>
                  {alertas} alerta{alertas > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <Link href={`/inventario/nuevo?cat=${id}`} className="button button-primary">
            <Plus size={17} aria-hidden="true" />
            Nuevo producto
          </Link>
        </section>

        {prods.length === 0 ? (
          <article className="surface" style={{ padding: 32, textAlign: "center", display: "grid", gap: 12, justifyItems: "center" }}>
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>Esta categoría aún no tiene productos.</p>
            <Link href={`/inventario/nuevo?cat=${id}`} className="button button-primary" style={{ width: "fit-content" }}>
              <Plus size={17} aria-hidden="true" />
              Agregar producto
            </Link>
          </article>
        ) : (
          <div className="product-card-grid">
            {prods.map((producto) => {
              const stockBajo = producto.stock <= producto.stock_minimo && producto.stock > 0
              const agotado   = producto.stock === 0
              return (
                <article key={producto.id} className="surface elevated" style={{ display: "grid", gap: 12, padding: 14 }}>
                  <Link href={`/inventario/${producto.id}`} style={{ display: "grid", gridTemplateColumns: "52px minmax(0,1fr)", gap: 12, alignItems: "center" }}>
                    {producto.imagen_url ? (
                      <Image src={producto.imagen_url} alt={producto.nombre} width={52} height={52} style={{ width: 52, height: 52, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: 6, background: "var(--surface-3)", flexShrink: 0 }} aria-hidden="true" />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14 }}>{producto.nombre}</strong>
                      <span className="font-mono" style={{ color: "var(--text-secondary)", fontSize: 11 }}>{producto.sku ?? "—"}</span>
                    </div>
                  </Link>

                  {producto.atributos && Object.keys(producto.atributos as object).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {Object.entries(producto.atributos as Record<string, string>).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="badge" style={{ fontSize: 11 }}>{k}: {v}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>Stock</div>
                      <div className="font-mono" style={{ marginTop: 4, fontSize: 13, color: agotado || stockBajo ? "var(--warning)" : undefined }}>{producto.stock}</div>
                    </div>
                    <div style={{ border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "8px 10px" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>Precio</div>
                      <div className="font-mono" style={{ marginTop: 4, fontSize: 13 }}>{formatCurrency(producto.precio_venta)}</div>
                    </div>
                  </div>

                  <div className="toolbar" style={{ gap: 8 }}>
                    <EstatusBadge estatus={producto.estatus as "disponible" | "pausado" | "agotado"} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link className="button" href={`/inventario/${producto.id}/editar`} aria-label={`Editar ${producto.nombre}`} style={{ padding: "0 10px", minHeight: 34, height: 34 }}><Edit size={14} /></Link>
                      <Link className="button" href={`/inventario/${producto.id}`} aria-label={`Actualizar stock`} style={{ padding: "0 10px", minHeight: 34, height: 34 }}><PackagePlus size={14} /></Link>
                      <Link className="button" href={`/inventario/${producto.id}`} aria-label={`Ver detalle`} style={{ padding: "0 10px", minHeight: 34, height: 34 }}><ArrowRight size={14} /></Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
