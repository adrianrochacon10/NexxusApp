"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { ProductoFoto } from "./ProductoFoto"
import { nivelStock, type ProductoPos, type VariantePos } from "./types"

interface VariantePickerProps {
  producto:  ProductoPos
  enTicket:  (varianteId: string) => number
  onPick:    (variante: VariantePos) => void
  onClose:   () => void
}

const TONO = {
  ok:  "var(--nx-ok-fg)",
  low: "var(--nx-warn-fg)",
  out: "var(--nx-bad-fg)",
} as const

/** Selector de talla: modal en escritorio, hoja inferior en móvil. */
export function VariantePicker({ producto, enTicket, onPick, onClose }: VariantePickerProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    const primero = dialogRef.current?.querySelector<HTMLButtonElement>(".pos-vbtn:not(:disabled)")
    ;(primero ?? dialogRef.current?.querySelector<HTMLButtonElement>(".nx-close"))?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      previo?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="nx-overlay nx-scrim"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        className="nx-modal pos-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-picker-title"
        style={{ maxWidth: 440 }}
      >
        <div className="nx-sheet-grab pos-picker-grab" aria-hidden="true" />
        <div className="nx-modal-head">
          <ProductoFoto
            nombre={producto.nombre}
            imagenUrl={producto.imagen_url}
            sizes="96px"
            className="pos-picker-ph"
          />
          <div className="grow">
            <div className="nx-modal-title" id="pos-picker-title">{producto.nombre}</div>
            <div className="nx-modal-sub nx-num">Elige talla · {formatCurrency(producto.precio_venta)}</div>
          </div>
          <button type="button" className="nx-close" aria-label="Cerrar" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="nx-modal-body" style={{ paddingBottom: 24 }}>
          <div className="pos-vgrid">
            {producto.variantes.map((v) => {
              const nivel = nivelStock(v.stock, v.stock_minimo)
              const ya    = enTicket(v.id)
              const status =
                nivel === "out" ? "Agotada" :
                nivel === "low" ? `Quedan ${v.stock}` :
                                  `${v.stock} disp.`
              return (
                <button
                  key={v.id}
                  type="button"
                  className="pos-vbtn"
                  disabled={nivel === "out"}
                  onClick={() => onPick(v)}
                  aria-label={`Talla ${v.nombre}, ${status}${ya > 0 ? `, ${ya} en el ticket` : ""}`}
                >
                  <b>{v.nombre}</b>
                  <span className="t-small" style={{ color: TONO[nivel], fontWeight: 600 }}>{status}</span>
                  {ya > 0 && <span className="pos-vbtn-qty nx-num" aria-hidden="true">×{ya}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
