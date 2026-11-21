"use client"

import { useState } from "react"
import { AbonoDialog, type AbonoResultado, type AbonoTarget } from "@/components/ventas/VentaAcciones"

/** Botón que abre el modal de abono en el mismo lugar (sin navegar al detalle). */
export function AbonoRapidoBtn({
  venta,
  label = "Registrar abono",
  className = "nx-btn nx-btn-primary",
  onRegistrado,
}: {
  venta: AbonoTarget
  label?: string
  className?: string
  onRegistrado?: (venta: AbonoTarget, r: AbonoResultado) => void
}) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button type="button" className={className} onClick={() => setAbierto(true)} aria-haspopup="dialog" aria-label={`${label} a ${venta.folio}`}>
        {label}
      </button>
      {abierto && (
        <AbonoDialog
          venta={venta}
          onClose={() => setAbierto(false)}
          onSuccess={(r) => { setAbierto(false); onRegistrado?.(venta, r) }}
        />
      )}
    </>
  )
}
