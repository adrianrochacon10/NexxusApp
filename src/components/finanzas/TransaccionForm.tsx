"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, CircleAlert } from "lucide-react"
import { registrarTransaccion, actualizarTransaccion } from "@/actions/finanzas"
import { transaccionSchema, type TransaccionInput } from "@/lib/validations/transaccion.schema"
import { hoyMX } from "@/components/finanzas/finanzas-utils"
import { exigirOk } from "@/lib/action-result"

export interface CategoriaOpt { id: string; nombre: string; tipo: string }
export interface ProductoOpt   { id: string; nombre: string }

interface Props {
  categorias:      CategoriaOpt[]
  productos:       ProductoOpt[]
  transaccionId?:  string
  defaultValues?:  TransaccionInput
}

type Tipo = TransaccionInput["tipo"]

const TIPOS: { id: Tipo; label: string }[] = [
  { id: "ingreso",       label: "Ingreso" },
  { id: "gasto",         label: "Egreso" },
  { id: "transferencia", label: "Transferencia" },
]

/** Categorías válidas para un tipo; si no hay de ese tipo, se ofrecen todas. */
function categoriasPara(tipo: Tipo, todas: CategoriaOpt[]) {
  if (tipo === "transferencia") return todas
  const propias = todas.filter((c) => c.tipo === tipo)
  return propias.length ? propias : todas
}

