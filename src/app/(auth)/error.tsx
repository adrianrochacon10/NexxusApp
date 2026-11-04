"use client"

import { AlertTriangle, RotateCcw } from "lucide-react"

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="nx-card auth-state" role="alert">
      <div className="nx-empty-ic" style={{ background: "var(--nx-bad-bg)", color: "var(--nx-bad-fg)", marginBottom: 0 }}>
        <AlertTriangle size={28} aria-hidden="true" />
      </div>
      <h1 className="t-h2" style={{ margin: 0 }}>No pudimos cargar el acceso</h1>
      <p className="t-small" style={{ margin: 0, maxWidth: 300 }}>
        Algo salió mal de nuestro lado. Inténtalo de nuevo en un momento.
      </p>
      <button type="button" className="nx-btn nx-btn-primary" onClick={reset}>
        <RotateCcw size={18} aria-hidden="true" />
        Reintentar
      </button>
    </div>
  )
}
