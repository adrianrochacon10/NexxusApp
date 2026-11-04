"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { Check, X } from "lucide-react"

const ToastContext = createContext<(mensaje: string) => void>(() => {})

/** Aviso flotante para acciones de inventario (pausar, eliminar, registrar stock). */
export function InventarioToastProvider({ children }: { children: ReactNode }) {
  const [mensaje, setMensaje] = useState("")

  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(""), 4000)
    return () => clearTimeout(t)
  }, [mensaje])

  const mostrar = useCallback((m: string) => setMensaje(m), [])

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className="inv-toast-slot" role="status" aria-live="polite">
        {mensaje && (
          <div className="nx-toast">
            <div className="nx-toast-ic is-ok"><Check size={18} strokeWidth={2.4} aria-hidden="true" /></div>
            <div className="grow"><div className="ttl">{mensaje}</div></div>
            <button type="button" className="nx-close" aria-label="Cerrar aviso" onClick={() => setMensaje("")} style={{ margin: "-4px -6px 0 0" }}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useInventarioToast() {
  return useContext(ToastContext)
}
