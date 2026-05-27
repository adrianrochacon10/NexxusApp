"use client"

import { Bell } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

interface NavbarProps {
  title: string
  subtitle?: string
  hideActions?: boolean
}

export function Navbar({ title, subtitle, hideActions = false }: NavbarProps) {
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
        {subtitle && (
          <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>{subtitle}</p>
        )}
      </div>

      {!hideActions && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle />
          <button className="button" aria-label="Ver notificaciones" style={{ padding: "0 12px" }}>
            <Bell size={16} aria-hidden="true" />
          </button>
          <div
            aria-label="Usuario actual"
            style={{
              display: "grid",
              width: 38,
              height: 38,
              placeItems: "center",
              borderRadius: 999,
              color: "#ffffff",
              background: "var(--accent-gold)",
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {getInitials("Nexxuz Admin")}
          </div>
        </div>
      )}
    </header>
  )
}
