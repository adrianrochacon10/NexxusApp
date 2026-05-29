"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/shared/Navbar"
import { crearCategoria } from "@/actions/categorias"

const COLORES_PRESET = [
  "#c9a84c", "#4a6b9b", "#4a9b6f", "#9b4a4a",
  "#9b7a4a", "#7a4a9b", "#4a9b9b", "#9b9b4a",
]

export default function NuevaCategoria() {
  const router = useRouter()
  const [nombre,    setNombre]    = useState("")
  const [color,     setColor]     = useState(COLORES_PRESET[0])
  const [atributos, setAtributos] = useState<string[]>([""])
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState("")

  function agregarAtributo()           { setAtributos((prev) => [...prev, ""]) }
  function editarAtributo(i: number, v: string) { setAtributos((prev) => prev.map((a, idx) => idx === i ? v : a)) }
  function eliminarAtributo(i: number) { setAtributos((prev) => prev.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!nombre.trim()) { setError("El nombre de la categoría es requerido."); return }
    setError("")
    setGuardando(true)
    try {
      await crearCategoria({ nombre: nombre.trim(), tipo: "producto", color, atributosBase: atributos.filter(Boolean) })
      router.push("/inventario")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la categoría.")
      setGuardando(false)
    }
  }

  const atributosValidos = atributos.filter((a) => a.trim())

  return (
    <>
      <Navbar title="Nueva categoría" subtitle="Define el nombre, color y atributos base de la categoría." hideActions />
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Link href="/inventario" className="button" style={{ padding: "0 12px", flexShrink: 0 }} aria-label="Volver">
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14 }}>
            Los atributos que definas aquí aparecerán en el formulario de cada producto de esta categoría.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <div style={{ display: "grid", gap: 14 }}>
            {error && (
              <div role="alert" style={{ padding: "12px 14px", borderRadius: 6, fontSize: 13, border: "1px solid rgba(155,74,74,0.4)", background: "rgba(155,74,74,0.1)", color: "var(--error)" }}>
                {error}
              </div>
            )}

            <section className="surface" style={{ display: "grid", gap: 16, padding: 20 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Información general</h2>
              <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                Nombre de la categoría *
                <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Playeras, Perfumes, Accesorios…" autoFocus required />
              </label>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 10 }}>Color identificador</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  {COLORES_PRESET.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Color ${c}`} style={{ width: 32, height: 32, borderRadius: 999, background: c, border: "none", cursor: "pointer", outline: color === c ? `3px solid ${c}` : "3px solid transparent", outlineOffset: 2, transform: color === c ? "scale(1.15)" : "scale(1)", transition: "all 150ms ease" }} />
                  ))}
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Color personalizado" title="Color personalizado" style={{ width: 32, height: 32, borderRadius: 999, border: "1px solid var(--border-subtle)", padding: 2, cursor: "pointer", background: "var(--surface-3)" }} />
                </div>
              </div>
            </section>

            <section className="surface" style={{ display: "grid", gap: 16, padding: 20 }}>
              <div>
                <h2 className="font-display" style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>Atributos base</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Cada atributo se convierte en un campo al crear productos de esta categoría.</p>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {atributos.map((atributo, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                    <input className="input" value={atributo} onChange={(e) => editarAtributo(i, e.target.value)} placeholder={`Atributo ${i + 1} — Ej. Talla`} aria-label={`Atributo ${i + 1}`} />
                    <button type="button" className="button" onClick={() => eliminarAtributo(i)} aria-label="Eliminar atributo" style={{ padding: "0 12px", color: "var(--text-secondary)" }}>
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="button" onClick={agregarAtributo} style={{ width: "fit-content", color: "var(--accent-gold)", borderColor: "rgba(201,168,76,0.3)" }}>
                <Plus size={15} aria-hidden="true" />
                Agregar atributo
              </button>
            </section>
          </div>

          <aside style={{ display: "grid", alignContent: "start", gap: 14 }}>
            <section className="surface elevated" style={{ padding: 20, display: "grid", gap: 14 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Vista previa</h2>
              <div className="surface" style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, flexShrink: 0, background: color, boxShadow: `0 0 12px ${color}` }} />
                  <span className="font-display" style={{ fontSize: 22, fontWeight: 500 }}>{nombre || "Nombre de categoría"}</span>
                </div>
                {atributosValidos.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {atributosValidos.map((a) => <span key={a} className="badge" style={{ fontSize: 11 }}>{a}: —</span>)}
                  </div>
                ) : (
                  <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-tertiary)" }}>Sin atributos definidos.</p>
                )}
              </div>
            </section>

            <button className="button button-primary" type="submit" disabled={guardando || !nombre.trim()} style={{ width: "100%", minHeight: 46, fontSize: 15 }}>
              <Save size={17} aria-hidden="true" />
              {guardando ? "Guardando…" : "Crear categoría"}
            </button>
          </aside>
        </form>
      </div>
    </>
  )
}