export function TransaccionForm({ categorias, productos, transaccionId, defaultValues }: Props) {
  const router = useRouter()
  const catsFiltradas = categorias.filter((c) => c.tipo !== "producto")
  const [errorEnvio, setErrorEnvio] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TransaccionInput>({
    resolver: zodResolver(transaccionSchema),
    defaultValues: defaultValues ?? {
      fecha:       hoyMX(),
      concepto:    "",
      categoriaId: categoriasPara("gasto", catsFiltradas)[0]?.id ?? "",
      cantidad:    1,
      formaPago:   "efectivo",
      monto:       undefined as unknown as number,
      tipo:        "gasto",
      productoId:  "",
      notas:       "",
    },
  })

  const tipo = watch("tipo")
  const opciones = categoriasPara(tipo, catsFiltradas)
  // Al editar, conserva la categoría guardada aunque sea de otro tipo
  const guardada = defaultValues?.categoriaId ? catsFiltradas.find((c) => c.id === defaultValues.categoriaId) : undefined
  if (guardada && !opciones.some((c) => c.id === guardada.id)) opciones.push(guardada)

  // Al cambiar de tipo, si la categoría elegida ya no aplica, toma la primera válida
  // (no en el primer render: al editar se respeta la categoría guardada)
  const montado = useRef(false)
  useEffect(() => {
    if (!montado.current) { montado.current = true; return }
    const actual = getValues("categoriaId")
    if (!opciones.some((c) => c.id === actual)) {
      setValue("categoriaId", opciones[0]?.id ?? "", { shouldValidate: false })
    }
  }, [tipo]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: TransaccionInput) {
    setErrorEnvio("")
    try {
      exigirOk(await (transaccionId ? actualizarTransaccion(transaccionId, values) : registrarTransaccion(values)))
      router.push("/finanzas")
      router.refresh()
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : "No se pudo guardar el movimiento.")
    }
  }

  const etiquetaCuenta = tipo === "ingreso" ? "Entra a" : tipo === "gasto" ? "Sale de" : "Forma de pago"
  const pista = tipo === "transferencia"
    ? "Mover dinero entre cuentas no cuenta como ingreso ni egreso."
    : "Las ventas y abonos se registran solos; aquí captura el resto."

  return (
    <form className="nx-card fz-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="fz-form-body">
        <input type="hidden" {...register("tipo")} />
        <div className="nx-field">
          <span className="nx-label" id="fz-tipo-l">Tipo de movimiento</span>
          <div className="nx-seg" role="group" aria-labelledby="fz-tipo-l">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tipo === t.id ? "is-on" : undefined}
                aria-pressed={tipo === t.id}
                onClick={() => setValue("tipo", t.id, { shouldDirty: true })}
              >
                {t.label}
              </button>
            ))}
          </div>
          <FieldError id="fz-tipo-e" error={errors.tipo?.message} />
        </div>

        <Field id="fz-monto" label="Monto" required error={errors.monto?.message}>
          <div className="nx-affix">
            <span className="pre" aria-hidden="true">$</span>
            <input
              id="fz-monto"
              className={`nx-input has-pre nx-num${errors.monto ? " is-error" : ""}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              aria-invalid={errors.monto ? true : undefined}
              aria-describedby={errors.monto ? "fz-monto-e" : undefined}
              {...register("monto", { setValueAs: (v) => (v === "" || v == null ? 0 : Number(v)) })}
            />
          </div>
        </Field>

        <Field id="fz-cat" label="Categoría" required error={errors.categoriaId?.message}>
          <Select id="fz-cat" invalid={!!errors.categoriaId} {...register("categoriaId")}>
            {opciones.length === 0 && <option value="">Sin categorías disponibles</option>}
            {opciones.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
        </Field>

        <Field id="fz-concepto" label="Concepto" required error={errors.concepto?.message}>
          <input
            id="fz-concepto"
            className={`nx-input${errors.concepto ? " is-error" : ""}`}
            placeholder="Ej. Pago de luz"
            autoComplete="off"
            aria-invalid={errors.concepto ? true : undefined}
            aria-describedby={errors.concepto ? "fz-concepto-e" : undefined}
            {...register("concepto")}
          />
        </Field>

        <div className="fz-form-grid">
          <Field id="fz-forma" label={etiquetaCuenta} error={errors.formaPago?.message}>
            <Select id="fz-forma" invalid={!!errors.formaPago} {...register("formaPago")}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="adeudo">Adeudo</option>
            </Select>
          </Field>
          <Field id="fz-fecha" label="Fecha" required error={errors.fecha?.message}>
            <input
              id="fz-fecha"
              className={`nx-input${errors.fecha ? " is-error" : ""}`}
              type="date"
              aria-invalid={errors.fecha ? true : undefined}
              aria-describedby={errors.fecha ? "fz-fecha-e" : undefined}
              {...register("fecha")}
            />
          </Field>
        </div>

        <div className="fz-form-grid">
          <Field id="fz-cantidad" label="Cantidad" error={errors.cantidad?.message}>
            <input
              id="fz-cantidad"
              className={`nx-input nx-num${errors.cantidad ? " is-error" : ""}`}
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              aria-invalid={errors.cantidad ? true : undefined}
              aria-describedby={errors.cantidad ? "fz-cantidad-e" : undefined}
              {...register("cantidad", { valueAsNumber: true })}
            />
          </Field>
          <Field id="fz-producto" label="Producto asociado" hint="Opcional" error={errors.productoId?.message}>
            <Select id="fz-producto" invalid={!!errors.productoId} {...register("productoId")}>
              <option value="">Sin producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field id="fz-notas" label="Notas" hint="Opcional" error={errors.notas?.message}>
          <textarea
            id="fz-notas"
            className={`nx-input fz-textarea${errors.notas ? " is-error" : ""}`}
            rows={3}
            aria-invalid={errors.notas ? true : undefined}
            aria-describedby={errors.notas ? "fz-notas-e" : undefined}
            {...register("notas")}
          />
        </Field>

        <span className="nx-hint">{pista}</span>

        {errorEnvio && (
          <div className="nx-alert is-bad" role="alert">
            <CircleAlert size={20} aria-hidden="true" style={{ flex: "none" }} />
            <div>
              <div className="ttl">No se pudo guardar</div>
              <div className="txt">{errorEnvio}</div>
            </div>
          </div>
        )}
      </div>

      <div className="fz-form-foot">
        <Link href="/finanzas" className="nx-btn nx-btn-secondary">Cancelar</Link>
        <button className="nx-btn nx-btn-primary fz-form-submit" type="submit" disabled={isSubmitting}>
          {transaccionId
            ? isSubmitting ? "Guardando…" : "Guardar cambios"
            : isSubmitting ? "Guardando…" : "Guardar movimiento"}
        </button>
      </div>
    </form>
  )
}

function Field({ id, label, required, hint, error, children }: {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="nx-field">
      <label className="nx-label" htmlFor={id}>
        {label}
        {required && <i aria-hidden="true">*</i>}
        {hint && <span className="nx-hint" style={{ fontWeight: 400, marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
      <FieldError id={`${id}-e`} error={error} />
    </div>
  )
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <span className="nx-error" id={id}>
      <CircleAlert size={16} aria-hidden="true" />
      {error}
    </span>
  )
}

function Select({ invalid, children, ...props }: React.ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <div className="nx-select-wrap">
      <select
        className={`nx-input${invalid ? " is-error" : ""}`}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={invalid && props.id ? `${props.id}-e` : undefined}
        {...props}
      >
        {children}
      </select>
      <span className="chev" aria-hidden="true"><ChevronDown size={20} /></span>
    </div>
  )
}
