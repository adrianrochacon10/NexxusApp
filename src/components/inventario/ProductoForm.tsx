"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save, Sparkles } from "lucide-react"
import { productoSchema, type ProductoInput } from "@/lib/validations/producto.schema"
import { VariantesEditor, type VarianteFormData } from "@/components/inventario/VariantesEditor"
import { crearProducto } from "@/actions/inventario"

type ProductoFormDefaults = Omit<Partial<ProductoInput>, "variantes">

export interface CategoriaOption {
  id:            string
  nombre:        string
  atributos_base: string[]
}

interface ProductoFormProps {
  defaultValues?: ProductoFormDefaults
  categorias:    CategoriaOption[]
}

function generarSku(categoriaId: string, categorias: { id: string; nombre: string }[]): string {
  const cat    = categorias.find((c) => c.id === categoriaId)
  const prefix = cat?.nombre.slice(0, 3).toUpperCase() ?? "PRD"
  const rand   = String(Math.floor(Math.random() * 900000) + 100000)
  return `${prefix}-${rand}`
}

export function ProductoForm({ defaultValues, categorias }: ProductoFormProps) {
  const [guardado,  setGuardado]  = useState(false)
  const [variantes, setVariantes] = useState<VarianteFormData[]>([])

  const categoriasProducto = categorias

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductoInput, unknown, ProductoInput>({
    resolver: zodResolver(productoSchema) as never,
    defaultValues: {
      nombre:      "",
      sku:         "",
      descripcion: "",
      categoriaId: categoriasProducto[0]?.id ?? "",
      precioVenta: 0,
      precioCosto: 0,
      stock:       0,
      stockMinimo: 5,
      estatus:     "disponible",
      imagenUrl:   "",
      atributos:   {},
      ...defaultValues,
    },
  })

  const categoriaId = watch("categoriaId")
  const precioVenta = watch("precioVenta")
  const precioCosto = watch("precioCosto")

  const categoriaActual = categoriasProducto.find((c) => c.id === categoriaId)
  const atributosBase   = categoriaActual?.atributos_base ?? []
  const tieneVariantes  = variantes.length > 0

  // Limpiar atributos al cambiar de categoría
  useEffect(() => {
    setValue("atributos", {})
    setVariantes([])
  }, [categoriaId, setValue])

  const margen = useMemo(() => {
    if (!precioVenta || precioVenta <= 0) return 0
    return Math.round(((precioVenta - (precioCosto ?? 0)) / precioVenta) * 100)
  }, [precioCosto, precioVenta])

  function autoSku() {
    setValue("sku", generarSku(categoriaId, categoriasProducto))
  }

  async function onSubmit(values: ProductoInput) {
    await crearProducto(values)
    setGuardado(true)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">

      {/* ── Columna principal ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gap: 14 }}>

        <section className="surface" style={{ display: "grid", gap: 16, padding: 20 }}>
          <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>
            Información general
          </h2>

          <Field label="Nombre del producto *" error={errors.nombre?.message}>
            <input className="input" {...register("nombre")} placeholder="Ej. Playera Básica Blanca" autoFocus />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Categoría *" error={errors.categoriaId?.message}>
              <select className="input" {...register("categoriaId")}>
                {categoriasProducto.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </Field>

            <Field label="SKU *" error={errors.sku?.message}>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  {...register("sku")}
                  placeholder="PLA-000001"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={autoSku}
                  title="Generar SKU automático"
                  aria-label="Generar SKU automático"
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--accent-gold)", display: "flex", alignItems: "center",
                  }}
                >
                  <Sparkles size={15} aria-hidden="true" />
                </button>
              </div>
            </Field>
          </div>

          <Field label="Descripción" error={errors.descripcion?.message}>
            <textarea
              className="input"
              {...register("descripcion")}
              rows={3}
              placeholder="Características relevantes del producto…"
              style={{ paddingTop: 10, resize: "vertical" }}
            />
          </Field>
        </section>

        {/* ── Atributos dinámicos ────────────────────────────────────── */}
        {atributosBase.length > 0 && (
          <section className="surface" style={{ display: "grid", gap: 16, padding: 20 }}>
            <div>
              <h2 className="font-display" style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>
                Atributos — {categoriaActual?.nombre}
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
                Campos específicos de esta categoría. Todos son opcionales.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {atributosBase.map((atributo: string) => (
                <Field key={atributo} label={atributo}>
                  <input
                    className="input"
                    {...register(`atributos.${atributo}`)}
                    placeholder={placeholderAtributo(atributo)}
                  />
                </Field>
              ))}
            </div>
          </section>
        )}

        {/* ── Variantes ──────────────────────────────────────────────── */}
        <section className="surface" style={{ display: "grid", gap: 16, padding: 20 }}>
          <div>
            <h2 className="font-display" style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 500 }}>
              Variantes
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
              Si el producto tiene tallas u opciones con stock independiente, agrégalas aquí.
              {tieneVariantes && " El stock del producto se calculará como suma de variantes."}
            </p>
          </div>
          <VariantesEditor variantes={variantes} onChange={setVariantes} />
        </section>

        {/* ── Precios ────────────────────────────────────────────────── */}
        <section className="surface" style={{ display: "grid", gap: 16, padding: 20 }}>
          <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Precios</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Precio de venta *" error={errors.precioVenta?.message}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", fontSize: 13 }}>$</span>
                <input className="input" type="number" step="0.01" min="0" {...register("precioVenta", { valueAsNumber: true })} style={{ paddingLeft: 24 }} />
              </div>
            </Field>
            <Field label="Precio de costo" error={errors.precioCosto?.message}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", fontSize: 13 }}>$</span>
                <input className="input" type="number" step="0.01" min="0" {...register("precioCosto", { valueAsNumber: true })} style={{ paddingLeft: 24 }} />
              </div>
            </Field>
          </div>
        </section>

        {/* ── Stock y estatus — solo si no hay variantes ─────────────── */}
        {!tieneVariantes && (
          <section className="surface" style={{ display: "grid", gap: 16, padding: 20 }}>
            <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Inventario</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <Field label="Stock inicial" error={errors.stock?.message}>
                <input className="input" type="number" min="0" {...register("stock", { valueAsNumber: true })} />
              </Field>
              <Field label="Stock mínimo" error={errors.stockMinimo?.message}>
                <input className="input" type="number" min="0" {...register("stockMinimo", { valueAsNumber: true })} />
              </Field>
              <Field label="Estatus" error={errors.estatus?.message}>
                <select className="input" {...register("estatus")}>
                  <option value="disponible">Disponible</option>
                  <option value="pausado">Pausado</option>
                  <option value="agotado">Agotado</option>
                </select>
              </Field>
            </div>
          </section>
        )}

      </div>

      {/* ── Columna lateral ───────────────────────────────────────────── */}
      <aside style={{ display: "grid", alignContent: "start", gap: 14 }}>

        <section className="surface elevated" style={{ display: "grid", gap: 14, padding: 20 }}>
          <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Imagen</h2>
          <div style={{
            aspectRatio: "1 / 1", border: "1px dashed var(--border-active)", borderRadius: 8,
            display: "grid", placeItems: "center", color: "var(--text-secondary)",
            textAlign: "center", padding: 20, fontSize: 13,
          }}>
            Sube una imagen<br />
            <span style={{ fontSize: 11, marginTop: 4, color: "var(--text-tertiary)" }}>PNG, JPG · máx. 2MB</span>
          </div>
          <Field label="URL pública" error={errors.imagenUrl?.message}>
            <input className="input" {...register("imagenUrl")} placeholder="https://…" />
          </Field>
        </section>

        <section className="surface elevated" style={{ padding: 20 }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Margen estimado</div>
          <div
            className="font-mono"
            style={{
              marginTop: 10, fontSize: 36,
              color: margen < 0 ? "var(--error)" : margen < 20 ? "var(--warning)" : "var(--accent-gold)",
            }}
          >
            {margen}%
          </div>
          {margen < 0 && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--error)" }}>El costo supera el precio de venta.</p>
          )}
          {margen > 0 && margen < 20 && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--warning)" }}>Margen bajo. Considera ajustar precios.</p>
          )}
        </section>

        <button
          className="button button-primary"
          type="submit"
          disabled={isSubmitting || guardado}
          style={{ width: "100%", minHeight: 46, fontSize: 15 }}
        >
          <Save size={17} aria-hidden="true" />
          {guardado ? "Guardado ✓" : isSubmitting ? "Guardando…" : "Guardar producto"}
        </button>

      </aside>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 7, color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>
      {label}
      {children}
      {error && <span style={{ color: "var(--error)", fontSize: 12, fontWeight: 400 }}>{error}</span>}
    </label>
  )
}

function placeholderAtributo(nombre: string): string {
  const map: Record<string, string> = {
    Talla: "S, M, L, XL…", Color: "Blanco, Negro, Gris…", Marca: "Nike, Nexxuz…",
    "Tipo de tela": "Algodón, Poliéster…", Mililitros: "100, 50, 200…",
    Aroma: "Amaderado, Floral…", Género: "Masculino, Femenino, Unisex",
  }
  return map[nombre] ?? ""
}
