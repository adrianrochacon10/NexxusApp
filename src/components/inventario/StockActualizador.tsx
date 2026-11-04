"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, ChevronDown, Minus, PackagePlus, Plus } from "lucide-react"
import { ajustarStock } from "@/actions/inventario"
import { useInventarioToast } from "@/components/inventario/InventarioToast"
import type { TipoMovimientoStock } from "@/types/inventario.types"

export interface VarianteStock {
  id:     string
  nombre: string
  stock:  number
}

const TIPOS: { value: TipoMovimientoStock; label: string }[] = [
  { value: "entrada", label: "Entrada" },
  { value: "salida",  label: "Salida" },
  { value: "ajuste",  label: "Ajuste" },
]

interface StockActualizadorProps {
  productoId:      string
  productoNombre:  string
  /** Stock del producto (se usa cuando no hay variantes). */
  stockActual:     number
  variantes?:      VarianteStock[]
  tipoInicial?:    TipoMovimientoStock
  label?:          string
  className?:      string
  /** Abre el diálogo al montar (p. ej. al llegar desde "Registrar entrada"). */
  abrirAlInicio?:  boolean
}

/** Botón que abre el diálogo para registrar entradas, salidas o ajustes de stock. */
export function StockActualizador({
  productoId, productoNombre, stockActual, variantes = [], tipoInicial = "entrada",
  label = "Registrar entrada", className = "nx-btn nx-btn-primary", abrirAlInicio = false,
}: StockActualizadorProps) {
  const [abierto, setAbierto] = useState(abrirAlInicio)
  return (
    <>
      <button type="button" className={className} onClick={() => setAbierto(true)} aria-haspopup="dialog">
        <PackagePlus size={20} aria-hidden="true" />
        {label}
      </button>
      {abierto && (
        <StockMovimientoDialog
          productoId={productoId}
          productoNombre={productoNombre}
          stockActual={stockActual}
          variantes={variantes}
          tipoInicial={tipoInicial}
          onClose={() => setAbierto(false)}
        />
      )}
    </>
  )
}

interface StockMovimientoDialogProps {
  productoId:         string
  productoNombre:     string
  stockActual:        number
  variantes:          VarianteStock[]
  tipoInicial?:       TipoMovimientoStock
  varianteInicialId?: string
  onClose:            () => void
}

