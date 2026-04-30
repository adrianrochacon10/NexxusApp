import type { EstatusProducto } from "@/types/inventario.types"

interface EstatusBadgeProps {
  estatus: EstatusProducto
}

const label: Record<EstatusProducto, string> = {
  disponible: "Disponible",
  pausado: "Pausado",
  agotado: "Agotado",
}

const color: Record<EstatusProducto, string> = {
  disponible: "var(--success)",
  pausado: "var(--warning)",
  agotado: "var(--error)",
}

export function EstatusBadge({ estatus }: EstatusBadgeProps) {
  return (
    <span className="badge" style={{ border: `1px solid ${color[estatus]}55`, color: color[estatus], background: `${color[estatus]}18` }}>
      {label[estatus]}
    </span>
  )
}
