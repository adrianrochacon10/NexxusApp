"use client"

import "@/styles/pos.css"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, ChevronLeft, Search, ShoppingBag, StickyNote } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatCurrency } from "@/lib/utils"
import { registrarVenta } from "@/actions/ventas"
import { exigirOk } from "@/lib/action-result"
import { ProductoTile } from "./pos/ProductoTile"
import { TicketLinea } from "./pos/TicketLinea"
import { VariantePicker } from "./pos/VariantePicker"
import { PosToast, type ToastData } from "./pos/PosToast"
import {
  SIN_CATEGORIA,
  claveLinea,
  piezasTexto,
  stockDisponible,
  type FormaPago,
  type LineaTicket,
  type ModoPago,
  type ProductoPos,
  type VariantePos,
} from "./pos/types"

export type { ProductoPos } from "./pos/types"

const MODOS: { value: ModoPago; label: string }[] = [
  { value: "completo", label: "Completo"  },
  { value: "parcial",  label: "Parcial"   },
  { value: "credito",  label: "A crédito" },
]

const FORMAS: { value: FormaPago | "credito"; label: string; short: string }[] = [
  { value: "efectivo",      label: "Efectivo",      short: "Efectivo" },
  { value: "transferencia", label: "Transferencia", short: "Transf."  },
  { value: "tarjeta",       label: "Tarjeta",       short: "Tarjeta"  },
  { value: "credito",       label: "A crédito",     short: "A crédito" },
]

const TODAS = "Todas"

function parseMonto(v: string) {
  return parseFloat(v.replace(/[$,\s]/g, ""))
}

