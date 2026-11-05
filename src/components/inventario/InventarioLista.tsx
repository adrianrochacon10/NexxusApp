"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ChevronDown, History, MoreVertical, Pause, Pencil, Play, Plus, Search, Trash2, X } from "lucide-react"
import { cambiarEstatusProducto } from "@/actions/inventario"
import { EliminarProductoDialog } from "@/components/inventario/EliminarProductoDialog"
import { InventarioToastProvider, useInventarioToast } from "@/components/inventario/InventarioToast"
import { ProductoThumb } from "@/components/inventario/ProductoThumb"
import {
  ESTADO_BADGE,
  estadoProducto,
  formatPct,
  margenPct,
  mensajeError,
  type EstadoInventario,
  type VarianteResumen,
} from "@/components/inventario/inventario-utils"
import { formatCurrency } from "@/lib/utils"
import { exigirOk } from "@/lib/action-result"

export interface CategoriaListado {
  id:             string
  nombre:         string
  color:          string | null
  atributos_base: string[]
}

export interface ProductoListado {
  id:           string
  nombre:       string
  sku:          string | null
  precio_venta: number
  precio_costo: number
  stock:        number
  stock_minimo: number
  imagen_url:   string | null
  estatus:      string
  categoria_id: string | null
  variantes:    VarianteResumen[]
}

interface InventarioListaProps {
  categorias: CategoriaListado[]
  productos:  ProductoListado[]
  /** Vista de una sola categoría: sin enlace "Ver categoría" ni colapsar. */
  categoriaUnica?: boolean
}

type Filtro = "todos" | "bajo" | "pausados"

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos",    label: "Todos" },
  { id: "bajo",     label: "Stock bajo" },
  { id: "pausados", label: "Pausados" },
]

const SIN_CATEGORIA = "__sin_categoria__"

interface Item {
  p:       ProductoListado
  estado:  EstadoInventario
  bajoEn:  string[]
  margen:  number | null
  catNombre: string
}

export function InventarioLista(props: InventarioListaProps) {
  return (
    <InventarioToastProvider>
      <InventarioListaInner {...props} />
    </InventarioToastProvider>
  )
}

