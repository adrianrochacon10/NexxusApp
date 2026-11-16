"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Trash2 } from "lucide-react"
import { eliminarCategoria } from "@/actions/categorias"
import { mensajeError } from "@/components/inventario/inventario-utils"
import { exigirOk } from "@/lib/action-result"

interface EliminarCategoriaBotonProps {
  categoria: { id: string; nombre: string }
  /** Productos que quedarán "Sin categoría". */
  productos: number
}

/** Botón "Eliminar categoría" con su confirmación. Los productos no se borran: quedan sin categoría. */
export function EliminarCategoriaBoton({ categoria, productos }: EliminarCategoriaBotonProps) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button type="button" className="nx-btn nx-btn-secondary" onClick={() => setAbierto(true)}>
        <Trash2 size={20} aria-hidden="true" />
        Eliminar
      </button>
      {abierto && (
        <EliminarCategoriaDialog categoria={categoria} productos={productos} onClose={() => setAbierto(false)} />
      )}
    </>
  )
}

function EliminarCategoriaDialog({
  categoria,
  productos,
  onClose,
}: EliminarCategoriaBotonProps & { onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !pending) onClose() }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      previo?.focus?.()
    }
  }, [onClose, pending])

  function eliminar() {
    setError("")
    startTransition(async () => {
      try {
        exigirOk(await eliminarCategoria(categoria.id))
      } catch (err) {
        setError(mensajeError(err, "No se pudo eliminar la categoría."))
        return
      }
      router.replace("/inventario")
      router.refresh()
    })
  }

  return (
    <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget && !pending) onClose() }}>
      <div className="nx-modal" role="alertdialog" aria-modal="true" aria-labelledby="delcat-title" aria-describedby="delcat-desc" style={{ maxWidth: 440 }}>
        <div className="nx-modal-head" style={{ flexDirection: "column", gap: 14 }}>
          <div className="inv-danger-ic"><Trash2 size={24} aria-hidden="true" /></div>
          <div className="nx-modal-title" id="delcat-title">¿Eliminar la categoría “{categoria.nombre}”?</div>
        </div>
        <div className="nx-modal-body">
          <p className="ink2" id="delcat-desc">
            {productos > 0 ? (
              <>
                Sus <b style={{ color: "var(--nx-ink)" }}>{productos} {productos === 1 ? "producto quedará" : "productos quedarán"} sin categoría</b>.
                No se borran: conservan su stock, tallas e historial de ventas, y puedes asignarles otra categoría después.
              </>
            ) : (
              "Esta categoría no tiene productos."
            )}{" "}
            Esta acción no se puede deshacer.
          </p>
          {error && (
            <div className="nx-alert is-bad" role="alert" style={{ padding: "12px 14px" }}>
              <AlertCircle size={20} aria-hidden="true" style={{ flex: "none" }} />
              <div className="txt" style={{ margin: 0 }}>{error}</div>
            </div>
          )}
        </div>
        <div className="nx-modal-foot inv-del-foot" style={{ flexWrap: "wrap" }}>
          <button ref={cancelRef} type="button" className="nx-btn nx-btn-ghost is-cancel" onClick={onClose} disabled={pending}>
            Cancelar
          </button>
          <button type="button" className="nx-btn nx-btn-danger is-del" onClick={eliminar} disabled={pending}>
            {pending ? "Eliminando…" : "Eliminar categoría"}
          </button>
        </div>
      </div>
    </div>
  )
}
