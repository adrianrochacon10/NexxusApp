"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { Venta } from "@/types/ventas.types"

interface Props {
  venta: Venta
  onClose: () => void
}

const FORMAS_PAGO = [
  { value: "efectivo"      as const, label: "Efectivo"      },
  { value: "tarjeta"       as const, label: "Tarjeta"        },
  { value: "transferencia" as const, label: "Transferencia"  },
]

export function AbonoModal({ venta, onClose }: Props) {
  const registrarAbono = useStore((s) => s.registrarAbono)

  const [monto,     setMonto]     = useState("")
  const [formaPago, setFormaPago] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo")
  const [notas,     setNotas]     = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState("")

  const montoNum  = parseFloat(monto) || 0
  const saldoNuevo = Math.max(0, venta.saldoPendiente - montoNum)

  function validar() {
    if (montoNum <= 0)                       return "Ingresa un monto válido."
    if (montoNum > venta.saldoPendiente)     return `El monto no puede superar el saldo (${formatCurrency(venta.saldoPendiente)}).`
    return ""
  }

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    const err = validar()
    if (err) { setError(err); return }
    setError("")
    setGuardando(true)
    registrarAbono({
      ventaId:   venta.id,
      monto:     montoNum,
      formaPago,
      notas:     notas.trim() || undefined,
    })
    setGuardando(false)
    onClose()
  }

  return (
    /* Overlay */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Registrar abono — ${venta.folio}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "grid", placeItems: "center", padding: 20,
      }}
    >
      <div
        className="surface"
        style={{ width: "min(480px, 100%)", borderRadius: 12, padding: 28, display: "grid", gap: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 className="font-display" style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 500 }}>
              Registrar abono
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              {venta.folio} · {venta.cliente?.nombre ?? "Sin cliente"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, marginTop: -2 }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Resumen de saldo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <SaldoItem label="Total"    value={formatCurrency(venta.total)}           />
          <SaldoItem label="Cobrado"  value={formatCurrency(venta.montoPagado)}     color="var(--success)" />
          <SaldoItem label="Pendiente" value={formatCurrency(venta.saldoPendiente)} color="var(--warning)" />
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>

          {error && (
            <div role="alert" style={{ padding: "10px 12px", borderRadius: 6, fontSize: 13, border: "1px solid rgba(155,74,74,0.4)", background: "rgba(155,74,74,0.1)", color: "var(--error)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
              Monto *
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", fontSize: 13 }}>$</span>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={monto}
                  onChange={(e) => { setMonto(e.target.value); setError("") }}
                  placeholder="0.00"
                  style={{ paddingLeft: 24 }}
                  autoFocus
                  required
                />
              </div>
            </label>

            <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
              Forma de pago
              <select className="input" value={formaPago} onChange={(e) => setFormaPago(e.target.value as typeof formaPago)}>
                {FORMAS_PAGO.map((fp) => (
                  <option key={fp.value} value={fp.value}>{fp.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            Notas (opcional)
            <input className="input" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. Segunda parcialidad…" />
          </label>

          {/* Preview saldo nuevo */}
          {montoNum > 0 && montoNum <= venta.saldoPendiente && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
              <span style={{ color: "var(--text-secondary)" }}>Saldo restante después del abono</span>
              <span className="font-mono" style={{ fontWeight: 600, color: saldoNuevo === 0 ? "var(--success)" : "var(--warning)" }}>
                {saldoNuevo === 0 ? "¡Saldado ✓" : formatCurrency(saldoNuevo)}
              </span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            <button type="button" className="button" onClick={onClose} style={{ justifyContent: "center" }}>
              Cancelar
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={guardando || montoNum <= 0}
              style={{ justifyContent: "center" }}
            >
              {guardando ? "Registrando…" : "Confirmar abono"}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

function SaldoItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>{label}</div>
      <div className="font-mono" style={{ fontSize: 15, fontWeight: 600, color: color ?? "var(--text-primary)" }}>{value}</div>
    </div>
  )
}
