import type { ReactNode } from "react"

interface NavbarProps {
  title: string
  subtitle?: string
  /** Etiqueta pequeña sobre el título; por defecto, la fecha de hoy */
  eyebrow?: string
  /** Botones a la derecha del título */
  actions?: ReactNode
  /** @deprecated ya no hay acciones globales en el encabezado */
  hideActions?: boolean
}

function hoy() {
  const texto = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(new Date())
  return `Hoy · ${texto}`
}

/** Encabezado de pantalla: etiqueta + título + acciones. */
export function Navbar({ title, subtitle, eyebrow, actions }: NavbarProps) {
  return (
    <header className="nx-pagehead">
      <div style={{ minWidth: 0 }}>
        <div className="t-cap">{eyebrow ?? hoy()}</div>
        <h1 className="t-h1" style={{ marginTop: 4 }}>{title}</h1>
        {subtitle && <p className="sub">{subtitle}</p>}
      </div>
      {actions && <div className="nx-pagehead-actions">{actions}</div>}
    </header>
  )
}
