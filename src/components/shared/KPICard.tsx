import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface KPICardProps {
  label: string
  value: number
  trend: number
  tone?: "gold" | "success" | "error" | "info"
}

const toneMap = {
  gold: "var(--accent-gold)",
  success: "var(--success)",
  error: "var(--error)",
  info: "var(--info)",
}

export function KPICard({ label, value, trend, tone = "gold" }: KPICardProps) {
  const positive = trend >= 0
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <article className="surface" style={{ padding: 18 }}>
      <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</div>
      <div className="font-mono" style={{ marginTop: 14, fontSize: 27, color: "var(--text-primary)" }}>
        {formatCurrency(value)}
      </div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, color: toneMap[tone], fontSize: 13 }}>
        <TrendIcon size={15} aria-hidden="true" />
        {Math.abs(trend)}% vs. periodo anterior
      </div>
    </article>
  )
}
