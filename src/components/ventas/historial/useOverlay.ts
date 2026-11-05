"use client"

import { useEffect, useRef } from "react"

/**
 * Comportamiento común de modales y paneles:
 * - enfoca `focusRef` al abrir y devuelve el foco al disparador al cerrar
 * - Escape cierra (salvo que `escapeDisabled`, p. ej. hay un modal encima)
 * - bloquea el scroll del documento mientras está abierto
 */
export function useOverlay<T extends HTMLElement>(
  onClose: () => void,
  { escapeDisabled = false }: { escapeDisabled?: boolean } = {},
) {
  const focusRef = useRef<T>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const escRef = useRef(escapeDisabled)
  escRef.current = escapeDisabled

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null
    focusRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !escRef.current) {
        e.stopPropagation()
        onCloseRef.current()
      }
    }
    document.addEventListener("keydown", onKey)

    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      if (previo && document.contains(previo)) previo.focus()
    }
  }, [])

  return focusRef
}
