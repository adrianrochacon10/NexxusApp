import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Edit, PackagePlus, Plus } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

export default async function InventarioPage() {
  const { supabase, business } = await requireBusinessContext()

  const [{ data: categorias }, { data: productos }] = await Promise.all([
    supabase
      .from("categorias")
      .select("id, nombre, tipo, color, atributos_base")
      .eq("business_id", business.id)
      .eq("tipo", "producto")
      .order("nombre"),
    supabase
      .from("productos")
      .select("id, nombre, sku, precio_venta, precio_costo, stock, stock_minimo, imagen_url, estatus, atributos, categoria_id")
      .eq("business_id", business.id)
      .order("nombre"),
  ])

  const cats = categorias ?? []
  const prods = productos ?? []

  const categoriasConProductos = cats.map((cat) => ({
    categoria: cat,
    productos: prods.filter((p) => p.categoria_id === cat.id),
  }))

  return (
    <>
      <Navbar title="Inventario" subtitle="Catálogo organizado por categoría. Agrega y administra tus productos." />
      <div className="page" style={{ display: "grid", gap: 18 }}>
        <section className="toolbar">
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

        {categoriasConProductos.length === 0 && (
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
          {categoriasConProductos.map(({ categoria, productos: catProds }) => {
            const stockTotal      = catProds.reduce((s, p) => s + p.stock, 0)
            const inventarioTotal = catProds.reduce((s, p) => s + p.precio_venta * p.stock, 0)
            const alertas         = catProds.filter((p) => p.stock <= p.stock_minimo).length

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
                      {catProds.length} productos · {stockTotal} unidades · {formatCurrency(inventarioTotal)}
                    </p>
                  </div>
                  <Link className="button" href={`/inventario/nuevo?cat=${categoria.id}`} aria-label={`Agregar producto en ${categoria.nombre}`}>
                    <Plus size={16} aria-hidden="true" />
                  </Link>
                </div>

                {catProds.length > 0 ? (
                  <>
                    <div className="product-card-grid">
                      {catProds.slice(0, 2).map((producto) => {
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
                      })}
                    </div>
                    {catProds.length > 2 && (
                      <Link
                        href={`/inventario/categorias/${categoria.id}`}
                        className="button"
                        style={{ width: "100%", justifyContent: "center", color: "var(--text-secondary)", fontSize: 13 }}
                      >
                        Ver los {catProds.length - 2} productos restantes de {categoria.nombre}
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
