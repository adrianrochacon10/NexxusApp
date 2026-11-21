"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleAlert, EllipsisVertical, Pencil, ReceiptText, Trash2, Zap } from "lucide-react"
import { eliminarTransaccion } from "@/actions/finanzas"
import { exigirOk } from "@/lib/action-result"
import { formatCurrency } from "@/lib/utils"
import { useFinanzasToast } from "@/components/finanzas/FinanzasToast"
import { COLOR_INGRESO, COLOR_TRANSFERENCIA, formaPagoLabel } from "@/components/finanzas/finanzas-utils"

export interface TransaccionRowData {
  id:         string
  concepto:   string
  monto:      number
  tipo:       "ingreso" | "gasto" | "transferencia"
  forma_pago: string | null
  venta_id:   string | null
  ventaFolio: string | null
  categoria:  { nombre: string; color: string | null } | null
  /** Hora local de registro ("12:42") */
  hora?:      string
  /** Color de la categoría (--nx-cat-*) */
  color?:     string
  /** La venta vinculada fue cancelada */
  cancelada?: boolean
}

function montoTexto(trx: TransaccionRowData) {
  if (trx.tipo === "ingreso") return `+${formatCurrency(trx.monto)}`
  if (trx.tipo === "gasto")   return `−${formatCurrency(trx.monto)}`
  return formatCurrency(trx.monto)
}

export function TransaccionRow({ trx }: { trx: TransaccionRowData }) {
  const [dialogo, setDialogo] = useState<"opciones" | "eliminar" | null>(null)
  const esVenta = Boolean(trx.venta_id)

  const dot = trx.color ?? (trx.tipo === "ingreso" ? COLOR_INGRESO : trx.tipo === "transferencia" ? COLOR_TRANSFERENCIA : "var(--nx-cat-6)")
  const tono = trx.tipo === "ingreso" ? "is-in" : trx.tipo === "transferencia" ? "is-tr" : "is-out"
  const meta = [trx.categoria?.nombre ?? (trx.tipo === "transferencia" ? "Transferencia" : "Sin categoría"), formaPagoLabel(trx.forma_pago), trx.hora]
    .filter(Boolean)
    .join(" · ")
  const ventaLabel = `Ver venta${trx.ventaFolio ? ` ${trx.ventaFolio}` : ""}`

  return (
    <div className={`fz-mv${trx.cancelada ? " is-void" : ""}`}>
      <span className="nx-catdot" style={{ background: dot }} aria-hidden="true" />
      <div className="grow">
        <div className="fz-mv-title">{trx.concepto}</div>
        <div className="fz-mv-meta">
          <span className="t-small">{meta}</span>
          {esVenta && (
            <span className="nx-tag-auto" title="Registrada por una venta o abono">
              <Zap size={12} strokeWidth={2.4} aria-hidden="true" />
              Automática
            </span>
          )}
          {trx.cancelada && <span className="nx-badge is-off">Venta cancelada</span>}
        </div>
      </div>
      <div className={`fz-mv-amt nx-num ${tono}`}>{montoTexto(trx)}</div>

      <div className="fz-mv-actions">
        {esVenta ? (
          <Link href={`/ventas/${trx.venta_id}`} className="nx-iconbtn" aria-label={`${ventaLabel} de ${trx.concepto}`} title={ventaLabel}>
            <ReceiptText size={20} aria-hidden="true" />
          </Link>
        ) : (
          <Link href={`/finanzas/${trx.id}/editar`} className="nx-iconbtn" aria-label={`Editar movimiento ${trx.concepto}`} title="Editar">
            <Pencil size={20} aria-hidden="true" />
          </Link>
        )}
        <button type="button" className="nx-iconbtn danger" aria-label={`Eliminar movimiento ${trx.concepto}`} title="Eliminar" onClick={() => setDialogo("eliminar")}>
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="fz-mv-more">
        <button type="button" className="nx-iconbtn" aria-label={`Opciones de ${trx.concepto}`} aria-haspopup="dialog" onClick={() => setDialogo("opciones")}>
          <EllipsisVertical size={20} aria-hidden="true" />
        </button>
      </div>

      {dialogo === "opciones" && (
        <OpcionesDialog
          trx={trx}
          ventaLabel={ventaLabel}
          onClose={() => setDialogo(null)}
          onEliminar={() => setDialogo("eliminar")}
        />
      )}
      {dialogo === "eliminar" && <EliminarDialog trx={trx} onClose={() => setDialogo(null)} />}
    </div>
  )
}

