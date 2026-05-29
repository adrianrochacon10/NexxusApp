"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PackagePlus } from "lucide-react"
import { actualizarStockVariante } from "@/actions/inventario"
import { EstatusBadge } from "@/components/inventario/EstatusBadge"

interface Variante {
  id:          string
  nombre:      string
  sku:         string | null
  stock:       number
  stock_minimo: number
  estatus:     string
}

const TIPOS = [
  { value: "entrada" as const, label: "Entrada" },
  { value: "salida"  as const, label: "Salida"  },
  { value: "ajuste"  as const, label: "Ajuste"  },
]

export function VariantesStockInline({ variantes, productoId }: { variantes: Variante[]; productoId: string }) {
  const router = useRouter()

  // Estado por variante: tipo + cantidad + notas + cargando + error
  const [estados, setEstados] = useState<Record<string, {
    tipo:     "entrada" | "salida" | "ajuste"
    cantidad: string
    notas:    string
    cargando: boolean
    error:    string
    ok:       boolean
  }>>(() =>
    Object.fromEntries(variantes.map((v) => [
      v.id,
      { tipo: "entrada", cantidad: "", notas: "", cargando: false, error: "", ok: false },
    ]))
  )

  function set(varId: string, cambios: Partial<typeof estados[string]>) {
    setEstados((prev) => ({ ...prev, [varId]: { ...prev[varId], ...cambios } }))
  }

  async function guardar(variante: Variante) {
    const e = estados[variante.id]
    const cantidad = parseInt(e.cantidad)
    if (!cantidad || cantidad <= 0) {
      set(variante.id, { error: "Ingresa una cantidad válida." })
      return
    }
    set(variante.id, { cargando: true, error: "" })
    try {
      await actualizarStockVariante(variante.id, productoId, e.tipo, cantidad, e.notas || undefined)
      set(variante.id, { cargando: false, ok: true, cantidad: "", notas: "" })
      setTimeout(() => set(variante.id, { ok: false }), 2000)
      router.refresh()
    } catch (err) {
      set(variante.id, { cargando: false, error: err instanceof Error ? err.message : "Error al actualizar." })
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 90px", gap: 12, padding: "0 8px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        <span>Talla / Variante</span>
        <span>Stock</span>
        <span>Mínimo</span>
        <span>Estatus</span>
      </div>

      {variantes.map((v) => {
        const e = estados[v.id]
        return (
          <div key={v.id} style={{ borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--surface-3)", overflow: "hidden" }}>
            {/* Fila de info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 90px", gap: 12, alignItems: "center", padding: "10px 8px" }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{v.nombre}</span>
                {v.sku && <span className="font-mono" style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 8 }}>{v.sku}</span>}
              </div>
              <span
                className="font-mono"
                style={{ fontSize: 14, color: v.stock === 0 ? "var(--error)" : v.stock <= v.stock_minimo ? "var(--warning)" : undefined }}
              >
                {v.stock}
              </span>
              <span className="font-mono" style={{ fontSize: 14, color: "var(--text-secondary)" }}>{v.stock_minimo}</span>
              <EstatusBadge estatus={v.estatus as "disponible" | "pausado" | "agotado"} />
            </div>

            {/* Controles inline */}
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr auto", gap: 8, padding: "8px", borderTop: "1px solid var(--border-subtle)", background: "var(--surface-2)", alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 4, paddingLeft: 2 }}>Tipo</div>
                <select
                  className="input"
                  value={e.tipo}
                  onChange={(ev) => set(v.id, { tipo: ev.target.value as "entrada" | "salida" | "ajuste", error: "" })}
                  style={{ fontSize: 12, height: 34, minHeight: 34, padding: "0 8px" }}
                  disabled={e.cargando}
                >
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 4, paddingLeft: 2 }}>
                  {e.tipo === "ajuste" ? "Stock final" : "Cantidad"}
                </div>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={e.cantidad}
                  onChange={(ev) => set(v.id, { cantidad: ev.target.value, error: "", ok: false })}
                  placeholder={e.tipo === "ajuste" ? "Nuevo total" : "0"}
                  style={{ fontSize: 13, height: 34, minHeight: 34 }}
                  disabled={e.cargando}
                />
              </div>

              <div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 4, paddingLeft: 2 }}>Notas</div>
                <input
                  className="input"
                  value={e.notas}
                  onChange={(ev) => set(v.id, { notas: ev.target.value })}
                  placeholder="Opcional"
                  style={{ fontSize: 12, height: 34, minHeight: 34 }}
                  disabled={e.cargando}
                />
              </div>

              <button
                type="button"
                className={e.ok ? "button" : "button button-primary"}
                onClick={() => guardar(v)}
                disabled={e.cargando || !e.cantidad}
                style={{ height: 34, minHeight: 34, padding: "0 12px", fontSize: 12, flexShrink: 0, alignSelf: "end",
                  ...(e.ok ? { color: "var(--success)", borderColor: "rgba(74,155,111,0.4)" } : {})
                }}
              >
                {e.ok ? "✓" : e.cargando ? "…" : <PackagePlus size={15} aria-hidden="true" />}
              </button>
            </div>

            {e.error && (
              <div style={{ padding: "6px 8px", fontSize: 12, color: "var(--error)", background: "rgba(155,74,74,0.08)" }}>
                {e.error}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
