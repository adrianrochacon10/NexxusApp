"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

export interface VarianteFormData {
  id?: string
  nombre: string
  sku: string
  stock: number
  stockMinimo: number
  atributos: Record<string, string>
}

interface Props {
  variantes: VarianteFormData[]
  onChange: (variantes: VarianteFormData[]) => void
}

const TALLAS_PRESET = ["Chica", "Mediana", "Grande", "Extra Grande"]

function varianteVacia(): VarianteFormData {
  return { nombre: "", sku: "", stock: 0, stockMinimo: 2, atributos: {} }
}

export function VariantesEditor({ variantes, onChange }: Props) {
  const [usarTallasPreset, setUsarTallasPreset] = useState(false)

  function agregar() {
    onChange([...variantes, varianteVacia()])
  }

  function agregarPreset(talla: string) {
    if (variantes.some((v) => v.nombre === talla)) return
    onChange([...variantes, { nombre: talla, sku: "", stock: 0, stockMinimo: 2, atributos: { Talla: talla } }])
  }

  function actualizar(i: number, campo: keyof VarianteFormData, valor: string | number) {
    onChange(variantes.map((v, idx) => {
      if (idx !== i) return v
      if (campo === "nombre") {
        return { ...v, nombre: valor as string, atributos: { ...v.atributos, Talla: valor as string } }
      }
      return { ...v, [campo]: valor }
    }))
  }

  function eliminar(i: number) {
    onChange(variantes.filter((_, idx) => idx !== i))
  }

  const stockTotal = variantes.reduce((s, v) => s + (Number(v.stock) || 0), 0)

  return (
    <div style={{ display: "grid", gap: 14 }}>

      {/* Preset de tallas */}
      <div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
          Tallas comunes — clic para agregar
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TALLAS_PRESET.map((talla) => {
            const existe = variantes.some((v) => v.nombre === talla)
            return (
              <button
                key={talla}
                type="button"
                onClick={() => agregarPreset(talla)}
                disabled={existe}
                style={{
                  padding: "5px 14px", borderRadius: 999, fontSize: 12, cursor: existe ? "default" : "pointer",
                  border: `1px solid ${existe ? "var(--accent-gold)" : "var(--border-subtle)"}`,
                  background: existe ? "var(--accent-gold-subtle)" : "var(--surface-3)",
                  color: existe ? "var(--accent-gold)" : "var(--text-secondary)",
                  transition: "all 120ms",
                }}
              >
                {talla}
                {existe && " ✓"}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista de variantes */}
      {variantes.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px 80px auto", gap: 8, padding: "0 6px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
            <span>Nombre / Talla</span>
            <span>SKU (opcional)</span>
            <span>Stock</span>
            <span>Mín.</span>
            <span />
          </div>

          {variantes.map((v, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px 80px auto", gap: 8, alignItems: "center" }}>
              <input
                className="input"
                value={v.nombre}
                onChange={(e) => actualizar(i, "nombre", e.target.value)}
                placeholder="Ej. Mediana"
                style={{ fontSize: 13 }}
              />
              <input
                className="input"
                value={v.sku}
                onChange={(e) => actualizar(i, "sku", e.target.value)}
                placeholder="Auto"
                style={{ fontSize: 12 }}
              />
              <input
                className="input"
                type="number"
                min="0"
                value={v.stock}
                onChange={(e) => actualizar(i, "stock", Number(e.target.value))}
                style={{ fontSize: 13 }}
              />
              <input
                className="input"
                type="number"
                min="0"
                value={v.stockMinimo}
                onChange={(e) => actualizar(i, "stockMinimo", Number(e.target.value))}
                style={{ fontSize: 13 }}
              />
              <button
                type="button"
                className="button"
                onClick={() => eliminar(i)}
                aria-label="Eliminar variante"
                style={{ padding: "0 10px", color: "var(--text-secondary)", minHeight: 36, height: 36 }}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          className="button"
          onClick={agregar}
          style={{ width: "fit-content", color: "var(--accent-gold)", borderColor: "rgba(201,168,76,0.3)" }}
        >
          <Plus size={15} aria-hidden="true" />
          Agregar variante personalizada
        </button>

        {variantes.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Stock total: <strong style={{ color: "var(--text-primary)" }}>{stockTotal}</strong>
          </span>
        )}
      </div>
    </div>
  )
}