export function PosCliente({ productos }: { productos: ProductoPos[] }) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  const [vista,           setVista]           = useState<"catalogo" | "ticket">("catalogo")
  const [query,           setQuery]           = useState("")
  const [categoria,       setCategoria]       = useState(TODAS)
  const [pickerId,        setPickerId]        = useState<string | null>(null)
  const [lineas,          setLineas]          = useState<LineaTicket[]>([])
  const [modo,            setModo]            = useState<ModoPago>("completo")
  const [forma,           setForma]           = useState<FormaPago>("efectivo")
  const [abono,           setAbono]           = useState("")
  const [clienteNombre,   setClienteNombre]   = useState("")
  const [clienteTelefono, setClienteTelefono] = useState("")
  const [notas,           setNotas]           = useState("")
  const [verNotas,        setVerNotas]        = useState(false)
  const [intentado,       setIntentado]       = useState(false)
  const [registrando,     setRegistrando]     = useState(false)
  const llaveVenta = useRef<string>("")
  const [errorMsg,        setErrorMsg]        = useState("")
  const [toast,           setToast]           = useState<ToastData | null>(null)

  // Enfoca el buscador solo en escritorio/tablet (en móvil abriría el teclado)
  useEffect(() => {
    if (window.matchMedia("(min-width: 721px)").matches) searchRef.current?.focus()
  }, [])

  // Cierre automático de avisos
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.tone === "ok" ? 8000 : 4500)
    return () => clearTimeout(t)
  }, [toast])

  /* ---------- catálogo ---------- */
  const categorias = useMemo(() => {
    const set = new Set(productos.map((p) => p.categoria.nombre || SIN_CATEGORIA))
    return [TODAS, ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))]
  }, [productos])

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return productos.filter((p) => {
      const cat = p.categoria.nombre || SIN_CATEGORIA
      if (categoria !== TODAS && cat !== categoria) return false
      if (!q) return true
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        p.categoria.nombre.toLowerCase().includes(q) ||
        p.variantes.some((v) => (v.sku ?? "").toLowerCase().includes(q))
      )
    })
  }, [query, categoria, productos])

  const productoPicker = pickerId ? productos.find((p) => p.id === pickerId) ?? null : null

  /* ---------- ticket ---------- */
  const total  = lineas.reduce((s, l) => s + l.producto.precio_venta * l.cantidad, 0)
  const piezas = lineas.reduce((s, l) => s + l.cantidad, 0)
  const vacio  = lineas.length === 0

  const cantidadEnTicket = useCallback(
    (productoId: string, varianteId?: string) =>
      lineas.find((l) => claveLinea(l.producto.id, l.variante?.id) === claveLinea(productoId, varianteId))?.cantidad ?? 0,
    [lineas],
  )

  function agregar(producto: ProductoPos, variante?: VariantePos) {
    const max = stockDisponible(producto, variante)
    const actual = cantidadEnTicket(producto.id, variante?.id)
    setPickerId(null)
    if (max <= 0) return
    if (actual >= max) {
      setToast({
        tone:  "warn",
        title: "Límite de stock alcanzado",
        text:  `Solo hay ${max} de ${producto.nombre}${variante ? ` (${variante.nombre})` : ""}.`,
      })
      return
    }
    setToast((t) => (t?.tone === "warn" ? null : t))
    setLineas((prev) => {
      const key = claveLinea(producto.id, variante?.id)
      const idx = prev.findIndex((l) => claveLinea(l.producto.id, l.variante?.id) === key)
      if (idx >= 0) return prev.map((l, i) => (i === idx ? { ...l, cantidad: l.cantidad + 1 } : l))
      return [...prev, { producto, variante, cantidad: 1 }]
    })
  }

  function elegirProducto(producto: ProductoPos) {
    if (producto.variantes.length > 0) setPickerId(producto.id)
    else agregar(producto)
  }

  function cambiarCantidad(key: string, delta: number) {
    setLineas((prev) =>
      prev.map((l) => {
        if (claveLinea(l.producto.id, l.variante?.id) !== key) return l
        const nueva = l.cantidad + delta
        if (nueva < 1 || nueva > stockDisponible(l.producto, l.variante)) return l
        return { ...l, cantidad: nueva }
      }),
    )
  }

  function quitar(key: string) {
    setLineas((prev) => prev.filter((l) => claveLinea(l.producto.id, l.variante?.id) !== key))
  }

  const cerrarPicker = useCallback(() => setPickerId(null), [])
  const cerrarToast  = useCallback(() => setToast(null), [])

  /* ---------- cobro ---------- */
  function elegirModo(m: ModoPago) {
    setModo(m)
    setIntentado(false)
    setErrorMsg("")
  }

  function elegirForma(f: FormaPago | "credito") {
    if (f === "credito") { elegirModo("credito"); return }
    setForma(f)
    if (modo === "credito") elegirModo("completo")
  }

  const abonoNum       = parseMonto(abono)
  const requiereCliente = modo !== "completo"
  const pagadoAhora    = modo === "completo" ? total : modo === "credito" ? 0 : (isNaN(abonoNum) ? 0 : Math.min(abonoNum, total))
  const saldo          = Math.max(0, total - pagadoAhora)

  let abonoErr = ""
  if (modo === "parcial") {
    if (abono !== "" && !isNaN(abonoNum) && total > 0 && abonoNum >= total) {
      abonoErr = abonoNum > total
        ? `El abono no puede ser mayor al total (${formatCurrency(total)}).`
        : "Es el total: usa el modo Completo."
    } else if (intentado && (isNaN(abonoNum) || abonoNum <= 0)) {
      abonoErr = "Escribe cuánto abona el cliente ahora."
    }
  }
  const nombreErr = requiereCliente && intentado && !clienteNombre.trim()

  const cobrarLabel =
    registrando        ? "Registrando…" :
    vacio              ? "Cobrar" :
    modo === "completo" ? `Cobrar ${formatCurrency(total)}` :
    modo === "parcial"  ? `Cobrar abono${pagadoAhora > 0 ? ` ${formatCurrency(pagadoAhora)}` : ""}` :
                          "Registrar a crédito"

  function resetCobro() {
    setLineas([])
    setModo("completo")
    setForma("efectivo")
    setAbono("")
    setClienteNombre("")
    setClienteTelefono("")
    setNotas("")
    setVerNotas(false)
    setIntentado(false)
  }

  async function cobrar() {
    if (vacio || registrando) return
    const invalido =
      (requiereCliente && !clienteNombre.trim()) ||
      (modo === "parcial" && (isNaN(abonoNum) || abonoNum <= 0 || abonoNum >= total))
    if (invalido) { setIntentado(true); return }

    setRegistrando(true)
    setErrorMsg("")

    const pagoInicial =
      modo === "completo" ? { monto: total, formaPago: forma } :
      modo === "parcial"  ? { monto: abonoNum, formaPago: forma } :
                            { monto: 0, formaPago: "adeudo" as const }
    const nombre = clienteNombre.trim()
    const formaLabel = FORMAS.find((f) => f.value === forma)?.label ?? forma

    try {
      // Precio y stock los valida el servidor; la llave evita cobrar dos veces
      // si hay doble toque o se reintenta tras un error de red.
      const { ventaId, folio } = exigirOk(await registrarVenta({
        lineas: lineas.map((l) => ({
          productoId: l.producto.id,
          varianteId: l.variante?.id,
          cantidad:   l.cantidad,
        })),
        pagoInicial,
        cliente: requiereCliente && nombre
          ? { nombre, telefono: clienteTelefono.trim() || undefined }
          : undefined,
        notas: notas.trim() || undefined,
        idempotencyKey: (llaveVenta.current ||= crypto.randomUUID()),
      }))
      llaveVenta.current = "" // siguiente ticket, llave nueva

      setToast({
        tone:  "ok",
        title: `Venta ${folio} registrada`,
        text:
          modo === "completo" ? `Cobrado ${formatCurrency(total)} · ${formaLabel}` :
          modo === "parcial"  ? `Cobrado ${formatCurrency(abonoNum)} · Saldo ${formatCurrency(total - abonoNum)} a nombre de ${nombre}` :
                                `A crédito · ${formatCurrency(total)} pendiente de ${nombre}`,
        href:      `/ventas/${ventaId}`,
        hrefLabel: "Ver venta",
      })
      resetCobro()
      setVista("catalogo")
      router.refresh() // recarga el stock actualizado
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al registrar la venta.")
    } finally {
      setRegistrando(false)
    }
  }

  /* ---------- render ---------- */
  const hayFiltro = query.trim() !== "" || categoria !== TODAS

  return (
    <div className="pos-screen" data-view={vista}>
      <PosToast toast={toast} onClose={cerrarToast} />

      {/* ===== Catálogo ===== */}
      <section className="pos-catalog" aria-label="Catálogo">
        <div className="pos-head">
          <div>
            <div className="t-cap">Ventas</div>
            <h1 className="t-h1">Nueva venta</h1>
          </div>
          <div className="grow pos-head-spacer" />
          <div className="nx-affix pos-search">
            <span className="ic"><Search size={20} aria-hidden="true" /></span>
            <input
              ref={searchRef}
              className="nx-input has-ic"
              type="search"
              aria-label="Buscar producto"
              placeholder="Nombre, SKU o categoría"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {categorias.length > 2 && (
          <div className="pos-chips" role="group" aria-label="Categorías">
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                className={`nx-chip${categoria === c ? " is-on" : ""}`}
                aria-pressed={categoria === c}
                onClick={() => setCategoria(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="pos-results">
          {productos.length === 0 ? (
            <EmptyState
              title="Aún no hay productos"
              description="Da de alta productos en inventario para poder venderlos."
              actionHref="/inventario/nuevo"
              actionLabel="Agregar producto"
            />
          ) : resultados.length === 0 ? (
            <EmptyState
              title={query.trim() ? `Sin resultados para “${query.trim()}”` : "Sin productos en esta categoría"}
              description="Revisa la ortografía o busca por SKU o categoría."
              icon={<Search size={28} strokeWidth={1.8} />}
              action={
                hayFiltro ? (
                  <button type="button" className="nx-btn nx-btn-secondary" onClick={() => { setQuery(""); setCategoria(TODAS) }}>
                    Limpiar búsqueda
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="pos-tiles">
              {resultados.map((p) => (
                <ProductoTile key={p.id} producto={p} onPick={elegirProducto} />
              ))}
            </div>
          )}
        </div>

        {/* Barra móvil: ir al ticket */}
        <div className="pos-mbar">
          <button
            type="button"
            className="nx-btn nx-btn-primary nx-btn-lg nx-btn-block"
            style={{ justifyContent: "space-between" }}
            disabled={vacio}
            onClick={() => { setVista("ticket"); setToast(null) }}
          >
            <span>{vacio ? "Ticket vacío" : `Ver ticket · ${piezasTexto(piezas)}`}</span>
            <span className="nx-num">{formatCurrency(total)}</span>
          </button>
        </div>
      </section>

      {/* ===== Ticket ===== */}
      <aside className="pos-ticket" aria-label="Ticket">
        <div className="pos-ticket-head nx-row gap-8">
          <button
            type="button"
            className="nx-btn nx-btn-ghost nx-btn-icon pos-back"
            aria-label="Volver al catálogo"
            onClick={() => setVista("catalogo")}
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <div className="grow">
            <h2 className="t-h2">Ticket</h2>
            <div className="t-small">{vacio ? "Sin productos" : piezasTexto(piezas)}</div>
          </div>
          {!vacio && (
            <button type="button" className="nx-btn nx-btn-ghost nx-btn-sm" onClick={() => { setLineas([]); setIntentado(false) }}>
              Vaciar
            </button>
          )}
        </div>

        <div className="pos-lines">
          {vacio ? (
            <div className="nx-empty" style={{ padding: "32px 24px" }}>
              <div className="nx-empty-ic" style={{ width: 56, height: 56 }} aria-hidden="true">
                <ShoppingBag size={26} strokeWidth={1.8} />
              </div>
              <div className="ttl" style={{ fontSize: 16 }}>Ticket vacío</div>
              <div className="txt" style={{ margin: 0 }}>Toca un producto para agregarlo.</div>
              <button type="button" className="nx-btn nx-btn-secondary pos-back" style={{ marginTop: 12 }} onClick={() => setVista("catalogo")}>
                Ir al catálogo
              </button>
            </div>
          ) : (
            lineas.map((l) => {
              const key = claveLinea(l.producto.id, l.variante?.id)
              return (
                <TicketLinea
                  key={key}
                  linea={l}
                  onDelta={(d) => cambiarCantidad(key, d)}
                  onQuitar={() => quitar(key)}
                />
              )
            })
          )}
        </div>

        <div className="pos-pay">
          <div className="nx-seg" role="group" aria-label="Modo de cobro">
            {MODOS.map((m) => (
              <button
                key={m.value}
                type="button"
                className={modo === m.value ? "is-on" : ""}
                aria-pressed={modo === m.value}
                onClick={() => elegirModo(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="pos-formas" role="group" aria-label="Forma de pago">
            {FORMAS.map((f) => {
              const on = f.value === "credito" ? modo === "credito" : modo !== "credito" && forma === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  className={`nx-chip${on ? " is-on" : ""}`}
                  aria-pressed={on}
                  aria-label={f.label}
                  onClick={() => elegirForma(f.value)}
                >
                  <span className="pos-forma-short" aria-hidden="true">{f.short}</span>
                  <span className="pos-forma-long" aria-hidden="true">{f.label}</span>
                </button>
              )
            })}
          </div>

          {modo === "parcial" && (
            <div className="nx-field">
              <label className="nx-label" htmlFor="pos-abono">Abono ahora</label>
              <div className="nx-affix">
                <span className="pre">$</span>
                <input
                  id="pos-abono"
                  className={`nx-input has-pre nx-num${abonoErr ? " is-error" : ""}`}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={abono}
                  onChange={(e) => setAbono(e.target.value)}
                  aria-invalid={!!abonoErr}
                  aria-describedby={abonoErr ? "pos-abono-err" : undefined}
                />
              </div>
              {abonoErr && (
                <span className="nx-error" id="pos-abono-err">
                  <AlertCircle size={16} aria-hidden="true" /><span>{abonoErr}</span>
                </span>
              )}
            </div>
          )}

          {requiereCliente && (
            <>
              <div className="pos-cliente">
                <div className="nx-field">
                  <label className="nx-label" htmlFor="pos-cliente">Cliente<i>*</i></label>
                  <input
                    id="pos-cliente"
                    className={`nx-input${nombreErr ? " is-error" : ""}`}
                    placeholder="Nombre del cliente"
                    autoComplete="off"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    aria-invalid={nombreErr}
                    aria-describedby={nombreErr ? "pos-cliente-err" : undefined}
                  />
                </div>
                <div className="nx-field">
                  <label className="nx-label" htmlFor="pos-tel">Teléfono (opcional)</label>
                  <input
                    id="pos-tel"
                    className="nx-input nx-num"
                    type="tel"
                    inputMode="tel"
                    placeholder="618 123 4567"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                  />
                </div>
              </div>
              {nombreErr && (
                <span className="nx-error" id="pos-cliente-err" style={{ marginTop: -6 }}>
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>Escribe el nombre del cliente para dejar saldo pendiente.</span>
                </span>
              )}
            </>
          )}

          {verNotas ? (
            <div className="nx-field">
              <label className="nx-label" htmlFor="pos-notas">Nota (opcional)</label>
              <input
                id="pos-notas"
                className="nx-input"
                placeholder="Ej. apartado, cambio de talla…"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <button type="button" className="nx-link" style={{ alignSelf: "flex-start", gap: 6, marginTop: -8, marginBottom: -8 }} onClick={() => setVerNotas(true)}>
              <StickyNote size={16} aria-hidden="true" /> Agregar nota
            </button>
          )}

          {errorMsg && (
            <div className="nx-alert is-bad" role="alert">
              <AlertCircle size={20} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
              <div>
                <div className="ttl">No se pudo registrar la venta</div>
                <div className="txt">{errorMsg}</div>
              </div>
            </div>
          )}

          <div className="pos-checkout">
            <div className="nx-col gap-4">
              <div className="nx-row" style={{ justifyContent: "space-between" }}>
                <span className="t-small">
                  Total<span className="pos-checkout-pieces">{vacio ? "" : ` · ${piezasTexto(piezas)}`}</span>
                </span>
                <span className="nx-num t-h2">{formatCurrency(total)}</span>
              </div>
              {!vacio && modo !== "completo" && (
                <div className="nx-row" style={{ justifyContent: "space-between" }}>
                  <span className="t-small">Saldo pendiente</span>
                  <span className="nx-num t-h3" style={{ color: "var(--nx-warn-fg)" }}>{formatCurrency(saldo)}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="nx-btn nx-btn-primary nx-btn-lg nx-btn-block"
              disabled={vacio || registrando}
              aria-busy={registrando}
              onClick={cobrar}
            >
              {cobrarLabel}
            </button>
          </div>
        </div>
      </aside>

      {productoPicker && (
        <VariantePicker
          producto={productoPicker}
          enTicket={(vid) => cantidadEnTicket(productoPicker.id, vid)}
          onPick={(v) => agregar(productoPicker, v)}
          onClose={cerrarPicker}
        />
      )}
    </div>
  )
}
