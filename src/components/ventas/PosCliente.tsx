"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { ArrowLeft, Minus, Plus, Search, ShoppingCart, Trash2, X, User } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"
import { formatCurrency } from "@/lib/utils"
import { registrarVenta } from "@/actions/ventas"

export interface ProductoPos {
  id:          string
  nombre:      string
  sku:         string | null
  precio_venta: number
  stock:       number
  estatus:     string
  categoria:   { nombre: string; color: string | null }
  variantes:   { id: string; nombre: string; sku: string | null; stock: number; estatus: string }[]
}

type ModoPago = "completo" | "parcial" | "adeudo"
type FormaPago = "efectivo" | "tarjeta" | "transferencia"

interface LineaTicket {
  producto: ProductoPos
  variante?: ProductoPos["variantes"][number]
  cantidad:  number
}

const FORMAS_PAGO: { value: FormaPago; label: string }[] = [
  { value: "efectivo",      label: "Efectivo"     },
  { value: "tarjeta",       label: "Tarjeta"      },
  { value: "transferencia", label: "Transferencia" },
]

export function PosCliente({ productos }: { productos: ProductoPos[] }) {
  const router = useRouter()

  const [query,           setQuery]           = useState("")
  const [expandidoId,     setExpandidoId]     = useState<string | null>(null)
  const [lineas,          setLineas]          = useState<LineaTicket[]>([])
  const [modoPago,        setModoPago]        = useState<ModoPago>("completo")
  const [formaPago,       setFormaPago]       = useState<FormaPago>("efectivo")
  const [montoRecibido,   setMontoRecibido]   = useState("")
  const [clienteNombre,   setClienteNombre]   = useState("")
  const [clienteTelefono, setClienteTelefono] = useState("")
  const [notas,           setNotas]           = useState("")
  const [registrando,     setRegistrando]     = useState(false)
  const [exito,           setExito]           = useState(false)
  const [errorMsg,        setErrorMsg]        = useState("")

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return productos
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        p.categoria.nombre.toLowerCase().includes(q),
    )
  }, [query, productos])

  const total       = lineas.reduce((s, l) => s + l.producto.precio_venta * l.cantidad, 0)
  const totalLineas = lineas.reduce((s, l) => s + l.cantidad, 0)
  const montoNum    = parseFloat(montoRecibido) || 0
  const saldoPreview    = modoPago === "parcial" ? Math.max(0, total - montoNum) : 0
  const requiereCliente = modoPago === "parcial" || modoPago === "adeudo"

  function stockDisponible(producto: ProductoPos, variante?: ProductoPos["variantes"][number]) {
    if (variante) return variante.stock
    if (producto.variantes.length > 0) return 0
    return producto.stock
  }

  function cantidadEnTicket(productoId: string, varianteId?: string) {
    return lineas.find((l) => l.producto.id === productoId && l.variante?.id === varianteId)?.cantidad ?? 0
  }

  function agregar(producto: ProductoPos, variante?: ProductoPos["variantes"][number]) {
    const stockMax = stockDisponible(producto, variante)
    if (stockMax === 0) return
    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.producto.id === producto.id && l.variante?.id === variante?.id)
      if (idx >= 0) {
        const nueva = prev[idx].cantidad + 1
        if (nueva > stockMax) return prev
        return prev.map((l, i) => i === idx ? { ...l, cantidad: nueva } : l)
      }
      return [...prev, { producto, variante, cantidad: 1 }]
    })
    if (variante) setExpandidoId(null)
  }

  function cambiarCantidad(productoId: string, varianteId: string | undefined, delta: number) {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.producto.id !== productoId || l.variante?.id !== varianteId) return l
        const stockMax = stockDisponible(l.producto, l.variante)
        const nueva    = l.cantidad + delta
        if (nueva < 1 || nueva > stockMax) return l
        return { ...l, cantidad: nueva }
      })
    )
  }

  function quitar(productoId: string, varianteId?: string) {
    setLineas((prev) => prev.filter((l) => !(l.producto.id === productoId && l.variante?.id === varianteId)))
  }

  async function confirmarVenta() {
    if (lineas.length === 0 || registrando) return
    if (modoPago === "parcial" && montoNum <= 0) return
    if (requiereCliente && !clienteNombre.trim()) return

    setRegistrando(true)
    setErrorMsg("")

    try {
      const pagoInicial =
        modoPago === "completo" ? { monto: total, formaPago } :
        modoPago === "parcial"  ? { monto: montoNum, formaPago } :
        { monto: 0, formaPago: "adeudo" as const }

      await registrarVenta({
        lineas: lineas.map((l) => ({
          productoId:     l.producto.id,
          varianteId:     l.variante?.id,
          productoNombre: l.producto.nombre,
          varianteNombre: l.variante?.nombre,
          cantidad:       l.cantidad,
          precioUnitario: l.producto.precio_venta,
        })),
        pagoInicial,
        cliente: requiereCliente && clienteNombre.trim()
          ? { nombre: clienteNombre.trim(), telefono: clienteTelefono.trim() || undefined }
          : undefined,
        notas: notas.trim() || undefined,
      })

      setExito(true)
      await new Promise((r) => setTimeout(r, 800))
      router.push("/ventas")
      router.refresh()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al registrar la venta.")
      setRegistrando(false)
    }
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

          {/* Buscador */}
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
                  No se encontraron productos.
                </p>
              )}

              {resultados.map((producto) => {
                const tieneVariantes = producto.variantes.length > 0
                const sinStock       = !tieneVariantes && producto.stock === 0
                const estaExpandido  = expandidoId === producto.id

                return (
                  <div key={producto.id}>
                    <article
                      className="surface elevated"
                      style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12, padding: "12px 14px", opacity: sinStock ? 0.5 : 1 }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: producto.categoria.color ?? "var(--accent-gold)" }} />
                          <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{producto.nombre}</strong>
                          {tieneVariantes && <span className="badge" style={{ fontSize: 10, flexShrink: 0 }}>{producto.variantes.length} tallas</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="font-mono" style={{ fontSize: 14, color: "var(--accent-gold)" }}>{formatCurrency(producto.precio_venta)}</span>
                          <span style={{ color: "var(--text-tertiary)" }}>·</span>
                          {sinStock ? <EstatusBadge estatus="agotado" /> :
                            tieneVariantes ? <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{producto.stock} uds. totales</span> :
                            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{producto.stock} disponibles</span>}
                        </div>
                      </div>

                      {tieneVariantes ? (
                        <button
                          type="button"
                          className={estaExpandido ? "button button-primary" : "button"}
                          onClick={() => setExpandidoId(estaExpandido ? null : producto.id)}
                          style={{ height: 36, minHeight: 36, fontSize: 12, padding: "0 12px", flexShrink: 0 }}
                        >
                          {estaExpandido ? "Cerrar" : "Elegir talla"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button button-primary"
                          onClick={() => agregar(producto)}
                          disabled={sinStock || cantidadEnTicket(producto.id) >= producto.stock}
                          style={{ width: 36, height: 36, minHeight: 36, padding: 0, flexShrink: 0 }}
                        >
                          <Plus size={16} aria-hidden="true" />
                        </button>
                      )}
                    </article>

                    {tieneVariantes && estaExpandido && (
                      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "8px 12px", display: "grid", gap: 6 }}>
                        {producto.variantes.map((variante) => {
                          const enTicket = cantidadEnTicket(producto.id, variante.id)
                          const agotada  = variante.stock === 0
                          const sinMas   = enTicket >= variante.stock
                          return (
                            <div key={variante.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, background: "var(--surface-3)" }}>
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{variante.nombre}</span>
                                <span style={{ fontSize: 12, color: agotada ? "var(--error)" : "var(--text-secondary)", marginLeft: 8 }}>{agotada ? "Agotada" : `${variante.stock} disp.`}</span>
                              </div>
                              {enTicket > 0 && <span className="badge" style={{ fontSize: 11 }}>×{enTicket}</span>}
                              <button type="button" className="button button-primary" onClick={() => agregar(producto, variante)} disabled={agotada || sinMas} style={{ width: 32, height: 32, minHeight: 32, padding: 0 }}>
                                <Plus size={14} aria-hidden="true" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Ticket */}
          <aside className="surface" style={{ display: "grid", gridTemplateRows: "auto 1fr auto", padding: 20, gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShoppingCart size={17} color="var(--accent-gold)" aria-hidden="true" />
                <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Ticket</h2>
              </div>
              {lineas.length > 0 && (
                <button type="button" className="button" onClick={() => setLineas([])} style={{ padding: "0 10px", height: 32, minHeight: 32, fontSize: 12, color: "var(--text-secondary)" }}>
                  <X size={13} aria-hidden="true" /> Limpiar
                </button>
              )}
            </div>

            <div style={{ overflowY: "auto", display: "grid", alignContent: "start", gap: 10 }}>
              {lineas.length === 0 ? (
                <p style={{ color: "var(--text-tertiary)", fontSize: 13, textAlign: "center", padding: "28px 0" }}>Agrega productos desde el buscador.</p>
              ) : (
                lineas.map((linea) => (
                  <div key={`${linea.producto.id}-${linea.variante?.id ?? "solo"}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                        {linea.producto.nombre}
                        {linea.variante && <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: 6 }}>— {linea.variante.nombre}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                        <button type="button" className="button" onClick={() => cambiarCantidad(linea.producto.id, linea.variante?.id, -1)} disabled={linea.cantidad <= 1} style={{ width: 28, height: 28, minHeight: 28, padding: 0 }}><Minus size={12} /></button>
                        <span className="font-mono" style={{ fontSize: 14, minWidth: 22, textAlign: "center" }}>{linea.cantidad}</span>
                        <button type="button" className="button" onClick={() => cambiarCantidad(linea.producto.id, linea.variante?.id, 1)} disabled={linea.cantidad >= stockDisponible(linea.producto, linea.variante)} style={{ width: 28, height: 28, minHeight: 28, padding: 0 }}><Plus size={12} /></button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <button type="button" onClick={() => quitar(linea.producto.id, linea.variante?.id)} style={{ background: "none", border: "none", padding: 2, color: "var(--text-tertiary)", cursor: "pointer" }}><Trash2 size={14} /></button>
                      <span className="font-mono" style={{ fontSize: 14 }}>{formatCurrency(linea.producto.precio_venta * linea.cantidad)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {lineas.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 4 }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{totalLineas} {totalLineas === 1 ? "producto" : "productos"}</span>
                  <span className="font-mono" style={{ fontSize: 22 }}>{formatCurrency(total)}</span>
                </div>
              )}

              <div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Modo de pago</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {(["completo", "parcial", "adeudo"] as ModoPago[]).map((modo) => (
                    <button key={modo} type="button" onClick={() => setModoPago(modo)} style={{ padding: "7px 0", borderRadius: 6, fontSize: 12, fontWeight: 500, border: `1px solid ${modoPago === modo ? "var(--accent-gold)" : "var(--border-subtle)"}`, background: modoPago === modo ? "var(--accent-gold-subtle)" : "var(--surface-3)", color: modoPago === modo ? "var(--accent-gold)" : "var(--text-secondary)", cursor: "pointer" }}>
                      {modo.charAt(0).toUpperCase() + modo.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {modoPago !== "adeudo" && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Forma de pago</div>
                  <select className="input" value={formaPago} onChange={(e) => setFormaPago(e.target.value as FormaPago)}>
                    {FORMAS_PAGO.map((fp) => <option key={fp.value} value={fp.value}>{fp.label}</option>)}
                  </select>
                </div>
              )}

              {modoPago === "parcial" && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Monto recibido</div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", fontSize: 13 }}>$</span>
                    <input className="input" type="number" min="0" step="0.01" value={montoRecibido} onChange={(e) => setMontoRecibido(e.target.value)} placeholder="0.00" style={{ paddingLeft: 24 }} />
                  </div>
                  {montoNum > 0 && saldoPreview > 0 && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--warning)" }}>Saldo pendiente: <strong>{formatCurrency(saldoPreview)}</strong></div>
                  )}
                </div>
              )}

              {requiereCliente && (
                <div style={{ display: "grid", gap: 8, padding: 12, borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--surface-3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <User size={13} color="var(--text-secondary)" aria-hidden="true" />
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>Datos del deudor</span>
                  </div>
                  <input className="input" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Nombre *" style={{ fontSize: 13 }} />
                  <input className="input" value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} placeholder="Teléfono (opcional)" style={{ fontSize: 13 }} />
                </div>
              )}

              <input className="input" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas opcionales…" style={{ fontSize: 13 }} />

              {errorMsg && (
                <div style={{ padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(155,74,74,0.4)", background: "rgba(155,74,74,0.1)", color: "var(--error)", fontSize: 13 }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                className="button button-primary"
                onClick={confirmarVenta}
                disabled={lineas.length === 0 || registrando || exito || (modoPago === "parcial" && montoNum <= 0) || (requiereCliente && !clienteNombre.trim())}
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
