import Link from "next/link"

/** Selector Movimientos / Reportes (solo en móvil; en escritorio hay botones en el encabezado). */
export function FinanzasTabs({ activa, mes }: { activa: "movimientos" | "reportes"; mes?: string }) {
  const q = mes ? `?mes=${mes}` : ""
  return (
    <nav className="fz-tabs" aria-label="Secciones de finanzas">
      <div className="nx-seg">
        <Link href={`/finanzas${q}`} className={activa === "movimientos" ? "is-on" : undefined} aria-current={activa === "movimientos" ? "page" : undefined}>
          Movimientos
        </Link>
        <Link href={`/finanzas/reportes${q}`} className={activa === "reportes" ? "is-on" : undefined} aria-current={activa === "reportes" ? "page" : undefined}>
          Reportes
        </Link>
      </div>
    </nav>
  )
}
