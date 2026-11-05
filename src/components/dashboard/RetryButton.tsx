"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCw } from "lucide-react"

/** Vuelve a pedir los datos del servidor sin recargar la página. */
export function RetryButton({ label = "Reintentar" }: { label?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      className="nx-btn nx-btn-secondary"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      aria-busy={pending}
    >
      <RotateCw size={18} aria-hidden="true" />
      {pending ? "Reintentando…" : label}
    </button>
  )
}
