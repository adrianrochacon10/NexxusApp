"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Info, Trash2 } from "lucide-react"
import { cambiarEstatusProducto, eliminarProducto } from "@/actions/inventario"
import { mensajeError } from "@/components/inventario/inventario-utils"
import { exigirOk } from "@/lib/action-result"

interface EliminarProductoDialogProps {
  producto:     { id: string; nombre: string; estatus: string }
  /** Número de movimientos de stock que se perderán (si se conoce). */
  movimientos?: number
  onClose:      () => void
  /** Aviso a mostrar tras pausar o eliminar. */
  onDone?:      (mensaje: string) => void
}

/** Confirmación para eliminar un producto, con la alternativa de pausarlo. */
export function EliminarProductoDialog({ producto, movimientos, onClose, onDone }: EliminarProductoDialogProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [accion, setAccion] = useState<"pausar" | "eliminar" | null>(null)
  const [error, setError] = useState("")
  const cancelRef = useRef<HTMLButtonElement>(null)
  const puedePausar = producto.estatus !== "pausado"

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !pending) onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose, pending])

  function pausar() {
    setAccion("pausar")
    setError("")
    startTransition(async () => {
      try {
        exigirOk(await cambiarEstatusProducto(producto.id, "pausado"))
        onDone?.(`${producto.nombre} pausado: ya no aparece en el POS`)
        router.refresh()
        onClose()
      } catch (err) {
        setError(mensajeError(err, "No se pudo pausar el producto."))
      }
    })
  }

  function eliminar() {
    setAccion("eliminar")
    setError("")
    startTransition(async () => {
      try {
        exigirOk(await eliminarProducto(producto.id))
      } catch (err) {
        setError(mensajeError(err, "No se pudo eliminar el producto."))
        return
      }
      onDone?.(`${producto.nombre} eliminado`)
      onClose()
      router.replace("/inventario")
    })
  }

  return (
    <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget && !pending) onClose() }}>
      <div className="nx-modal" role="alertdialog" aria-modal="true" aria-labelledby="del-title" aria-describedby="del-desc" style={{ maxWidth: 440 }}>
        <div className="nx-modal-head" style={{ flexDirection: "column", gap: 14 }}>
          <div className="inv-danger-ic"><Trash2 size={24} aria-hidden="true" /></div>
          <div className="nx-modal-title" id="del-title">¿Eliminar “{producto.nombre}”?</div>
        </div>
        <div className="nx-modal-body">
          <p className="ink2" id="del-desc">
            Se perderá también {typeof movimientos === "number"
              ? <>su historial de <b style={{ color: "var(--nx-ink)" }}>{movimientos} {movimientos === 1 ? "movimiento" : "movimientos"}</b></>
              : "todo su historial de movimientos"}, sus variantes y su imagen. Esta acción no se puede deshacer.
          </p>
          {puedePausar && (
            <div className="nx-alert is-info" style={{ padding: "12px 14px" }}>
              <Info size={20} aria-hidden="true" style={{ flex: "none" }} />
              <div className="txt" style={{ margin: 0 }}>¿Solo quieres dejar de venderlo? Pausarlo lo oculta del POS y conserva todo.</div>
            </div>
          )}
          {error && (
            <div className="nx-alert is-bad" role="alert" style={{ padding: "12px 14px" }}>
              <AlertCircle size={20} aria-hidden="true" style={{ flex: "none" }} />
              <div className="txt" style={{ margin: 0 }}>{error}</div>
            </div>
          )}
        </div>
        <div className="nx-modal-foot inv-del-foot" style={{ flexWrap: "wrap" }}>
          {puedePausar && (
            <button type="button" className="nx-btn nx-btn-secondary is-pause" onClick={pausar} disabled={pending}>
              {pending && accion === "pausar" ? "Pausando…" : "Pausar en su lugar"}
            </button>
          )}
          <button ref={cancelRef} type="button" className="nx-btn nx-btn-ghost is-cancel" onClick={onClose} disabled={pending}>
            Cancelar
          </button>
          <button type="button" className="nx-btn nx-btn-danger is-del" onClick={eliminar} disabled={pending}>
            {pending && accion === "eliminar" ? "Eliminando…" : "Eliminar definitivamente"}
          </button>
        </div>
      </div>
    </div>
  )
}
