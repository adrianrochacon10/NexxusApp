import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="auth-state" role="status" aria-live="polite">
      <Loader2 size={28} className="auth-spin" style={{ color: "var(--nx-accent)" }} aria-hidden="true" />
      <span className="t-small">Cargando…</span>
    </div>
  )
}
