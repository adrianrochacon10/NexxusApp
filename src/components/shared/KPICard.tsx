import { formatCurrency } from "@/lib/utils"

interface KPICardProps {
  label: string
  value: number
  /** Texto de apoyo bajo la cifra (ej. "3 ventas · 4 piezas") */
  foot?: string
  /** Muestra signo y color: verde si es positivo, rojo si es negativo */
  signed?: boolean
}

export function KPICard({ label, value, foot, signed = false }: KPICardProps) {
  const tone = signed ? (value > 0 ? "pos" : value < 0 ? "neg" : "") : ""
  const text = signed && value > 0 ? `+${formatCurrency(value)}` : formatCurrency(value)

  return (
    <article className="nx-card nx-kpi">
      <span className="nx-kpi-label">{label}</span>
      <span className={`nx-kpi-value ${tone}`}>{text}</span>
      {foot && <span className="nx-kpi-foot">{foot}</span>}
    </article>
  )
}
