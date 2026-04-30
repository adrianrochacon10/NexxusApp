"use client"

import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { productoSchema, type ProductoInput } from "@/lib/validations/producto.schema"
import { crearProducto } from "@/actions/inventario"
import { categorias } from "@/lib/demo-data"

interface ProductoFormProps {
  defaultValues?: Partial<ProductoInput>
}

export function ProductoForm({ defaultValues }: ProductoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: "",
      sku: "NX-AUTO",
      descripcion: "",
      categoriaId: "cat-1",
      precioVenta: 0,
      precioCosto: 0,
      stock: 0,
      stockMinimo: 5,
      estatus: "disponible",
      imagenUrl: "",
      ...defaultValues,
    },
  })

  const precioVenta = watch("precioVenta")
  const precioCosto = watch("precioCosto")
  const margen = useMemo(() => {
    if (!precioVenta || precioVenta <= 0) return 0
    return Math.round(((precioVenta - (precioCosto ?? 0)) / precioVenta) * 100)
  }, [precioCosto, precioVenta])

  async function onSubmit(values: ProductoInput) {
    await crearProducto(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
      <section className="surface" style={{ display: "grid", gap: 16, padding: 18 }}>
        <Field label="Nombre" error={errors.nombre?.message}>
          <input className="input" {...register("nombre")} placeholder="Eau Noir 50ml" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="SKU" error={errors.sku?.message}>
            <input className="input" {...register("sku")} />
          </Field>
          <Field label="Categoria" error={errors.categoriaId?.message}>
            <select className="input" {...register("categoriaId")}>
              {categorias.filter((categoria) => categoria.tipo === "producto").map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Descripcion" error={errors.descripcion?.message}>
          <textarea className="input" {...register("descripcion")} rows={4} style={{ paddingTop: 10 }} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Precio venta" error={errors.precioVenta?.message}>
            <input className="input" type="number" step="0.01" {...register("precioVenta", { valueAsNumber: true })} />
          </Field>
          <Field label="Precio costo" error={errors.precioCosto?.message}>
            <input className="input" type="number" step="0.01" {...register("precioCosto", { valueAsNumber: true })} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <Field label="Stock inicial" error={errors.stock?.message}>
            <input className="input" type="number" {...register("stock", { valueAsNumber: true })} />
          </Field>
          <Field label="Stock minimo" error={errors.stockMinimo?.message}>
            <input className="input" type="number" {...register("stockMinimo", { valueAsNumber: true })} />
          </Field>
          <Field label="Estatus" error={errors.estatus?.message}>
            <select className="input" {...register("estatus")}>
              <option value="disponible">Disponible</option>
              <option value="pausado">Pausado</option>
              <option value="agotado">Agotado</option>
            </select>
          </Field>
        </div>
        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          <Save size={17} aria-hidden="true" />
          Guardar producto
        </button>
      </section>
      <aside className="surface elevated" style={{ display: "grid", alignContent: "start", gap: 14, padding: 18 }}>
        <div style={{ aspectRatio: "1 / 1", border: "1px dashed var(--border-active)", borderRadius: 8, display: "grid", placeItems: "center", color: "var(--text-secondary)", textAlign: "center", padding: 20 }}>
          Upload R2 listo para conectar
        </div>
        <Field label="URL publica de imagen" error={errors.imagenUrl?.message}>
          <input className="input" {...register("imagenUrl")} placeholder="https://pub-xxxx.r2.dev/producto.webp" />
        </Field>
        <div className="surface" style={{ padding: 14 }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>Margen estimado</div>
          <div className="font-mono" style={{ marginTop: 8, fontSize: 30, color: "var(--accent-gold)" }}>{margen}%</div>
        </div>
      </aside>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 7, color: "var(--text-secondary)", fontSize: 13 }}>
      {label}
      {children}
      {error && <span style={{ color: "var(--error)", fontSize: 12 }}>{error}</span>}
    </label>
  )
}
