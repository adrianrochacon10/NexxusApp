import Link from "next/link"
import type { ReactNode } from "react"
import { Package, Plus } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  icon?: ReactNode
  /** Acción alterna (ej. botón "Limpiar búsqueda") en lugar del enlace */
  action?: ReactNode
  tone?: "neutral" | "error"
}

export function EmptyState({ title, description, actionHref, actionLabel, icon, action, tone = "neutral" }: EmptyStateProps) {
  return (
    <section className="nx-card nx-empty" style={{ padding: "56px 24px" }}>
      <div
        className="nx-empty-ic"
        style={tone === "error" ? { background: "var(--nx-bad-bg)", color: "var(--nx-bad-fg)" } : undefined}
        aria-hidden="true"
      >
        {icon ?? <Package size={28} strokeWidth={1.8} />}
      </div>
      <div className="ttl">{title}</div>
      <div className="txt">{description}</div>
      {action ??
        (actionHref && actionLabel && (
          <Link href={actionHref} className="nx-btn nx-btn-primary">
            <Plus size={20} aria-hidden="true" />
            {actionLabel}
          </Link>
        ))}
    </section>
  )
}
