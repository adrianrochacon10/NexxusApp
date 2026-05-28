import type { EstatusOperativoVenta, EstatusPagoVenta } from "@/types/ventas.types"

const PAGO_CONFIG: Record<EstatusPagoVenta, { label: string; color: string; bg: string; border: string }> = {
  pagada:   { label: "Pagada",   color: "var(--success)", bg: "rgba(74,155,111,0.12)",  border: "rgba(74,155,111,0.3)"  },
  parcial:  { label: "Parcial",  color: "var(--warning)", bg: "rgba(155,122,74,0.12)",  border: "rgba(155,122,74,0.3)"  },
  pendiente:{ label: "Pendiente",color: "var(--error)",   bg: "rgba(155,74,74,0.12)",   border: "rgba(155,74,74,0.3)"   },
}

const OPERATIVO_CONFIG: Record<EstatusOperativoVenta, { label: string; color: string; bg: string; border: string }> = {
  activa:   { label: "Activa",   color: "var(--text-secondary)", bg: "var(--surface-3)", border: "var(--border-subtle)" },
  cancelada:{ label: "Cancelada",color: "var(--error)",          bg: "rgba(155,74,74,0.12)", border: "rgba(155,74,74,0.3)" },
}

export function EstatusPagoBadge({ estatus }: { estatus: EstatusPagoVenta }) {
  const cfg = PAGO_CONFIG[estatus] ?? PAGO_CONFIG["pendiente"]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 9px",
      borderRadius: 999, fontSize: 11, fontWeight: 500,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

export function EstatusOperativoBadge({ estatus }: { estatus: EstatusOperativoVenta }) {
  const cfg = OPERATIVO_CONFIG[estatus] ?? OPERATIVO_CONFIG["activa"]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 9px",
      borderRadius: 999, fontSize: 11, fontWeight: 500,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}
