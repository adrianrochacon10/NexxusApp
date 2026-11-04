import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Periodo } from "@/components/finanzas/finanzas-utils"

/** Navegación entre meses (?mes=YYYY-MM). El mes siguiente se deshabilita en el mes actual. */
export function SelectorMes({ periodo, basePath, extra }: { periodo: Periodo; basePath: string; extra?: string }) {
  const href = (mes: string) => `${basePath}?mes=${mes}${extra ? `&${extra}` : ""}`
  const etiqueta = periodo.esActual
    ? `${periodo.etiqueta} · al ${Number(periodo.hoy.slice(8, 10))} de ${periodo.nombre}`
    : periodo.etiqueta

  return (
    <div className="fz-mes" role="group" aria-label="Mes">
      <Link href={href(periodo.anterior)} className="nx-iconbtn" aria-label="Mes anterior" scroll={false}>
        <ChevronLeft size={20} aria-hidden="true" />
      </Link>
      <span className="t-cap" aria-live="polite">{etiqueta}</span>
      {periodo.esActual ? (
        <span className="nx-iconbtn is-disabled" aria-hidden="true">
          <ChevronRight size={20} />
        </span>
      ) : (
        <Link href={href(periodo.siguiente)} className="nx-iconbtn" aria-label="Mes siguiente" scroll={false}>
          <ChevronRight size={20} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
