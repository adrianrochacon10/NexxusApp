import type { EstatusOperativoVenta, EstatusPagoVenta } from "@/types/ventas.types"

const PAGO_CONFIG: Record<EstatusPagoVenta, { label: string; cls: string }> = {
  pagada:    { label: "Pagada",    cls: "is-ok" },
  parcial:   { label: "Parcial",   cls: "is-warn" },
  pendiente: { label: "Pendiente", cls: "is-warn" },
}

const OPERATIVO_CONFIG: Record<EstatusOperativoVenta, { label: string; cls: string }> = {
  activa:    { label: "Activa",    cls: "is-off" },
  cancelada: { label: "Cancelada", cls: "is-bad" },
}

export function EstatusPagoBadge({ estatus }: { estatus: EstatusPagoVenta }) {
  const cfg = PAGO_CONFIG[estatus] ?? PAGO_CONFIG.pendiente
  return <span className={`nx-badge ${cfg.cls}`}>{cfg.label}</span>
}

export function EstatusOperativoBadge({ estatus }: { estatus: EstatusOperativoVenta }) {
  const cfg = OPERATIVO_CONFIG[estatus] ?? OPERATIVO_CONFIG.activa
  return <span className={`nx-badge ${cfg.cls}`}>{cfg.label}</span>
}
