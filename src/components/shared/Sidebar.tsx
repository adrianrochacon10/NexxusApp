"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock, LayoutDashboard, LogOut, Package, Plus, ReceiptText, Wallet, type LucideIcon } from "lucide-react"
import { useEffect, useRef, useState, useTransition } from "react"
import { logout } from "@/actions/auth"
import { NexxusLogo } from "@/components/shared/NexxusLogo"
import { cn, getInitials } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  short: string
  icon: LucideIcon
  count?: number
}

interface AppShellProps {
  negocio: string
  usuario: { nombre: string; email: string }
  conteos: { inventario: number; cobrar: number }
  children: React.ReactNode
}

function isActive(pathname: string, href: string) {
  // /ventas/pendientes tiene entrada propia: no marca "Ventas"
  if (href === "/ventas" && pathname.startsWith("/ventas/pendientes")) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShell({ negocio, usuario, conteos, children }: AppShellProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  const navigation: NavItem[] = [
    { href: "/dashboard",         label: "Dashboard",          short: "Inicio",     icon: LayoutDashboard },
    { href: "/ventas",            label: "Ventas",             short: "Ventas",     icon: ReceiptText },
    { href: "/inventario",        label: "Inventario",         short: "Inventario", icon: Package, count: conteos.inventario },
    { href: "/finanzas",          label: "Finanzas",           short: "Finanzas",   icon: Wallet },
    { href: "/ventas/pendientes", label: "Cuentas por cobrar", short: "Por cobrar", icon: Clock, count: conteos.cobrar },
  ]

  const initials = getInitials(usuario.nombre)
  const askLogout = () => { setMenuOpen(false); setLogoutOpen(true) }

  return (
    <div className="app-shell">
      {/* Escritorio */}
      <aside className="nx-side">
        <div className="nx-side-brand">
          <NexxusLogo />
          <div style={{ minWidth: 0 }}>
            <div className="name">Nexxus</div>
            <div className="t-small nx-ellipsis">{negocio}</div>
          </div>
        </div>
        <Link href="/ventas/nueva" className="nx-btn nx-btn-primary nx-btn-block" style={{ minHeight: 48, marginBottom: 12 }}>
          <Plus size={20} strokeWidth={2.2} aria-hidden="true" />
          Nueva venta
        </Link>
        <nav aria-label="Principal" className="nx-col" style={{ gap: 4 }}>
          {navigation.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={cn("nx-nav-item", active && "is-active")} aria-current={active ? "page" : undefined}>
                <Icon size={22} aria-hidden="true" />
                <span>{item.label}</span>
                {item.count ? <span className="nx-nav-count" aria-label={`${item.count} pendientes`}>{item.count}</span> : null}
              </Link>
            )
          })}
        </nav>
        <div className="grow" />
        <div className="nx-side-foot">
          <div className="nx-row gap-12" style={{ padding: "6px 8px" }}>
            <div className="nx-avatar accent" style={{ borderRadius: "50%" }} aria-hidden="true">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="t-h3 nx-ellipsis" style={{ fontSize: 14, lineHeight: "18px" }}>{usuario.nombre}</div>
              <div className="t-small nx-ellipsis">{usuario.email}</div>
            </div>
          </div>
          <button type="button" className="nx-nav-item" onClick={askLogout}>
            <LogOut size={22} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Tablet */}
      <aside className="nx-rail">
        <NexxusLogo style={{ margin: "4px 0 12px" }} />
        <Link
          href="/ventas/nueva"
          className="nx-btn nx-btn-primary"
          style={{ width: 72, minHeight: 64, flexDirection: "column", gap: 4, padding: 0, fontSize: 12, lineHeight: "14px", marginBottom: 12 }}
        >
          <Plus size={22} strokeWidth={2.2} aria-hidden="true" />
          Venta
        </Link>
        <nav aria-label="Principal" className="nx-col" style={{ gap: 4, alignItems: "center" }}>
          {navigation.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={cn("nx-rail-item", active && "is-active")} aria-current={active ? "page" : undefined}>
                <Icon size={24} aria-hidden="true" />
                <span>{item.short}</span>
                {item.count ? <span className="nx-pip" style={{ right: 10 }}>{item.count}</span> : null}
              </Link>
            )
          })}
        </nav>
        <div className="grow" />
        <div className="nx-avatar accent" style={{ borderRadius: "50%", marginBottom: 4 }} title={usuario.nombre}>{initials}</div>
        <button type="button" className="nx-rail-item" onClick={askLogout}>
          <LogOut size={24} aria-hidden="true" />
          <span>Salir</span>
        </button>
      </aside>

      {/* Móvil */}
      <header className="nx-topbar">
        <NexxusLogo small />
        <div className="grow">
          <div className="t-h3 nx-ellipsis">{negocio}</div>
        </div>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="nx-btn nx-btn-ghost nx-btn-icon"
            aria-label="Menú de cuenta"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            style={{ borderRadius: "50%" }}
          >
            <span className="nx-avatar accent" style={{ borderRadius: "50%" }}>{initials}</span>
          </button>
          {menuOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.25)", zIndex: 40 }} onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div className="nx-menu" style={{ position: "absolute", top: 52, right: -4, zIndex: 41 }}>
                <div className="nx-row gap-12" style={{ padding: "8px 8px 12px", borderBottom: "1px solid var(--nx-line)", marginBottom: 4 }}>
                  <div className="nx-avatar accent" style={{ borderRadius: "50%" }} aria-hidden="true">{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="t-h3 nx-ellipsis" style={{ fontSize: 14, lineHeight: "18px" }}>{usuario.nombre}</div>
                    <div className="t-small nx-ellipsis">{negocio}</div>
                  </div>
                </div>
                <button type="button" className="nx-nav-item" onClick={askLogout}>
                  <LogOut size={22} aria-hidden="true" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="app-main">{children}</main>

      {!pathname.startsWith("/ventas/nueva") && (
        <div className="nx-fab-wrap">
          <Link href="/ventas/nueva" className="nx-fab">
            <Plus size={22} strokeWidth={2.2} aria-hidden="true" />
            Nueva venta
          </Link>
        </div>
      )}

      <nav className="nx-tabbar" aria-label="Principal">
        {navigation.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className={cn("nx-tab", active && "is-active")} aria-current={active ? "page" : undefined}>
              <span className="pill"><Icon size={24} aria-hidden="true" /></span>
              <span>{item.short}</span>
              {item.count ? <span className="nx-pip">{item.count}</span> : null}
            </Link>
          )
        })}
      </nav>

      {logoutOpen && <LogoutDialog onClose={() => setLogoutOpen(false)} />}
    </div>
  )
}

function LogoutDialog({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="nx-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" style={{ maxWidth: 400 }}>
        <div className="nx-modal-head">
          <div className="grow"><div className="nx-modal-title" id="logout-title">¿Cerrar sesión?</div></div>
        </div>
        <div className="nx-modal-body">
          <p className="ink2">Tus ventas y movimientos ya están guardados. Podrás entrar de nuevo cuando quieras.</p>
        </div>
        <div className="nx-modal-foot">
          <button ref={cancelRef} type="button" className="nx-btn nx-btn-secondary" onClick={onClose} disabled={pending}>Cancelar</button>
          <button type="button" className="nx-btn nx-btn-primary" disabled={pending} onClick={() => startTransition(async () => { await logout() })}>
            {pending ? "Cerrando…" : "Cerrar sesión"}
          </button>
        </div>
      </div>
    </div>
  )
}
