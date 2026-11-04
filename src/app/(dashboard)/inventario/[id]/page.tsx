import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"
import { InventarioToastProvider } from "@/components/inventario/InventarioToast"
import { MovimientosHistorial, type MovimientoFila } from "@/components/inventario/MovimientosHistorial"
import { ProductoAcciones } from "@/components/inventario/ProductoAcciones"
import { ProductoThumb } from "@/components/inventario/ProductoThumb"
import { StockActualizador } from "@/components/inventario/StockActualizador"
import { VariantesStockInline } from "@/components/inventario/VariantesStockInline"
import { ESTADO_BADGE, estadoProducto, formatPct, margenPct } from "@/components/inventario/inventario-utils"
import { formatCurrency } from "@/lib/utils"
import { requireBusinessContext } from "@/server/business/business-context"

export const dynamic = "force-dynamic"

const LIMITE_MOVIMIENTOS = 50

export default async function ProductoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ registrar?: string }>
}) {
  const { id } = await params
  const { registrar } = await searchParams
  const { supabase, business } = await requireBusinessContext()

  const [{ data: producto }, { data: variantes }, { data: movimientos }, { count: totalMovimientos }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, descripcion, precio_venta, precio_costo, stock, stock_minimo, imagen_url, estatus, sku, atributos, categoria_id")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("producto_variantes")
      .select("id, nombre, sku, atributos, stock, stock_minimo")
      .eq("producto_id", id)
      .eq("business_id", business.id)
      .order("nombre"),
    supabase
      .from("movimientos_stock")
      .select("id, tipo, cantidad, stock_antes, stock_despues, notas, created_at, variante_id")
      .eq("producto_id", id)
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(LIMITE_MOVIMIENTOS),
    supabase
      .from("movimientos_stock")
      .select("id", { count: "exact", head: true })
      .eq("producto_id", id)
      .eq("business_id", business.id),
  ])

  if (!producto) notFound()

  const { data: categoria } = producto.categoria_id
    ? await supabase
        .from("categorias")
        .select("id, nombre")
        .eq("id", producto.categoria_id)
        .eq("business_id", business.id)
        .maybeSingle()
    : { data: null }

  const vars = variantes ?? []
  const tieneVariantes = vars.length > 0
  const nombreVariante = new Map(vars.map((v) => [v.id, v.nombre]))
  const filas: MovimientoFila[] = (movimientos ?? []).map((m) => ({
    id:            m.id,
    tipo:          m.tipo as MovimientoFila["tipo"], // el CHECK de la tabla limita los valores
    cantidad:      m.cantidad,
    stock_antes:   m.stock_antes,
    stock_despues: m.stock_despues,
    notas:         m.notas,
    created_at:    m.created_at,
    variante:      m.variante_id ? nombreVariante.get(m.variante_id) ?? "Variante eliminada" : null,
  }))

  const { estado } = estadoProducto(producto, vars)
  const badge = ESTADO_BADGE[estado]
  const margen = margenPct(producto.precio_venta, producto.precio_costo)
  const atributos = Object.entries((producto.atributos as Record<string, string> | null) ?? {}).filter(([, v]) => String(v).trim())
  const estatus = producto.estatus === "pausado" ? "pausado" : producto.stock > 0 ? "disponible" : "agotado"

  return (
    <InventarioToastProvider>
      <header className="inv-head">
        <ProductoThumb nombre={producto.nombre} imagenUrl={producto.imagen_url} size={72} style={{ borderRadius: 16, fontSize: 20 }} />
        <div className="grow" style={{ minWidth: 220 }}>
          <nav className="t-small inv-crumb" aria-label="Ruta">
            <Link href="/inventario" className="nx-link">Inventario</Link>
            {categoria && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/inventario/categorias/${categoria.id}`} className="nx-link">{categoria.nombre}</Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span aria-current="page">Historial</span>
          </nav>
          <h1 className="t-h1" style={{ marginTop: 2 }}>{producto.nombre}</h1>
          <div className="nx-row gap-12" style={{ marginTop: 6, flexWrap: "wrap" }}>
            <span className="nx-mono ink3">{producto.sku ?? "Sin SKU"}</span>
            <span className={`nx-badge ${badge.cls}`}>{badge.label}</span>
            <span className="t-small">
              Stock actual <b className="nx-num" style={{ color: "var(--nx-ink)" }}>{producto.stock} uds</b>
              {tieneVariantes && <> · {vars.map((v) => `${v.nombre}: ${v.stock}`).join(" · ")}</>}
            </span>
          </div>
        </div>
        <div className="inv-head-actions">
          <Link href={`/inventario/${id}/editar`} className="nx-btn nx-btn-secondary">
            <Pencil size={18} aria-hidden="true" />
            Editar producto
          </Link>
          <StockActualizador
            productoId={producto.id}
            productoNombre={producto.nombre}
            stockActual={producto.stock}
            variantes={vars.map((v) => ({ id: v.id, nombre: v.nombre, stock: v.stock }))}
            abrirAlInicio={registrar === "entrada"}
          />
        </div>
      </header>

      <div className="page">
        <div className="inv-detail">
          <MovimientosHistorial movimientos={filas} limite={LIMITE_MOVIMIENTOS} />

          <aside className="nx-col gap-16">
            <section className="nx-card nx-col gap-12" style={{ padding: 20 }} aria-labelledby="h-resumen">
              <h2 className="t-h2" id="h-resumen">Resumen</h2>
              <dl className="inv-dl">
                <dt>Precio de venta</dt><dd>{formatCurrency(producto.precio_venta)}</dd>
                <dt>Costo</dt><dd>{formatCurrency(producto.precio_costo)}</dd>
                <dt>Margen</dt><dd className={margen !== null && margen < 0 ? "neg" : ""}>{formatPct(margen)}</dd>
                <dt>Stock</dt><dd>{producto.stock} uds</dd>
                {!tieneVariantes && <><dt>Stock mínimo</dt><dd>{producto.stock_minimo} uds</dd></>}
              </dl>
              {producto.descripcion && <p className="t-small" style={{ color: "var(--nx-ink-2)" }}>{producto.descripcion}</p>}
              {atributos.length > 0 && (
                <div className="nx-row gap-4" style={{ flexWrap: "wrap" }}>
                  {atributos.map(([k, v]) => <span key={k} className="nx-attr">{k}: {String(v)}</span>)}
                </div>
              )}
            </section>

            {tieneVariantes && (
              <VariantesStockInline
                productoId={producto.id}
                productoNombre={producto.nombre}
                variantes={vars.map((v) => ({
                  id:           v.id,
                  nombre:       v.nombre,
                  sku:          v.sku,
                  stock:        v.stock,
                  stock_minimo: v.stock_minimo,
                  estatus:      v.stock > 0 ? "disponible" : "agotado",
                }))}
              />
            )}

            <ProductoAcciones
              productoId={producto.id}
              productoNombre={producto.nombre}
              estatusActual={estatus}
              stock={producto.stock}
              movimientos={totalMovimientos ?? undefined}
            />
          </aside>
        </div>
      </div>
    </InventarioToastProvider>
  )
}
