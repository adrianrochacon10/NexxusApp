"use client"

import { useEffect } from "react"
import { AlertCircle, RotateCw } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="nx-alert is-bad" role="alert" style={{ alignItems: "center" }}>
        <AlertCircle size={24} aria-hidden="true" style={{ flex: "none" }} />
        <div className="grow">
          <div className="ttl">No pudimos cargar el dashboard</div>
          <div className="txt">Revisa tu conexión e inténtalo de nuevo.</div>
        </div>
      </div>
      <EmptyState
        tone="error"
        icon={<AlertCircle size={28} strokeWidth={1.8} />}
        title="Algo salió mal"
        description="Tus datos están a salvo. Vuelve a intentarlo en unos segundos."
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
