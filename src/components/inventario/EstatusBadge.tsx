import type { EstatusProducto } from "@/types/inventario.types"

interface EstatusBadgeProps {
  estatus: EstatusProducto
}

const config: Record<EstatusProducto, { label: string; cls: string }> = {
  disponible: { label: "Disponible", cls: "is-ok" },
  pausado:    { label: "Pausado",    cls: "is-off" },
  agotado:    { label: "Agotado",    cls: "is-bad" },
}

export function EstatusBadge({ estatus }: EstatusBadgeProps) {
  const cfg = config[estatus] ?? config.disponible
  return <span className={`nx-badge ${cfg.cls}`}>{cfg.label}</span>
}
