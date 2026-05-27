"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Boxes, LayoutDashboard, LogOut, Menu, ReceiptText, ShoppingCart, X } from "lucide-react"
import { useState } from "react"
import { NexxusLogo } from "@/components/shared/NexxusLogo"
import { cn } from "@/lib/utils"

const navigation = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/ventas",     label: "Ventas",      icon: ShoppingCart    },
  { href: "/inventario", label: "Inventario",  icon: Boxes           },
  { href: "/finanzas",   label: "Finanzas",    icon: ReceiptText     },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="mobile-nav-bar">
        <Link href="/dashboard" aria-label="Ir al dashboard" onClick={() => setOpen(false)}>
          <NexxusLogo compact />
        </Link>
        <button
          className="button mobile-menu-button"
          type="button"
          aria-label={open ? "Cerrar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      <aside className={cn("sidebar", open && "sidebar-open")}>
        <Link href="/dashboard" aria-label="Ir al dashboard" className="desktop-logo">
          <NexxusLogo />
        </Link>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("button", isActive && "button-primary")}
                style={{ justifyContent: "flex-start", color: isActive ? "#0a0a0a" : "var(--text-secondary)" }}
                onClick={() => setOpen(false)}
              >
                <Icon size={17} aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} aria-hidden="true" />
          <Link
            href="/login"
            className="button"
            style={{ justifyContent: "flex-start", color: "var(--text-secondary)" }}
          >
            <LogOut size={17} aria-hidden="true" />
            Salir
          </Link>
          <footer className="sidebar-footer">Nexxuz</footer>
        </div>
      </aside>
    </>
  )
}
