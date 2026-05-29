import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface KPICardProps {
  label: string
  value: number
  trend?: number
  tone?: "gold" | "success" | "error" | "info"
  highlighted?: boolean
}

const toneMap = {
  gold:    "var(--accent-gold)",
  success: "var(--success)",
  error:   "var(--error)",
  info:    "var(--info)",
}

export function KPICard({ label, value, trend, tone = "gold", highlighted = false }: KPICardProps) {
  return (
    <article
      className="surface"
      style={{
        padding: 18,
        borderColor: highlighted ? "rgba(201,168,76,0.3)" : undefined,
      }}
    >
      <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</div>
      <div className="font-mono" style={{ marginTop: 14, fontSize: 27 }}>
        {formatCurrency(value)}
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, color: toneMap[tone], fontSize: 13 }}>
          {trend >= 0 ? <ArrowUpRight size={15} aria-hidden="true" /> : <ArrowDownRight size={15} aria-hidden="true" />}
          {Math.abs(trend)}% vs. periodo anterior
        </div>
      )}
    </article>
  )
}