export function StockMovimientoDialog({
  productoId, productoNombre, stockActual, variantes, tipoInicial = "entrada", varianteInicialId, onClose,
}: StockMovimientoDialogProps) {
  const router = useRouter()
  const toast = useInventarioToast()
  const [pending, startTransition] = useTransition()
  const [tipo, setTipo] = useState<TipoMovimientoStock>(tipoInicial)
  const [varianteId, setVarianteId] = useState(varianteInicialId ?? variantes[0]?.id ?? "")
  const [cantidad, setCantidad] = useState("")
  const [notas, setNotas] = useState("")
  const [intentado, setIntentado] = useState(false)
  const [errorServidor, setErrorServidor] = useState("")
  const cantidadRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    cantidadRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !pending) onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose, pending])

  const conVariantes = variantes.length > 0
  const variante = variantes.find((v) => v.id === varianteId)
  const antes = conVariantes ? variante?.stock ?? 0 : stockActual
  const n = Number(cantidad)
  // Ajuste = stock contado (puede ser 0); entrada/salida = piezas que se mueven (> 0)
  const valido = cantidad.trim() !== "" && Number.isInteger(n) && (tipo === "ajuste" ? n >= 0 : n > 0)
  const despues = !valido ? null : tipo === "entrada" ? antes + n : tipo === "salida" ? antes - n : n
  const sinCambio = tipo === "ajuste" && despues === antes

  let errorCantidad = ""
  if (intentado && !valido) errorCantidad = tipo === "ajuste" ? "Escribe el stock que contaste (0 o más)." : "Escribe una cantidad entera mayor a 0."
  else if (despues !== null && despues < 0) errorCantidad = `Solo hay ${antes} ${antes === 1 ? "unidad" : "unidades"}: no puedes sacar ${n}.`
  else if (intentado && sinCambio) errorCantidad = "El stock contado es igual al actual; no hay nada que ajustar."

  function ajustar(delta: number) {
    const actual = Number.isInteger(n) && n > 0 ? n : 0
    setCantidad(String(Math.max(1, actual + delta)))
  }

  function registrar(e: { preventDefault: () => void }) {
    e.preventDefault()
    setIntentado(true)
    setErrorServidor("")
    if (!valido || sinCambio || (despues !== null && despues < 0) || (conVariantes && !variante)) return
    startTransition(async () => {
      // El servidor revalida y bloquea la fila: es la fuente de verdad del stock
      const res = await ajustarStock({
        productoId,
        varianteId: conVariantes ? varianteId : undefined,
        tipo,
        cantidad: n,
        notas: notas.trim(),
      }).catch(() => null)
      if (!res?.ok) {
        setErrorServidor(res?.error ?? "No se pudo registrar el movimiento.")
        return
      }
      const etiqueta = TIPOS.find((t) => t.value === tipo)?.label ?? "Movimiento"
      toast(`${etiqueta} registrada: ${conVariantes ? `${variante?.nombre} ` : ""}queda en ${res.data.stock} uds`)
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget && !pending) onClose() }}>
      <form className="nx-modal" role="dialog" aria-modal="true" aria-labelledby="mov-title" style={{ maxWidth: 460 }} onSubmit={registrar} noValidate>
        <div className="nx-modal-head">
          <div className="grow">
            <div className="nx-modal-title" id="mov-title">Registrar movimiento</div>
            <div className="nx-modal-sub">{productoNombre}</div>
          </div>
        </div>
        <div className="nx-modal-body">
          <div className="nx-seg" role="group" aria-label="Tipo de movimiento">
            {TIPOS.map((t) => (
              <button key={t.value} type="button" className={tipo === t.value ? "is-on" : ""} aria-pressed={tipo === t.value} onClick={() => setTipo(t.value)}>
                {t.label}
              </button>
            ))}
          </div>

          {conVariantes && (
            <div className="nx-field">
              <label className="nx-label" htmlFor="mov-variante">Variante<i>*</i></label>
              <div className="nx-select-wrap">
                <select id="mov-variante" className="nx-input" value={varianteId} onChange={(e) => setVarianteId(e.target.value)}>
                  {variantes.map((v) => (
                    <option key={v.id} value={v.id}>{v.nombre} · {v.stock} uds</option>
                  ))}
                </select>
                <span className="chev"><ChevronDown size={20} aria-hidden="true" /></span>
              </div>
            </div>
          )}

          <div className="nx-field">
            <label className="nx-label" htmlFor="mov-cantidad">{tipo === "ajuste" ? "Stock final" : "Cantidad"}<i>*</i></label>
            <div className="inv-qty">
              <button type="button" className="nx-btn nx-btn-secondary nx-btn-icon" aria-label="Restar uno" onClick={() => ajustar(-1)}>
                <Minus size={18} aria-hidden="true" />
              </button>
              <input
                ref={cantidadRef}
                id="mov-cantidad"
                className={`nx-input nx-num ${errorCantidad ? "is-error" : ""}`}
                inputMode="numeric"
                placeholder={tipo === "ajuste" ? "Nuevo total" : "0"}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value.replace(/[^\d]/g, ""))}
                aria-invalid={!!errorCantidad}
                aria-describedby={errorCantidad ? "mov-cantidad-error" : "mov-cantidad-hint"}
              />
              <button type="button" className="nx-btn nx-btn-secondary nx-btn-icon" aria-label="Sumar uno" onClick={() => ajustar(1)}>
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
            {errorCantidad ? (
              <span className="nx-error" id="mov-cantidad-error"><AlertCircle size={16} aria-hidden="true" />{errorCantidad}</span>
            ) : (
              <span className="nx-hint nx-num" id="mov-cantidad-hint">
                Stock: {antes} → <b style={{ color: "var(--nx-ink)" }}>{despues ?? "—"}</b> uds
              </span>
            )}
          </div>

          <div className="nx-field">
            <label className="nx-label" htmlFor="mov-notas">Notas</label>
            <input id="mov-notas" className="nx-input" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. Compra a proveedor, merma…" maxLength={300} />
          </div>

          {errorServidor && (
            <div className="nx-alert is-bad" role="alert" style={{ padding: "12px 14px" }}>
              <AlertCircle size={20} aria-hidden="true" style={{ flex: "none" }} />
              <div className="txt" style={{ margin: 0 }}>{errorServidor}</div>
            </div>
          )}
        </div>
        <div className="nx-modal-foot">
          <button type="button" className="nx-btn nx-btn-secondary" onClick={onClose} disabled={pending}>Cancelar</button>
          <button type="submit" className="nx-btn nx-btn-primary" disabled={pending}>{pending ? "Guardando…" : "Registrar"}</button>
        </div>
      </form>
    </div>
  )
}
