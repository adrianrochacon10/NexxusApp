"use client"

import { AlertCircle, Plus, X } from "lucide-react"

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
  /** SKU del producto: se usa para sugerir el de cada variante. */
  skuBase?: string
  /** Muestra errores de validación (tras intentar guardar). */
  intentado?: boolean
}

const TALLAS_PRESET = ["Chica", "Mediana", "Grande", "Extra Grande"]

export function varianteVacia(): VarianteFormData {
  return { nombre: "", sku: "", stock: 0, stockMinimo: 2, atributos: {} }
}

function entero(valor: string): number {
  const n = parseInt(valor.replace(/[^\d]/g, ""), 10)
  return Number.isNaN(n) ? 0 : n
}

export function VariantesEditor({ variantes, onChange, skuBase = "", intentado = false }: Props) {
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

  function actualizarColor(i: number, color: string) {
    onChange(variantes.map((v, idx) => {
      if (idx !== i) return v
      const atributos = { ...v.atributos }
      if (color.trim()) atributos.Color = color
      else delete atributos.Color
      return { ...v, atributos }
    }))
  }

  function eliminar(i: number) {
    onChange(variantes.filter((_, idx) => idx !== i))
  }

  const seleccionar = (e: React.FocusEvent<HTMLInputElement>) => e.target.select()

  return (
    <div className="nx-col gap-12">
      <div className="inv-presets" role="group" aria-label="Tallas comunes">
        <span className="t-small">Tallas comunes:</span>
        {TALLAS_PRESET.map((talla) => {
          const existe = variantes.some((v) => v.nombre === talla)
          return (
            <button
              key={talla}
              type="button"
              className={`nx-chip ${existe ? "is-on" : ""}`}
              onClick={() => agregarPreset(talla)}
              aria-pressed={existe}
              disabled={existe}
              style={{ minHeight: 40, padding: "0 14px", cursor: existe ? "default" : "pointer" }}
            >
              {!existe && <Plus size={16} aria-hidden="true" />}
              {talla}
            </button>
          )
        })}
      </div>

      {variantes.length > 0 && (
        <div className="nx-col gap-8">
          <div className="inv-vgrid inv-vhead" aria-hidden="true">
            <span className="t-cap">Talla / nombre</span>
            <span className="t-cap">Color</span>
            <span className="t-cap">SKU</span>
            <span className="t-cap">Stock</span>
            <span className="t-cap">Mínimo</span>
            <span />
          </div>

          {variantes.map((v, i) => {
            const id = `var-${i}`
            const errorNombre = intentado && !v.nombre.trim()
            const agotada = v.stock === 0
            const baja = !agotada && v.stock <= v.stockMinimo
            const nota = agotada ? "Agotada" : baja ? "En o bajo el mínimo" : ""
            const titulo = v.nombre.trim() || `Variante ${i + 1}`
            return (
              <div key={i} className={`inv-vrow ${baja ? "is-low" : ""}`}>
                <div className="inv-vrow-title">
                  <b className="t-h3 grow">{titulo}</b>
                  {agotada ? <span className="nx-badge is-bad">Agotada</span> : baja ? <span className="nx-badge is-warn">Quedan {v.stock}</span> : null}
                  <button type="button" className="nx-iconbtn danger" onClick={() => eliminar(i)} aria-label={`Quitar variante ${titulo}`}>
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>
                <div className="inv-vgrid">
                  <div className="nx-field v-talla">
                    <label className="nx-label inv-vlabel" htmlFor={`${id}-nombre`}>Talla / nombre<i>*</i></label>
                    <input
                      id={`${id}-nombre`}
                      className={`nx-input ${errorNombre ? "is-error" : ""}`}
                      value={v.nombre}
                      onChange={(e) => actualizar(i, "nombre", e.target.value)}
                      placeholder="M"
                      aria-label={`Talla o nombre de la variante ${i + 1}`}
                      aria-invalid={errorNombre}
                      aria-describedby={errorNombre ? `${id}-error` : undefined}
                    />
                  </div>
                  <div className="nx-field v-color">
                    <label className="nx-label inv-vlabel" htmlFor={`${id}-color`}>Color</label>
                    <input
                      id={`${id}-color`}
                      className="nx-input"
                      value={v.atributos.Color ?? ""}
                      onChange={(e) => actualizarColor(i, e.target.value)}
                      placeholder="Opcional"
                      aria-label={`Color de la variante ${i + 1}`}
                    />
                  </div>
                  <div className="nx-field v-sku">
                    <label className="nx-label inv-vlabel" htmlFor={`${id}-sku`}>SKU</label>
                    <input
                      id={`${id}-sku`}
                      className="nx-input nx-mono"
                      style={{ fontSize: 13 }}
                      value={v.sku}
                      onChange={(e) => actualizar(i, "sku", e.target.value)}
                      placeholder={skuBase && v.nombre.trim() ? `${skuBase}-${v.nombre.trim().toUpperCase().replace(/\s+/g, "")}` : "Opcional"}
                      aria-label={`SKU de la variante ${i + 1}`}
                    />
                  </div>
                  <div className="nx-field v-stock">
                    <label className="nx-label inv-vlabel" htmlFor={`${id}-stock`}>Stock</label>
                    <input
                      id={`${id}-stock`}
                      className="nx-input nx-num"
                      inputMode="numeric"
                      value={String(v.stock)}
                      onFocus={seleccionar}
                      onChange={(e) => actualizar(i, "stock", entero(e.target.value))}
                      // Variante ya guardada: su stock cambia con movimientos, no aquí
                      readOnly={Boolean(v.id)}
                      title={v.id ? "Registra una entrada o ajuste desde la ficha del producto" : undefined}
                      aria-label={`Stock de la variante ${i + 1}`}
                    />
                  </div>
                  <div className="nx-field v-min">
                    <label className="nx-label inv-vlabel" htmlFor={`${id}-min`}>Mín.</label>
                    <input
                      id={`${id}-min`}
                      className="nx-input nx-num"
                      inputMode="numeric"
                      value={String(v.stockMinimo)}
                      onFocus={seleccionar}
                      onChange={(e) => actualizar(i, "stockMinimo", entero(e.target.value))}
                      aria-label={`Stock mínimo de la variante ${i + 1}`}
                    />
                  </div>
                  <div className="v-del">
                    <button type="button" className="nx-iconbtn danger" onClick={() => eliminar(i)} aria-label={`Quitar variante ${titulo}`}>
                      <X size={20} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {errorNombre && (
                  <span className="nx-error" id={`${id}-error`}><AlertCircle size={16} aria-hidden="true" />Escribe la talla o el nombre de la variante.</span>
                )}
                {nota && (
                  <span className="nx-hint inv-vnote" style={{ color: agotada ? "var(--nx-bad-fg)" : "var(--nx-warn-fg)" }}>{nota}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div>
        <button type="button" className="nx-btn nx-btn-secondary" onClick={agregar}>
          <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
          Agregar variante
        </button>
      </div>
    </div>
  )
}
