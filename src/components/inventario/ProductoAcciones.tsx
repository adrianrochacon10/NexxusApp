"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, CheckCircle, PauseCircle, Trash2 } from "lucide-react"
import { eliminarProducto, cambiarEstatusProducto } from "@/actions/inventario"

type Estatus = "disponible" | "pausado" | "agotado"

const OPCIONES_ESTATUS: { value: Estatus; label: string; color: string }[] = [
  { value: "disponible", label: "Disponible",    color: "var(--success)" },
  { value: "pausado",    label: "Pausado",        color: "var(--warning)" },
  { value: "agotado",    label: "Agotado",        color: "var(--error)"   },
]

export function ProductoAcciones({ productoId, estatusActual }: { productoId: string; estatusActual: Estatus }) {
  const router = useRouter()
  const [guardandoEstatus, setGuardandoEstatus] = useState(false)
  const [eliminando,       setEliminando]       = useState(false)
  const [confirmar,        setConfirmar]        = useState(false)
  const [error,            setError]            = useState("")

  async function handleEstatus(nuevoEstatus: Estatus) {
    if (nuevoEstatus === estatusActual) return
    setGuardandoEstatus(true)
    setError("")
    try {
      await cambiarEstatusProducto(productoId, nuevoEstatus)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estatus.")
    } finally {
      setGuardandoEstatus(false)
    }
  }

  async function handleEliminar() {
    setEliminando(true)
    setError("")
    try {
      await eliminarProducto(productoId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.")
      setEliminando(false)
      setConfirmar(false)
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>

      {/* Cambiar estatus */}
      <section className="surface elevated" style={{ padding: 20, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {estatusActual === "disponible"
            ? <CheckCircle size={15} color="var(--success)" aria-hidden="true" />
            : estatusActual === "pausado"
            ? <PauseCircle size={15} color="var(--warning)" aria-hidden="true" />
            : <Ban size={15} color="var(--error)" aria-hidden="true" />
          }
          <span style={{ fontSize: 13, fontWeight: 500 }}>Estado del producto</span>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          {OPCIONES_ESTATUS.map((op) => (
            <button
              key={op.value}
              type="button"
              onClick={() => handleEstatus(op.value)}
              disabled={guardandoEstatus || op.value === estatusActual}
              style={{
                padding: "9px 14px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                textAlign: "left",
                cursor: op.value === estatusActual ? "default" : "pointer",
                border: `1px solid ${op.value === estatusActual ? op.color : "var(--border-subtle)"}`,
                background: op.value === estatusActual ? `color-mix(in srgb, ${op.color} 12%, transparent)` : "var(--surface-3)",
                color: op.value === estatusActual ? op.color : "var(--text-secondary)",
                transition: "all 120ms",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: op.color, flexShrink: 0 }} aria-hidden="true" />
              {op.label}
              {op.value === estatusActual && <span style={{ marginLeft: "auto", fontSize: 11 }}>✓ Actual</span>}
            </button>
          ))}
        </div>
        {guardandoEstatus && <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)" }}>Guardando…</p>}
      </section>

      {/* Eliminar */}
      <section className="surface elevated" style={{ padding: 20, display: "grid", gap: 10 }}>
        {!confirmar ? (
          <button
            type="button"
            className="button"
            onClick={() => setConfirmar(true)}
            style={{ color: "var(--error)", borderColor: "rgba(155,74,74,0.3)", justifyContent: "center" }}
          >
            <Trash2 size={14} aria-hidden="true" />
            Eliminar producto
          </button>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--error)", lineHeight: 1.5 }}>
              <strong>¿Eliminar definitivamente?</strong><br />
              Se borrará el producto, sus variantes, movimientos de stock e imagen de Cloudflare. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                type="button"
                className="button"
                onClick={() => setConfirmar(false)}
                disabled={eliminando}
                style={{ justifyContent: "center" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button"
                onClick={handleEliminar}
                disabled={eliminando}
                style={{ color: "var(--error)", borderColor: "rgba(155,74,74,0.3)", justifyContent: "center" }}
              >
                <Trash2 size={13} aria-hidden="true" />
                {eliminando ? "Eliminando…" : "Confirmar"}
              </button>
            </div>
          </div>
        )}
        {error && <p style={{ margin: 0, fontSize: 12, color: "var(--error)" }}>{error}</p>}
      </section>

    </div>
  )
}
