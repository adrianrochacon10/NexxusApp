"use client"

import { RotateCw, TriangleAlert } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page">
      <EmptyState
        tone="error"
        icon={<TriangleAlert size={28} strokeWidth={1.8} />}
        title="No se pudo cargar finanzas"
        description="Revisa tu conexión e inténtalo de nuevo. Tus movimientos siguen guardados."
        action={
          <button type="button" className="nx-btn nx-btn-primary" onClick={reset}>
            <RotateCw size={20} aria-hidden="true" />
            Reintentar
          </button>
        }
      />
    </div>
  )
}