function useDialogo(onClose: () => void, enabled = true) {
  const firstRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { firstRef.current?.focus() }, [])
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose, enabled])
  return firstRef
}

function OpcionesDialog({ trx, ventaLabel, onClose, onEliminar }: {
  trx: TransaccionRowData
  ventaLabel: string
  onClose: () => void
  onEliminar: () => void
}) {
  const firstRef = useDialogo(onClose)
  const titleId = `fz-op-${trx.id}`

  return (
    <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="nx-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} style={{ maxWidth: 400 }}>
        <div className="nx-modal-head">
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="nx-modal-title nx-ellipsis" id={titleId}>{trx.concepto}</div>
            <div className="nx-modal-sub nx-num">{montoTexto(trx)} · {formaPagoLabel(trx.forma_pago)}</div>
          </div>
        </div>
        <div className="nx-modal-body" style={{ gap: 8 }}>
          {trx.venta_id ? (
            <Link href={`/ventas/${trx.venta_id}`} className="nx-btn nx-btn-secondary nx-btn-block" style={{ justifyContent: "flex-start" }}>
              <ReceiptText size={20} aria-hidden="true" />
              {ventaLabel}
            </Link>
          ) : (
            <Link href={`/finanzas/${trx.id}/editar`} className="nx-btn nx-btn-secondary nx-btn-block" style={{ justifyContent: "flex-start" }}>
              <Pencil size={20} aria-hidden="true" />
              Editar movimiento
            </Link>
          )}
          <button type="button" className="nx-btn nx-btn-danger-soft nx-btn-block" style={{ justifyContent: "flex-start" }} onClick={onEliminar}>
            <Trash2 size={20} aria-hidden="true" />
            Eliminar movimiento
          </button>
        </div>
        <div className="nx-modal-foot">
          <button ref={firstRef} type="button" className="nx-btn nx-btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

function EliminarDialog({ trx, onClose }: { trx: TransaccionRowData; onClose: () => void }) {
  const router = useRouter()
  const toast = useFinanzasToast()
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState("")
  const cerrar = () => { if (!eliminando) onClose() }
  const firstRef = useDialogo(cerrar, !eliminando)
  const titleId = `fz-del-${trx.id}`
  const descId = `fz-del-d-${trx.id}`

  async function handleEliminar() {
    setEliminando(true)
    setError("")
    try {
      exigirOk(await eliminarTransaccion(trx.id))
      toast("Movimiento eliminado")
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.")
      setEliminando(false)
    }
  }

  return (
    <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}>
      <div className="nx-modal" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} style={{ maxWidth: 440 }}>
        <div className="nx-modal-head">
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="nx-modal-title" id={titleId}>¿Eliminar “{trx.concepto}”?</div>
            <div className="nx-modal-sub nx-num" id={descId}>
              {formatCurrency(trx.monto)} · se recalcula el balance del mes.
            </div>
          </div>
        </div>
        {(trx.venta_id || error) && (
          <div className="nx-modal-body">
            {trx.venta_id && (
              <div className="nx-alert is-warn">
                <CircleAlert size={20} aria-hidden="true" style={{ flex: "none" }} />
                <div>
                  <div className="ttl">Vinculada a la venta {trx.ventaFolio ?? ""}</div>
                  <div className="txt">Al eliminarla también se revierte el pago y se recalcula el saldo pendiente de esa venta.</div>
                </div>
              </div>
            )}
            {error && (
              <span className="nx-error" role="alert">
                <CircleAlert size={16} aria-hidden="true" />
                {error}
              </span>
            )}
          </div>
        )}
        <div className="nx-modal-foot">
          <button ref={firstRef} type="button" className="nx-btn nx-btn-secondary" onClick={cerrar} disabled={eliminando}>Conservar</button>
          <button type="button" className="nx-btn nx-btn-danger" onClick={handleEliminar} disabled={eliminando}>
            {eliminando ? "Eliminando…" : "Eliminar movimiento"}
          </button>
        </div>
      </div>
    </div>
  )
}
