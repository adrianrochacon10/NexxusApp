"use client"

import Link from "next/link"
import { ArrowUpRight, Ban, Plus, X } from "lucide-react"
import { useOverlay } from "./useOverlay"
import { DetalleCancelada, DetalleCliente, DetalleCobro, DetalleNotas, DetallePagos, DetalleProductos } from "./VentaDetalle"
import { ESTADO_BADGE, type VentaVM, admiteAbono, estadoVisual, fechaRelativa, formaPagoLabel, horaCorta } from "./venta-data"

/** Panel lateral (escritorio) / hoja inferior (móvil) con el detalle de una venta. */
export function VentaDrawer({
  venta,
  hoy,
  onClose,
  onAbonar,
  onCancelar,
  escapeDisabled,
}: {
  venta: VentaVM
  hoy: string
  onClose: () => void
  onAbonar: () => void
  onCancelar: () => void
  escapeDisabled: boolean
}) {
  const closeRef = useOverlay<HTMLButtonElement>(onClose, { escapeDisabled })
  const estado = estadoVisual(venta)
  const badge = ESTADO_BADGE[estado]
  const cancelada = estado === "cancelada"
  const puedeAbonar = admiteAbono(venta)
  const titleId = `vx-dw-${venta.id}`

  return (
    <>
      <div className="vx-drawer-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="vx-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="vx-grab" aria-hidden="true" />
        <div className="vx-drawer-head nx-row gap-12">
          <div className="grow">
            <div className="nx-row gap-8" style={{ flexWrap: "wrap" }}>
              <h2 className="t-h2" id={titleId}>Venta <span className="nx-mono" style={{ fontSize: 16 }}>{venta.folio}</span></h2>
              <span className={`nx-badge ${badge.cls}`}>{badge.label}</span>
            </div>
            <div className="t-small" style={{ marginTop: 2 }}>
              {fechaRelativa(venta.fecha, hoy)} · {horaCorta(venta.hora)} · {formaPagoLabel(venta.formaPagoInicial)}
            </div>
          </div>
          <button ref={closeRef} type="button" className="nx-close vx-close-44" aria-label="Cerrar detalle" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="vx-drawer-body">
          <DetalleCancelada venta={venta} />
          <DetalleCliente venta={venta} />
          <DetalleProductos venta={venta} />
          <DetalleCobro venta={venta} />
          <DetallePagos venta={venta} />
          <DetalleNotas venta={venta} />
          <Link href={`/ventas/${venta.id}`} className="nx-link" style={{ alignSelf: "flex-start" }}>
            Abrir página de la venta <ArrowUpRight size={16} aria-hidden="true" style={{ marginLeft: 4 }} />
          </Link>
        </div>

        <div className="vx-drawer-foot">
          <button type="button" className="nx-btn nx-btn-primary vx-df-main" disabled={!puedeAbonar} onClick={onAbonar}>
            <Plus size={18} aria-hidden="true" />
            Registrar abono
          </button>
          {cancelada && <span className="nx-hint vx-df-hint">Una venta cancelada no admite abonos.</span>}
          <button type="button" className="nx-btn nx-btn-danger-soft vx-df-cancel" disabled={cancelada} onClick={onCancelar}>
            <Ban size={18} aria-hidden="true" />
            Cancelar venta
          </button>
        </div>
      </aside>
    </>
  )
}
