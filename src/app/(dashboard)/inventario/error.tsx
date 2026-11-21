"use client"

import { AlertCircle, RotateCw } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page">
      <EmptyState
        tone="error"
        icon={<AlertCircle size={28} strokeWidth={1.8} />}
        title="No se pudo cargar el inventario"
        description="Revisa tu conexión e inténtalo de nuevo. Tus productos siguen guardados."
        action={
          <button type="button" className="nx-btn nx-btn-primary" onClick={reset}>
            <RotateCw size={18} aria-hidden="true" />
            Reintentar
          </button>
        }
      />
    </div>
  )
}
