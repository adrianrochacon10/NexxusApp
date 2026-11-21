"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

interface PosDialogProps {
  titulo:    string
  subtitulo?: ReactNode
  onClose:   () => void
  onSubmit:  () => void
  children:  ReactNode
  pie:       ReactNode
}

/** Formulario en modal (hoja inferior en móvil). Enfoca el primer campo y cierra con Esc. */
export function PosDialog({ titulo, subtitulo, onClose, onSubmit, children, pie }: PosDialogProps) {
  const dialogRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLInputElement>("input")?.focus()

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
    <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form
        ref={dialogRef}
        className="nx-modal pos-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-dialog-title"
        style={{ maxWidth: 440 }}
        noValidate
        onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      >
        <div className="nx-sheet-grab pos-picker-grab" aria-hidden="true" />
        <div className="nx-modal-head">
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="nx-modal-title" id="pos-dialog-title">{titulo}</div>
            {subtitulo && <div className="nx-modal-sub">{subtitulo}</div>}
          </div>
          <button type="button" className="nx-close" aria-label="Cerrar" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="nx-modal-body nx-col gap-12">{children}</div>
        <div className="nx-modal-foot">{pie}</div>
      </form>
    </div>
  )
}
