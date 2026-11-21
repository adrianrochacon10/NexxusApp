"use client"

import { useEffect } from "react"
import { Check, X } from "lucide-react"

export interface ToastData {
  title: string
  text?: string
}

/** Aviso flotante: abajo a la derecha en escritorio, arriba en móvil. Se cierra solo. */
export function VentaToast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(onClose, 6000)
    return () => window.clearTimeout(t)
  }, [toast, onClose])

  return (
    <div className="vx-toast-slot" role="status" aria-live="polite">
      {toast && (
        <div className="nx-toast">
          <div className="nx-toast-ic is-ok" aria-hidden="true"><Check size={18} strokeWidth={2.4} /></div>
          <div className="grow">
            <div className="ttl">{toast.title}</div>
            {toast.text && <div className="txt">{toast.text}</div>}
          </div>
          <button type="button" className="nx-close" aria-label="Cerrar aviso" onClick={onClose} style={{ margin: "-4px -6px 0 0" }}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
