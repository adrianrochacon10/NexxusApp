"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Trash2 } from "lucide-react"
import { cambiarEstatusProducto } from "@/actions/inventario"
import { EliminarProductoDialog } from "@/components/inventario/EliminarProductoDialog"
import { useInventarioToast } from "@/components/inventario/InventarioToast"
import { mensajeError } from "@/components/inventario/inventario-utils"
import { exigirOk } from "@/lib/action-result"

type Estatus = "disponible" | "pausado" | "agotado"

interface ProductoAccionesProps {
  productoId:    string
  productoNombre: string
  estatusActual: Estatus
  stock:         number
  movimientos?:  number
}

/** Estatus (Disponible / Pausado) y zona delicada (eliminar) del producto. */
export function ProductoAcciones({ productoId, productoNombre, estatusActual, stock, movimientos }: ProductoAccionesProps) {
  const router = useRouter()
  const toast = useInventarioToast()
  const [pending, startTransition] = useTransition()
  const [confirmar, setConfirmar] = useState(false)
  const [error, setError] = useState("")

  const pausado = estatusActual === "pausado"
  const estado = pausado
    ? { cls: "is-off", label: "Pausado", hint: "No aparece en el POS." }
    : stock <= 0
      ? { cls: "is-bad", label: "Agotado", hint: "Se calcula solo: el stock es 0." }
      : { cls: "is-ok", label: "Disponible", hint: "Se puede vender en el POS." }

  function cambiar(pausar: boolean) {
    if (pausar === pausado) return
    setError("")
    startTransition(async () => {
      try {
        exigirOk(await cambiarEstatusProducto(productoId, pausar ? "pausado" : "disponible"))
        toast(pausar ? "Producto pausado: ya no aparece en el POS" : "Producto reactivado")
        router.refresh()
      } catch (err) {
        setError(mensajeError(err, "Error al cambiar el estatus."))
      }
    })
  }

  return (
    <>
      <section className="nx-card nx-col gap-12" style={{ padding: 20 }} aria-labelledby="h-estatus">
        <h2 className="t-h2" id="h-estatus">Estatus</h2>
        <div className="nx-seg" role="group" aria-label="Estatus del producto">
          <button type="button" className={!pausado ? "is-on" : ""} aria-pressed={!pausado} disabled={pending} onClick={() => cambiar(false)}>Disponible</button>
          <button type="button" className={pausado ? "is-on" : ""} aria-pressed={pausado} disabled={pending} onClick={() => cambiar(true)}>Pausado</button>
        </div>
        <div className="nx-row gap-8" style={{ flexWrap: "wrap" }} aria-live="polite">
          <span className={`nx-badge ${estado.cls}`}>{estado.label}</span>
          <span className="t-small">{pending ? "Guardando…" : estado.hint}</span>
        </div>
        {error && <span className="nx-error" role="alert"><AlertCircle size={16} aria-hidden="true" />{error}</span>}
      </section>

      <section className="nx-card nx-col gap-12" style={{ padding: 20, borderColor: "var(--nx-bad-line)" }} aria-labelledby="h-zona">
        <h2 className="t-h2" id="h-zona">Zona delicada</h2>
        <button type="button" className="nx-btn nx-btn-danger-soft nx-btn-block" onClick={() => setConfirmar(true)}>
          <Trash2 size={18} aria-hidden="true" />
          Eliminar producto
        </button>
        <span className="nx-hint">Eliminar borra también su historial de movimientos, sus variantes y su imagen.</span>
      </section>

      {confirmar && (
        <EliminarProductoDialog
          producto={{ id: productoId, nombre: productoNombre, estatus: estatusActual }}
          movimientos={movimientos}
          onClose={() => setConfirmar(false)}
          onDone={toast}
        />
      )}
    </>
  )
}
