"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Plus, Save, X } from "lucide-react"
import { Navbar } from "@/components/shared/Navbar"
import { crearCategoria } from "@/actions/categorias"
import { mensajeError } from "@/components/inventario/inventario-utils"
import { exigirOk } from "@/lib/action-result"

const COLORES_PRESET = [
  { hex: "#3B4FD8", nombre: "Índigo" },
  { hex: "#0E8F8F", nombre: "Verde azulado" },
  { hex: "#7C4DD6", nombre: "Violeta" },
  { hex: "#C2417A", nombre: "Frambuesa" },
  { hex: "#2A82D0", nombre: "Azul" },
  { hex: "#8A7A14", nombre: "Oliva" },
  { hex: "#B45F2B", nombre: "Terracota" },
  { hex: "#64748B", nombre: "Pizarra" },
]

export default function NuevaCategoria() {
  const router = useRouter()
  const [nombre,    setNombre]    = useState("")
  const [color,     setColor]     = useState(COLORES_PRESET[0].hex)
  const [atributos, setAtributos] = useState<string[]>([""])
  const [guardando, setGuardando] = useState(false)
  const [intentado, setIntentado] = useState(false)
  const [error,     setError]     = useState("")

  function agregarAtributo()                      { setAtributos((prev) => [...prev, ""]) }
  function editarAtributo(i: number, v: string)   { setAtributos((prev) => prev.map((a, idx) => idx === i ? v : a)) }
  function eliminarAtributo(i: number)            { setAtributos((prev) => prev.filter((_, idx) => idx !== i)) }

  const errorNombre = intentado && !nombre.trim()

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setIntentado(true)
    if (!nombre.trim()) return
    setError("")
    setGuardando(true)
    try {
      exigirOk(await crearCategoria({ nombre: nombre.trim(), tipo: "producto", color, atributosBase: atributos.map((a) => a.trim()).filter(Boolean) }))
      router.push("/inventario")
      router.refresh()
    } catch (err) {
      setError(mensajeError(err, "Error al crear la categoría."))
      setGuardando(false)
    }
  }

  const atributosValidos = atributos.map((a) => a.trim()).filter(Boolean)
  const presetActivo = COLORES_PRESET.some((c) => c.hex.toLowerCase() === color.toLowerCase())

  return (
    <>
      <Navbar
        eyebrow="Inventario"
        title="Nueva categoría"
        subtitle="Los atributos que definas aparecerán en el formulario de cada producto de esta categoría."
        actions={<Link href="/inventario" className="nx-btn nx-btn-secondary">Cancelar</Link>}
      />
      <div className="page">
        <form onSubmit={handleSubmit} noValidate className="inv-form-grid">
          <div className="nx-col gap-16">
            {error && (
              <div className="nx-alert is-bad" role="alert">
                <AlertCircle size={22} aria-hidden="true" style={{ flex: "none" }} />
                <div><div className="ttl">No se pudo crear la categoría</div><div className="txt">{error}</div></div>
              </div>
            )}

            <section className="nx-card nx-col gap-20 inv-form-card" style={{ padding: 24 }}>
              <h2 className="t-h2">Información</h2>
              <div className="nx-field">
                <label className="nx-label" htmlFor="cat-nombre">Nombre de la categoría<i>*</i></label>
                <input
                  id="cat-nombre"
                  className={`nx-input ${errorNombre ? "is-error" : ""}`}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Blusas, Perfumes, Accesorios"
                  autoFocus
                  aria-invalid={errorNombre}
                  aria-describedby={errorNombre ? "cat-nombre-error" : undefined}
                />
                {errorNombre && (
                  <span className="nx-error" id="cat-nombre-error"><AlertCircle size={16} aria-hidden="true" />Escribe el nombre de la categoría.</span>
                )}
              </div>

              <fieldset className="nx-field" style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="nx-label" style={{ marginBottom: 6 }}>Color identificador</legend>
                <div className="inv-swatches">
                  {COLORES_PRESET.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      className="inv-swatch"
                      onClick={() => setColor(c.hex)}
                      aria-label={c.nombre}
                      aria-pressed={color.toLowerCase() === c.hex.toLowerCase()}
                      title={c.nombre}
                    >
                      <span style={{ background: c.hex }} />
                    </button>
                  ))}
                  <input
                    type="color"
                    className="inv-swatch-custom"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    aria-label="Color personalizado"
                    title="Color personalizado"
                    style={!presetActivo ? { boxShadow: "0 0 0 2px var(--nx-ink)" } : undefined}
                  />
                </div>
              </fieldset>
            </section>

            <section className="nx-card nx-col gap-16 inv-form-card" style={{ padding: 24 }}>
              <div>
                <h2 className="t-h2">Atributos base</h2>
                <p className="t-small" style={{ marginTop: 4 }}>Cada atributo se convierte en un campo al crear productos de esta categoría. Ej. Talla, Color, Marca.</p>
              </div>
              <div className="nx-col gap-8">
                {atributos.map((atributo, i) => (
                  <div key={i} className="nx-row gap-8">
                    <input
                      className="nx-input"
                      value={atributo}
                      onChange={(e) => editarAtributo(i, e.target.value)}
                      placeholder={i === 0 ? "Ej. Talla" : `Atributo ${i + 1}`}
                      aria-label={`Atributo ${i + 1}`}
                    />
                    <button type="button" className="nx-iconbtn danger" onClick={() => eliminarAtributo(i)} aria-label={`Quitar atributo ${i + 1}`}>
                      <X size={20} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <button type="button" className="nx-btn nx-btn-secondary" onClick={agregarAtributo}>
                  <Plus size={18} strokeWidth={2.2} aria-hidden="true" />
                  Agregar atributo
                </button>
              </div>
            </section>
          </div>

          <aside className="nx-col gap-16">
            <section className="nx-card nx-col gap-12 inv-form-card" style={{ padding: 20 }}>
              <h2 className="t-h2">Vista previa</h2>
              <div className="nx-row gap-12" style={{ flexWrap: "wrap" }}>
                <span className="nx-catdot" style={{ background: color }} aria-hidden="true" />
                <span className="t-h2">{nombre.trim() || "Nombre de categoría"}</span>
              </div>
              {atributosValidos.length > 0 ? (
                <div className="nx-row gap-4" style={{ flexWrap: "wrap" }}>
                  {atributosValidos.map((a) => <span key={a} className="nx-attr">{a}</span>)}
                </div>
              ) : (
                <p className="t-small">Sin atributos definidos.</p>
              )}
            </section>

            <button className="nx-btn nx-btn-primary nx-btn-lg nx-btn-block" type="submit" disabled={guardando}>
              <Save size={20} aria-hidden="true" />
              {guardando ? "Guardando…" : "Crear categoría"}
            </button>
          </aside>
        </form>
      </div>
    </>
  )
}
