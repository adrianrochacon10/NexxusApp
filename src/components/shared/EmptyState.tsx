import Link from "next/link"
import { Plus } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  actionHref: string
  actionLabel: string
}

export function EmptyState({ title, description, actionHref, actionLabel }: EmptyStateProps) {
  return (
    <section className="surface" style={{ display: "grid", minHeight: 260, placeItems: "center", padding: 28, textAlign: "center" }}>
      <div>
        <div className="font-display" style={{ fontSize: 32 }}>{title}</div>
        <p style={{ maxWidth: 440, color: "var(--text-secondary)" }}>{description}</p>
        <Link href={actionHref} className="button button-primary">
          <Plus size={17} aria-hidden="true" />
          {actionLabel}
        </Link>
      </div>
    </section>
  )
}
