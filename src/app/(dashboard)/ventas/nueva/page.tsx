"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { ArrowLeft, Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"
import { formatCurrency } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { FormaPago } from "@/types/finanzas.types"
import type { Producto } from "@/types/inventario.types"

interface LineaTicket {
  producto: Producto
  cantidad: number
}

const FORMAS_PAGO: { value: FormaPago; label: string }[] = [
  { value: "efectivo",     label: "Efectivo"      },
  { value: "tarjeta",      label: "Tarjeta"        },
  { value: "transferencia",label: "Transferencia"  },
  { value: "adeudo",       label: "Adeudo"         },
]

export default function NuevaVentaPage() {
  const router = useRouter()
  const { productos: todosProductos, registrarVenta } = useStore()
  const [query,       setQuery]       = useState("")
  const [lineas,      setLineas]      = useState<LineaTicket[]>([])
  const [formaPago,   setFormaPago]   = useState<FormaPago>("efectivo")
  const [registrando, setRegistrando] = useState(false)
  const [exito,       setExito]       = useState(false)

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return todosProductos
    return todosProductos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoria.nombre.toLowerCase().includes(q),
    )
  }, [query, todosProductos])

  function cantidadEnTicket(id: string) {
    return lineas.find((l) => l.producto.id === id)?.cantidad ?? 0
  }

  function agregar(producto: Producto) {
    if (producto.stock === 0) return
    setLineas((prev) => {
      const existe = prev.find((l) => l.producto.id === producto.id)
      if (existe) {
        const nueva = existe.cantidad + 1
        if (nueva > producto.stock) return prev
        return prev.map((l) => l.producto.id === producto.id ? { ...l, cantidad: nueva } : l)
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  function cambiarCantidad(id: string, delta: number) {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.producto.id !== id) return l
        const nueva = l.cantidad + delta
        if (nueva < 1 || nueva > l.producto.stock) return l
        return { ...l, cantidad: nueva }
      }),
    )
  }

  function quitar(id: string) {
    setLineas((prev) => prev.filter((l) => l.producto.id !== id))
  }

  const total       = lineas.reduce((s, l) => s + l.producto.precioVenta * l.cantidad, 0)
  const totalLineas = lineas.reduce((s, l) => s + l.cantidad, 0)

  async function confirmarVenta() {
    if (lineas.length === 0 || registrando) return
    setRegistrando(true)
    registrarVenta({
      lineas: lineas.map((l) => ({
        productoId:      l.producto.id,
        productoNombre:  l.producto.nombre,
        cantidad:        l.cantidad,
        precioUnitario:  l.producto.precioVenta,
      })),
      formaPago,
    })
    setRegistrando(false)
    setExito(true)
    await new Promise((r) => setTimeout(r, 1000))
    router.push("/ventas")
  }

  return (
    <>
      <Navbar title="Nueva venta" hideActions />
      <div className="page" style={{ paddingTop: 16 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Link href="/ventas" className="button" style={{ padding: "0 12px", flexShrink: 0 }} aria-label="Volver">
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            Agrega productos al ticket y confirma la venta.
          </p>
        </div>

        <div className="pos-grid">

          {/* ── Buscador ───────────────────────────────────────────────────── */}
          <section style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 12, minHeight: 0 }}>
            <div style={{ position: "relative" }}>
              <Search size={15} aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
              <input
                className="input"
                type="search"
                placeholder="Buscar por nombre, SKU o categoría…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar producto"
                style={{ paddingLeft: 38 }}
                autoFocus
              />
            </div>

            <div style={{ overflowY: "auto", display: "grid", alignContent: "start", gap: 6 }}>
              {resultados.length === 0 && (
                <p style={{ color: "var(--text-secondary)", fontSize: 14, padding: "20px 0" }}>
                  No se encontraron productos con ese criterio.
                </p>
              )}

              {resultados.map((producto) => {
                const enTicket  = cantidadEnTicket(producto.id)
                const sinStock  = producto.stock === 0
                const agotado   = enTicket >= producto.stock && !sinStock

                return (
                  <article
                    key={producto.id}
                    className="surface elevated"
                    style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12, padding: "12px 14px", opacity: sinStock ? 0.5 : 1 }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: producto.categoria.color ?? "var(--accent-gold)" }} />
                        <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {producto.nombre}
                        </strong>
                        {enTicket > 0 && (
                          <span className="badge" style={{ background: "var(--accent-gold-subtle)", color: "var(--accent-gold)", fontSize: 11, flexShrink: 0 }}>
                            ×{enTicket}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="font-mono" style={{ fontSize: 14, color: "var(--accent-gold)" }}>
                          {formatCurrency(producto.precioVenta)}
                        </span>
                        <span style={{ color: "var(--text-tertiary)" }}>·</span>
                        {sinStock ? (
                          <EstatusBadge estatus="agotado" />
                        ) : (
                          <span style={{ fontSize: 12, color: agotado ? "var(--warning)" : "var(--text-secondary)" }}>
                            {agotado ? "Sin más stock" : `${producto.stock} disponibles`}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => agregar(producto)}
                      disabled={sinStock || agotado}
                      aria-label={`Agregar ${producto.nombre}`}
                      style={{ width: 36, height: 36, minHeight: 36, padding: 0, flexShrink: 0 }}
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </article>
                )
              })}
            </div>
          </section>

          {/* ── Ticket ─────────────────────────────────────────────────────── */}
          <aside className="surface" style={{ display: "grid", gridTemplateRows: "auto 1fr auto", padding: 20, gap: 16 }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShoppingCart size={17} color="var(--accent-gold)" aria-hidden="true" />
                <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Ticket</h2>
              </div>
              {lineas.length > 0 && (
                <button
                  type="button"
                  className="button"
                  onClick={() => setLineas([])}
                  style={{ padding: "0 10px", height: 32, minHeight: 32, fontSize: 12, color: "var(--text-secondary)" }}
                >
                  <X size={13} aria-hidden="true" />
                  Limpiar
                </button>
              )}
            </div>

            <div style={{ overflowY: "auto", display: "grid", alignContent: "start", gap: 10 }}>
              {lineas.length === 0 ? (
                <p style={{ color: "var(--text-tertiary)", fontSize: 13, textAlign: "center", padding: "28px 0" }}>
                  Agrega productos desde el buscador.
                </p>
              ) : (
                lineas.map((linea) => (
                  <div
                    key={linea.producto.id}
                    style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 8 }}>
                        {linea.producto.nombre}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button type="button" className="button" onClick={() => cambiarCantidad(linea.producto.id, -1)} disabled={linea.cantidad <= 1} aria-label="Reducir" style={{ width: 28, height: 28, minHeight: 28, padding: 0 }}>
                          <Minus size={12} aria-hidden="true" />
                        </button>
                        <span className="font-mono" style={{ fontSize: 14, minWidth: 22, textAlign: "center" }}>{linea.cantidad}</span>
                        <button type="button" className="button" onClick={() => cambiarCantidad(linea.producto.id, 1)} disabled={linea.cantidad >= linea.producto.stock} aria-label="Aumentar" style={{ width: 28, height: 28, minHeight: 28, padding: 0 }}>
                          <Plus size={12} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <button type="button" onClick={() => quitar(linea.producto.id)} aria-label={`Quitar ${linea.producto.nombre}`} style={{ background: "none", border: "none", padding: 2, color: "var(--text-tertiary)", cursor: "pointer" }}>
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                      <span className="font-mono" style={{ fontSize: 14 }}>{formatCurrency(linea.producto.precioVenta * linea.cantidad)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {lineas.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 4 }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    {totalLineas} {totalLineas === 1 ? "producto" : "productos"}
                  </span>
                  <span className="font-mono" style={{ fontSize: 22 }}>{formatCurrency(total)}</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Forma de pago
                </label>
                <select className="input" value={formaPago} onChange={(e) => setFormaPago(e.target.value as FormaPago)} aria-label="Forma de pago">
                  {FORMAS_PAGO.map((fp) => (
                    <option key={fp.value} value={fp.value}>{fp.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="button button-primary"
                onClick={confirmarVenta}
                disabled={lineas.length === 0 || registrando || exito}
                style={{ width: "100%", fontSize: 15, minHeight: 46 }}
              >
                {exito ? "¡Venta registrada ✓" : registrando ? "Registrando…" : "Registrar venta"}
              </button>
            </div>
          </aside>

        </div>
      </div>
    </>
  )
}
