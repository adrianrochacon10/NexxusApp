"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Landmark } from "lucide-react"
import { registrarTransaccion } from "@/actions/finanzas"
import { transaccionSchema, type TransaccionInput } from "@/lib/validations/transaccion.schema"

export interface CategoriaOpt { id: string; nombre: string; tipo: string }
export interface ProductoOpt   { id: string; nombre: string }

interface Props {
  categorias: CategoriaOpt[]
  productos:  ProductoOpt[]
}

export function TransaccionForm({ categorias, productos }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransaccionInput>({
    resolver: zodResolver(transaccionSchema),
    defaultValues: {
      fecha:       new Date().toISOString().slice(0, 10),
      concepto:    "",
      categoriaId: categorias.find((c) => c.tipo !== "producto")?.id ?? "",
      cantidad:    1,
      formaPago:   "transferencia",
      monto:       0,
      tipo:        "gasto",
      productoId:  "",
      notas:       "",
    },
  })

  async function onSubmit(values: TransaccionInput) {
    await registrarTransaccion(values)
  }

  const catsFiltradas = categorias.filter((c) => c.tipo !== "producto")

  return (
    <form className="surface" onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: 16, padding: 18, maxWidth: 820 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
        <Field label="Tipo" error={errors.tipo?.message}>
          <select className="input" {...register("tipo")}>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </Field>
        <Field label="Concepto" error={errors.concepto?.message}>
          <input className="input" {...register("concepto")} placeholder="Ej. Compra de inventario" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Field label="Fecha" error={errors.fecha?.message}>
          <input className="input" type="date" {...register("fecha")} />
        </Field>
        <Field label="Categoría" error={errors.categoriaId?.message}>
          <select className="input" {...register("categoriaId")}>
            {catsFiltradas.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Field>
        <Field label="Forma de pago" error={errors.formaPago?.message}>
          <select className="input" {...register("formaPago")}>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="adeudo">Adeudo</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 14 }}>
        <Field label="Cantidad" error={errors.cantidad?.message}>
          <input className="input" type="number" {...register("cantidad", { valueAsNumber: true })} />
        </Field>
        <Field label="Monto" error={errors.monto?.message}>
          <input className="input" type="number" step="0.01" {...register("monto", { valueAsNumber: true })} />
        </Field>
        <Field label="Producto asociado (opcional)" error={errors.productoId?.message}>
          <select className="input" {...register("productoId")}>
            <option value="">Sin producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notas" error={errors.notas?.message}>
        <textarea className="input" rows={3} {...register("notas")} style={{ paddingTop: 10 }} />
      </Field>
      <button className="button button-primary" type="submit" disabled={isSubmitting}>
        <Landmark size={17} aria-hidden="true" />
        {isSubmitting ? "Registrando…" : "Registrar transacción"}
      </button>
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
