"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { registrarAbono, cancelarVenta } from "@/actions/ventas"

const FORMAS_PAGO_ABONO = [
  { value: "efectivo"      as const, label: "Efectivo"      },
  { value: "tarjeta"       as const, label: "Tarjeta"       },
  { value: "transferencia" as const, label: "Transferencia" },
]

export function AbonoForm({ ventaId, saldoPendiente }: { ventaId: string; saldoPendiente: number }) {
  const router = useRouter()
  const [mostrar,    setMostrar]    = useState(false)
  const [monto,      setMonto]      = useState("")
  const [forma,      setForma]      = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo")
  const [guardando,  setGuardando]  = useState(false)
  const [error,      setError]      = useState("")

  async function handleAbono() {
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0 || montoNum > saldoPendiente) return
    setGuardando(true)
    setError("")
    try {
      await registrarAbono(ventaId, montoNum, forma)
      setMonto("")
      setMostrar(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar abono.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="surface" style={{ padding: 20, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Registrar abono</h2>
        <button
          type="button"
          className="button"
          onClick={() => setMostrar((v) => !v)}
          style={{ color: mostrar ? "var(--text-secondary)" : "var(--accent-gold)", borderColor: mostrar ? "var(--border-subtle)" : "rgba(201,168,76,0.3)" }}
        >
          <Plus size={15} aria-hidden="true" />
          {mostrar ? "Cancelar" : "Nuevo abono"}
        </button>
      </div>

      {mostrar && (
        <div style={{ display: "grid", gap: 10, padding: 14, borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
              Monto *
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-tertiary)" }}>$</span>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={saldoPendiente}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  style={{ paddingLeft: 22, fontSize: 13 }}
                  autoFocus
                />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Máx: {formatCurrency(saldoPendiente)}</span>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
              Forma de pago
              <select className="input" value={forma} onChange={(e) => setForma(e.target.value as typeof forma)} style={{ fontSize: 13 }}>
                {FORMAS_PAGO_ABONO.map((fp) => <option key={fp.value} value={fp.value}>{fp.label}</option>)}
              </select>
            </label>
          </div>
          {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error)" }}>{error}</p>}
          <button
            type="button"
            className="button button-primary"
            onClick={handleAbono}
            disabled={guardando || !parseFloat(monto) || parseFloat(monto) > saldoPendiente}
            style={{ minHeight: 40 }}
          >
            {guardando ? "Registrando…" : "Confirmar abono"}
          </button>
        </div>
      )}
    </section>
  )
}

export function CancelarVentaForm({ ventaId }: { ventaId: string }) {
  const router = useRouter()
  const [mostrar,    setMostrar]    = useState(false)
  const [motivo,     setMotivo]     = useState("")
  const [cancelando, setCancelando] = useState(false)
  const [error,      setError]      = useState("")

  async function handleCancelar() {
    if (!motivo.trim()) return
    setCancelando(true)
    setError("")
    try {
      await cancelarVenta(ventaId, motivo.trim())
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar.")
      setCancelando(false)
    }
  }

  return (
    <section className="surface elevated" style={{ padding: 20, display: "grid", gap: 10 }}>
      {!mostrar ? (
        <button
          type="button"
          className="button"
          onClick={() => setMostrar(true)}
          style={{ color: "var(--error)", borderColor: "rgba(155,74,74,0.3)", justifyContent: "center" }}
        >
          <Ban size={14} aria-hidden="true" />
          Cancelar venta
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--error)" }}>
            Esta acción no se puede deshacer. La venta quedará bloqueada.
          </p>
          <textarea
            className="input"
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo de cancelación *"
            style={{ fontSize: 13, resize: "none" }}
          />
          {error && <p style={{ margin: 0, fontSize: 13, color: "var(--error)" }}>{error}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button type="button" className="button" onClick={() => setMostrar(false)} style={{ justifyContent: "center" }}>Volver</button>
            <button
              type="button"
              className="button"
              onClick={handleCancelar}
              disabled={cancelando || !motivo.trim()}
              style={{ color: "var(--error)", borderColor: "rgba(155,74,74,0.3)", justifyContent: "center" }}
            >
              {cancelando ? "Cancelando…" : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
