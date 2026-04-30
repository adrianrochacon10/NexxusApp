import { Bell, CalendarDays } from "lucide-react"
import { getInitials } from "@/lib/utils"

interface NavbarProps {
  title: string
  subtitle?: string
}

export function Navbar({ title, subtitle }: NavbarProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        borderBottom: "1px solid var(--border-subtle)",
        padding: "20px 28px",
      }}
    >
      <div>
        <h1 className="font-display" style={{ margin: 0, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 500 }}>
          {title}
        </h1>
        {subtitle && <p style={{ margin: "6px 0 0", color: "var(--text-secondary)" }}>{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="button" aria-label="Cambiar rango de fechas">
          <CalendarDays size={17} aria-hidden="true" />
          Este mes
        </button>
        <button className="button" aria-label="Ver notificaciones">
          <Bell size={17} aria-hidden="true" />
        </button>
        <div
          aria-label="Usuario actual"
          style={{
            display: "grid",
            width: 40,
            height: 40,
            placeItems: "center",
            borderRadius: 999,
            color: "#0a0a0a",
            background: "var(--accent-gold)",
            fontWeight: 700,
          }}
        >
          {getInitials("Nexxus Admin")}
        </div>
      </div>
    </header>
  )
}