function InventarioListaInner({ categorias, productos, categoriaUnica = false }: InventarioListaProps) {
  const router = useRouter()
  const toast = useInventarioToast()
  const [q, setQ] = useState("")
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [colapsadas, setColapsadas] = useState<Record<string, boolean>>({})
  const [hojaId, setHojaId] = useState<string | null>(null)
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [pendienteId, setPendienteId] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState("")
  const [, startTransition] = useTransition()

  const catNombre = useMemo(() => new Map(categorias.map((c) => [c.id, c.nombre])), [categorias])

  const items: Item[] = useMemo(
    () => productos.map((p) => {
      const { estado, bajoEn } = estadoProducto(p, p.variantes)
      return {
        p, estado, bajoEn,
        margen: margenPct(p.precio_venta, p.precio_costo),
        catNombre: (p.categoria_id && catNombre.get(p.categoria_id)) || "Sin categoría",
      }
    }),
    [productos, catNombre],
  )

  const ql = q.trim().toLowerCase()
  const hayFiltro = ql.length > 0 || filtro !== "todos"
  const coincide = (i: Item) =>
    (!ql || `${i.p.nombre} ${i.p.sku ?? ""} ${i.catNombre}`.toLowerCase().includes(ql)) &&
    (filtro === "todos" || (filtro === "bajo" && i.estado === "bajo") || (filtro === "pausados" && i.estado === "pausado"))

  const agotados = items.filter((i) => i.estado === "agotado" && coincide(i))

  const gruposBase = [
    ...categorias.map((c) => ({ id: c.id, nombre: c.nombre, color: c.color, atributos: c.atributos_base ?? [] })),
    ...(items.some((i) => !i.p.categoria_id || !catNombre.has(i.p.categoria_id))
      ? [{ id: SIN_CATEGORIA, nombre: "Sin categoría", color: null, atributos: [] as string[] }]
      : []),
  ]

  const grupos = gruposBase
    .map((g) => {
      const todos = items.filter((i) =>
        g.id === SIN_CATEGORIA ? !i.p.categoria_id || !catNombre.has(i.p.categoria_id) : i.p.categoria_id === g.id,
      )
      const filas = todos.filter((i) => i.estado !== "agotado" && coincide(i))
      const unidades = todos.reduce((a, i) => a + i.p.stock, 0)
      const valor = todos.reduce((a, i) => a + i.p.stock * i.p.precio_costo, 0)
      const abierta = categoriaUnica || !colapsadas[g.id] || ql.length > 0
      return { ...g, todos, filas, unidades, valor, abierta }
    })
    .filter((g) => g.filas.length > 0 || (!hayFiltro && g.todos.length === 0 && g.id !== SIN_CATEGORIA))

  const sinResultados = hayFiltro && agotados.length === 0 && grupos.every((g) => g.filas.length === 0)

  // KPIs
  const bajos = items.filter((i) => i.estado === "bajo").length
  const sinStock = items.filter((i) => i.estado === "agotado").length
  const unidades = items.reduce((a, i) => a + i.p.stock, 0)
  const valor = items.reduce((a, i) => a + i.p.stock * i.p.precio_costo, 0)

  const hoja = hojaId ? items.find((i) => i.p.id === hojaId) ?? null : null
  const aEliminar = eliminarId ? items.find((i) => i.p.id === eliminarId) ?? null : null

  useEffect(() => {
    if (!hoja) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setHojaId(null) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [hoja])

  function alternarPausa(i: Item) {
    const pausado = i.estado === "pausado"
    setPendienteId(i.p.id)
    setErrorAccion("")
    startTransition(async () => {
      try {
        exigirOk(await cambiarEstatusProducto(i.p.id, pausado ? "disponible" : "pausado"))
        toast(pausado ? `${i.p.nombre} reactivado` : `${i.p.nombre} pausado: ya no aparece en el POS`)
        router.refresh()
      } catch (err) {
        setErrorAccion(mensajeError(err, "No se pudo cambiar el estatus."))
      } finally {
        setPendienteId(null)
        setHojaId(null)
      }
    })
  }

  function textoMinimo(i: Item): { texto: string; tono: string } {
    const vs = i.p.variantes
    if (i.estado === "bajo") {
      return {
        texto: vs.length > 0 ? `bajo en ${i.bajoEn.join(", ")}` : `mín. ${i.p.stock_minimo}`,
        tono: "var(--nx-warn-fg)",
      }
    }
    if (vs.length > 0) {
      const mins = new Set(vs.map((v) => v.stock_minimo))
      return { texto: mins.size === 1 ? `mín. ${vs[0].stock_minimo} c/variante` : "mín. por variante", tono: "var(--nx-ink-3)" }
    }
    return { texto: `mín. ${i.p.stock_minimo}`, tono: "var(--nx-ink-3)" }
  }

  const tinta = (i: Item) => (i.estado === "pausado" ? "var(--nx-ink-3)" : "var(--nx-ink)")
  const detalleVariantes = (i: Item) =>
    i.p.variantes.length > 0 ? `${i.p.variantes.length} ${i.p.variantes.length === 1 ? "variante" : "variantes"}` : "Sin variantes"

  function accionesFila(i: Item) {
    const pausado = i.estado === "pausado"
    const etiqueta = `${pausado ? "Reactivar" : "Pausar"} ${i.p.nombre}`
    return (
      <div className="nx-row" style={{ justifyContent: "flex-end", gap: 0 }}>
        <button type="button" className="nx-iconbtn" aria-label={etiqueta} title={pausado ? "Reactivar" : "Pausar"} onClick={() => alternarPausa(i)} disabled={pendienteId === i.p.id}>
          {pausado ? <Play size={20} aria-hidden="true" /> : <Pause size={20} aria-hidden="true" />}
        </button>
        <Link href={`/inventario/${i.p.id}/editar`} className="nx-iconbtn" aria-label={`Editar ${i.p.nombre}`} title="Editar">
          <Pencil size={20} aria-hidden="true" />
        </Link>
        <button type="button" className="nx-iconbtn danger" aria-label={`Eliminar ${i.p.nombre}`} title="Eliminar" onClick={() => setEliminarId(i.p.id)}>
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </div>
    )
  }

  function toggleGrupo(id: string, abierta: boolean) {
    setColapsadas((prev) => ({ ...prev, [id]: abierta }))
  }

  return (
    <div className="inv-stack">
      {/* Resumen */}
      <section className="inv-kpis" aria-label="Resumen del inventario">
        <article className="nx-card nx-kpi">
          <span className="nx-kpi-label">Productos</span>
          <span className="nx-kpi-value">{items.length}</span>
          <span className="nx-kpi-foot">{categorias.length} {categorias.length === 1 ? "categoría" : "categorías"}</span>
        </article>
        <article className="nx-card nx-kpi">
          <span className="nx-kpi-label">Unidades en stock</span>
          <span className="nx-kpi-value">{unidades.toLocaleString("es-MX")}</span>
          <span className="nx-kpi-foot">Todas las variantes</span>
        </article>
        <article className="nx-card nx-kpi">
          <span className="nx-kpi-label">Valor del inventario</span>
          <span className="nx-kpi-value">{formatCurrency(valor)}</span>
          <span className="nx-kpi-foot">A precio de costo</span>
        </article>
        <article className="nx-card nx-kpi">
          <span className="nx-kpi-label">Requieren atención</span>
          <span className="nx-kpi-value">{bajos + sinStock}</span>
          <span className="nx-kpi-foot">{bajos} bajo mínimo · {sinStock} {sinStock === 1 ? "agotado" : "agotados"}</span>
        </article>
      </section>

      {/* Búsqueda y filtros */}
      <div className="inv-toolbar">
        <div className="nx-affix inv-search">
          <span className="ic"><Search size={20} aria-hidden="true" /></span>
          <input
            className="nx-input has-ic"
            type="search"
            aria-label="Buscar en inventario"
            placeholder="Nombre, SKU o categoría"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="inv-filters" role="group" aria-label="Filtro">
          {FILTROS.map((f) => (
            <button key={f.id} type="button" className={`nx-chip ${filtro === f.id ? "is-on" : ""}`} aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {errorAccion && (
        <div className="nx-alert is-bad" role="alert">
          <AlertCircle size={20} aria-hidden="true" style={{ flex: "none" }} />
          <div className="grow"><div className="txt" style={{ margin: 0 }}>{errorAccion}</div></div>
        </div>
      )}

      {sinResultados && (
        <div className="nx-card nx-empty">
          <div className="nx-empty-ic"><Search size={28} strokeWidth={1.8} aria-hidden="true" /></div>
          <div className="ttl">Ningún producto coincide</div>
          <div className="txt">Prueba con otro nombre, SKU o categoría.</div>
          <button type="button" className="nx-btn nx-btn-secondary" onClick={() => { setQ(""); setFiltro("todos") }}>Limpiar filtros</button>
        </div>
      )}

      {/* ─────────── Escritorio ─────────── */}
      <div className="inv-only-desktop inv-stack">
        {agotados.length > 0 && (
          <section className="nx-card inv-out" aria-labelledby="h-agotados">
            <div className="inv-out-head">
              <AlertCircle size={20} aria-hidden="true" />
              <h2 className="t-h2" id="h-agotados" style={{ color: "var(--nx-bad-fg)" }}>Agotados</h2>
              <span className="nx-badge is-bad" style={{ background: "#fff" }}>{agotados.length}</span>
              <span className="t-small grow" style={{ color: "var(--nx-bad-fg)" }}>No se pueden vender hasta reponer stock.</span>
            </div>
            <div className="inv-table-scroll">
              <table className="nx-table">
                <tbody>
                  {agotados.map((i) => (
                    <tr key={i.p.id}>
                      <td style={{ width: 64 }}><ProductoThumb nombre={i.p.nombre} imagenUrl={i.p.imagen_url} /></td>
                      <td>
                        <Link href={`/inventario/${i.p.id}`} className="t-h3 inv-name-link" style={{ color: "var(--nx-ink-2)" }}>{i.p.nombre}</Link>
                        <div className="nx-mono ink3" style={{ fontSize: 12 }}>{i.p.sku ?? "Sin SKU"} · {i.catNombre}</div>
                      </td>
                      <td className="r"><Badge estado="agotado" /></td>
                      <td className="r" style={{ width: 170 }}>
                        <Link href={`/inventario/${i.p.id}?registrar=entrada`} className="nx-btn nx-btn-secondary nx-btn-sm" aria-label={`Registrar entrada de ${i.p.nombre}`}>
                          Registrar entrada
                        </Link>
                      </td>
                      <td className="r" style={{ width: 56 }}>
                        <button type="button" className="nx-iconbtn danger" aria-label={`Eliminar ${i.p.nombre}`} title="Eliminar" onClick={() => setEliminarId(i.p.id)}>
                          <Trash2 size={20} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {grupos.map((g) => (
          <section key={g.id} className="nx-col gap-8" aria-label={g.nombre}>
            <div className="inv-cathead">
              {categoriaUnica ? (
                <h2 className="t-h2">Productos</h2>
              ) : (
                <button type="button" className="inv-catbtn" aria-expanded={g.abierta} onClick={() => toggleGrupo(g.id, g.abierta)}>
                  <ChevronDown size={20} strokeWidth={2.2} aria-hidden="true" />
                  {g.color && <span className="nx-catdot" style={{ background: g.color }} aria-hidden="true" />}
                  <h2 className="t-h2">{g.nombre}</h2>
                </button>
              )}
              {g.atributos.length > 0 && (
                <div className="nx-row gap-4" style={{ flexWrap: "wrap" }}>
                  {g.atributos.map((a) => <span key={a} className="nx-attr">{a}</span>)}
                </div>
              )}
              <div className="grow" />
              <div className="t-small nx-num inv-catstats">
                <b>{g.todos.length}</b> {g.todos.length === 1 ? "producto" : "productos"} · <b>{g.unidades}</b> uds · Valor <b>{formatCurrency(g.valor)}</b>
              </div>
              {g.id !== SIN_CATEGORIA && !categoriaUnica && (
                <>
                  <Link href={`/inventario/categorias/${g.id}`} className="nx-link">Ver categoría</Link>
                  <Link href={`/inventario/nuevo?cat=${g.id}`} className="nx-iconbtn" aria-label={`Agregar producto en ${g.nombre}`} title="Agregar producto">
                    <Plus size={20} aria-hidden="true" />
                  </Link>
                </>
              )}
            </div>

            {g.abierta && (
              g.filas.length === 0 ? (
                <div className="nx-card t-small" style={{ padding: 16 }}>
                  {g.todos.length === 0 ? "Esta categoría aún no tiene productos." : "Todos los productos de esta categoría están agotados."}
                  {g.todos.length === 0 && g.id !== SIN_CATEGORIA && (
                    <> <Link href={`/inventario/nuevo?cat=${g.id}`} className="nx-link" style={{ minHeight: 0 }}>Agregar producto</Link></>
                  )}
                </div>
              ) : (
                <div className="nx-table-wrap inv-table-scroll">
                  <table className="nx-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}><span className="sr-only">Foto</span></th>
                        <th>Producto</th>
                        <th className="r">Stock</th>
                        <th className="r">Precio</th>
                        <th className="r">Margen</th>
                        <th>Estado</th>
                        <th className="r" style={{ width: 150 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.filas.map((i) => {
                        const min = textoMinimo(i)
                        return (
                          <tr key={i.p.id}>
                            <td><ProductoThumb nombre={i.p.nombre} imagenUrl={i.p.imagen_url} /></td>
                            <td>
                              <Link href={`/inventario/${i.p.id}`} className="t-h3 inv-name-link" style={{ color: tinta(i) }}>{i.p.nombre}</Link>
                              <div className="nx-mono ink3" style={{ fontSize: 12 }}>{i.p.sku ?? "Sin SKU"} · {detalleVariantes(i)}</div>
                            </td>
                            <td className="r">
                              <div className="nx-num t-h3" style={{ color: tinta(i) }}>{i.p.stock}</div>
                              <div className="t-small" style={{ color: min.tono }}>{min.texto}</div>
                            </td>
                            <td className="r nx-num">{formatCurrency(i.p.precio_venta)}</td>
                            <td className={`r nx-num ${i.margen !== null && i.margen < 0 ? "neg" : ""}`}>{formatPct(i.margen)}</td>
                            <td><Badge estado={i.estado} /></td>
                            <td className="r">{accionesFila(i)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </section>
        ))}
      </div>

      {/* ─────────── Móvil ─────────── */}
      <div className="inv-only-mobile">
        {agotados.length > 0 && (
          <section className="inv-out-m" aria-labelledby="h-agotados-m" style={{ marginBottom: 12 }}>
            <div className="inv-out-m-head">
              <AlertCircle size={18} aria-hidden="true" />
              <h2 id="h-agotados-m" style={{ font: "600 15px/20px var(--nx-font)", color: "var(--nx-bad-fg)" }}>Agotados · {agotados.length}</h2>
            </div>
            {agotados.map((i) => (
              <div key={i.p.id} className="nx-li">
                <ProductoThumb nombre={i.p.nombre} imagenUrl={i.p.imagen_url} />
                <div className="grow">
                  <Link href={`/inventario/${i.p.id}`} className="nx-li-title inv-name-link" style={{ display: "block", color: "var(--nx-ink-2)" }}>{i.p.nombre}</Link>
                  <div className="nx-li-meta nx-mono">{i.p.sku ?? "Sin SKU"}</div>
                </div>
                <button type="button" className="nx-iconbtn" aria-label={`Acciones de ${i.p.nombre}`} aria-haspopup="dialog" onClick={() => setHojaId(i.p.id)}>
                  <MoreVertical size={20} aria-hidden="true" />
                </button>
              </div>
            ))}
          </section>
        )}

        {grupos.length > 0 && (
          <div className="inv-mobile-list">
            {grupos.map((g) => (
              <section key={g.id} aria-label={g.nombre}>
                <button type="button" className="inv-mcathead" aria-expanded={g.abierta} onClick={() => !categoriaUnica && toggleGrupo(g.id, g.abierta)}>
                  <ChevronDown size={20} strokeWidth={2.2} aria-hidden="true" />
                  <span className="grow">
                    <span className="t-h3" style={{ display: "block" }}>{categoriaUnica ? "Productos" : g.nombre}</span>
                    <span className="t-small nx-num" style={{ display: "block" }}>{g.unidades} uds · {formatCurrency(g.valor)}</span>
                  </span>
                  <span className="t-small">{g.todos.length}</span>
                </button>
                {g.abierta && (
                  <div>
                    {g.filas.length === 0 ? (
                      <div className="nx-li t-small" style={{ minHeight: 56 }}>
                        <span className="grow">{g.todos.length === 0 ? "Sin productos todavía." : "Todos están agotados."}</span>
                        {g.id !== SIN_CATEGORIA && (
                          <Link href={`/inventario/nuevo?cat=${g.id}`} className="nx-link">Agregar</Link>
                        )}
                      </div>
                    ) : g.filas.map((i) => (
                      <div key={i.p.id} className={`nx-li ${i.estado === "bajo" ? "is-low" : ""}`}>
                        <ProductoThumb nombre={i.p.nombre} imagenUrl={i.p.imagen_url} />
                        <div className="grow">
                          <Link href={`/inventario/${i.p.id}`} className="nx-li-title inv-name-link" style={{ display: "block", color: tinta(i) }}>{i.p.nombre}</Link>
                          <div className="nx-li-meta nx-num">{i.p.sku ?? "Sin SKU"} · {i.p.stock} uds · {formatCurrency(i.p.precio_venta)}</div>
                          <div style={{ marginTop: 4 }}><Badge estado={i.estado} /></div>
                        </div>
                        <button type="button" className="nx-iconbtn" aria-label={`Acciones de ${i.p.nombre}`} aria-haspopup="dialog" onClick={() => setHojaId(i.p.id)}>
                          <MoreVertical size={20} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Hoja de acciones (móvil) */}
      {hoja && (
        <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget) setHojaId(null) }}>
          <div className="nx-sheet" role="dialog" aria-modal="true" aria-labelledby="hoja-titulo" style={{ maxWidth: 520 }}>
            <div className="nx-sheet-grab" aria-hidden="true" />
            <div className="nx-row gap-8" style={{ padding: "14px 12px 8px 20px", alignItems: "flex-start" }}>
              <div className="grow">
                <div className="nx-modal-title" id="hoja-titulo">{hoja.p.nombre}</div>
                <div className="nx-modal-sub nx-mono">{hoja.p.sku ?? "Sin SKU"}</div>
              </div>
              <button type="button" className="nx-close" aria-label="Cerrar" onClick={() => setHojaId(null)} autoFocus>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <Link href={`/inventario/${hoja.p.id}/editar`} className="inv-sheetbtn"><Pencil size={22} aria-hidden="true" />Editar producto</Link>
            <Link href={`/inventario/${hoja.p.id}`} className="inv-sheetbtn"><History size={22} aria-hidden="true" />Ver historial de movimientos</Link>
            {hoja.estado === "agotado" && (
              <Link href={`/inventario/${hoja.p.id}?registrar=entrada`} className="inv-sheetbtn"><Plus size={22} aria-hidden="true" />Registrar entrada</Link>
            )}
            <button type="button" className="inv-sheetbtn" onClick={() => alternarPausa(hoja)} disabled={pendienteId === hoja.p.id}>
              {hoja.estado === "pausado" ? <Play size={22} aria-hidden="true" /> : <Pause size={22} aria-hidden="true" />}
              {pendienteId === hoja.p.id ? "Guardando…" : hoja.estado === "pausado" ? "Reactivar producto" : "Pausar producto"}
            </button>
            <button type="button" className="inv-sheetbtn is-danger" onClick={() => { setEliminarId(hoja.p.id); setHojaId(null) }}>
              <Trash2 size={22} aria-hidden="true" />Eliminar producto
            </button>
          </div>
        </div>
      )}

      {aEliminar && (
        <EliminarProductoDialog
          producto={{ id: aEliminar.p.id, nombre: aEliminar.p.nombre, estatus: aEliminar.p.estatus }}
          onClose={() => setEliminarId(null)}
          onDone={toast}
        />
      )}
    </div>
  )
}

function Badge({ estado }: { estado: EstadoInventario }) {
  const b = ESTADO_BADGE[estado]
  return <span className={`nx-badge ${b.cls}`}>{b.label}</span>
}
