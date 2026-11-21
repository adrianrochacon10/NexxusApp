"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, ChevronDown, Save, Trash2, Upload } from "lucide-react"
import { generarURLFirmaSubida } from "@/actions/imagenes"
import { productoSchema, type ProductoInput } from "@/lib/validations/producto.schema"
import { VariantesEditor, varianteVacia, type VarianteFormData } from "@/components/inventario/VariantesEditor"
import { cambiarEstatusProducto, crearProducto, actualizarProducto } from "@/actions/inventario"
import { EliminarProductoDialog } from "@/components/inventario/EliminarProductoDialog"
import { InventarioToastProvider, useInventarioToast } from "@/components/inventario/InventarioToast"
import { formatPct, margenPct } from "@/components/inventario/inventario-utils"
import { formatCurrency } from "@/lib/utils"

type ProductoFormDefaults = Omit<Partial<ProductoInput>, "variantes">

export interface CategoriaOption {
  id:             string
  nombre:         string
  color?:         string | null
  atributos_base: string[]
}

interface ProductoFormProps {
  defaultValues?:      ProductoFormDefaults
  categorias:          CategoriaOption[]
  categoriaFija?:      string
  productoId?:         string
  variantesIniciales?: VarianteFormData[]
  /** Encabezado */
  titulo?:             string
  migas?:              string
  cancelHref?:         string
}

const FORM_ID = "producto-form"
const MAX_BYTES = 4 * 1024 * 1024
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"]

function generarSku(categoriaId: string, categorias: { id: string; nombre: string }[]): string {
  const cat    = categorias.find((c) => c.id === categoriaId)
  const prefix = cat?.nombre.slice(0, 3).toUpperCase() ?? "PRD"
  const rand   = String(Math.floor(Math.random() * 900000) + 100000)
  return `${prefix}-${rand}`
}

function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toLocaleString("es-MX", { maximumFractionDigits: 1 })} MB`
}

export function ProductoForm(props: ProductoFormProps) {
  return (
    <InventarioToastProvider>
      <ProductoFormInner {...props} />
    </InventarioToastProvider>
  )
}

function ProductoFormInner({
  defaultValues, categorias, categoriaFija, productoId, variantesIniciales,
  titulo, migas, cancelHref,
}: ProductoFormProps) {
  const router = useRouter()
  const toast = useInventarioToast()
  const esEdicion = Boolean(productoId)
  const [guardado,      setGuardado]      = useState(false)
  const [variantes,     setVariantes]     = useState<VarianteFormData[]>(variantesIniciales ?? [])
  const [conVariantes,  setConVariantes]  = useState((variantesIniciales?.length ?? 0) > 0)
  const respaldoVariantes                 = useRef<VarianteFormData[]>([])
  const prevCategoriaId                   = useRef<string | undefined>(defaultValues?.categoriaId)
  const [intentado,     setIntentado]     = useState(false)
  const [errorServidor, setErrorServidor] = useState("")
  const [subiendo,      setSubiendo]      = useState<{ nombre: string; bytes: number } | null>(null)
  const [archivo,       setArchivo]       = useState<{ nombre: string; bytes: number } | null>(null)
  const [errorImagen,   setErrorImagen]   = useState<{ titulo: string; detalle: string } | null>(null)
  const [preview,       setPreview]       = useState<string | null>(null)
  const [arrastrando,   setArrastrando]   = useState(false)
  const [eliminarAbierto, setEliminarAbierto] = useState(false)
  const [pausando, startPausa] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const categoriasProducto = categorias
  const destinoCancelar = cancelHref ?? (productoId ? `/inventario/${productoId}` : "/inventario")

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
  const estatus     = watch("estatus")
  const stockSimple = watch("stock")
  const skuActual   = watch("sku")

  const categoriaActual = categoriasProducto.find((c) => c.id === categoriaId)
  const atributosBase   = categoriaActual?.atributos_base ?? []
  const stockTotal      = conVariantes
    ? variantes.reduce((s, v) => s + (Number(v.stock) || 0), 0)
    : (Number.isFinite(stockSimple) ? Number(stockSimple) : 0)

  // Preview inicial cuando se edita un producto con imagen existente
  useEffect(() => {
    if (defaultValues?.imagenUrl) setPreview(defaultValues.imagenUrl)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Limpiar atributos y variantes solo cuando el usuario realmente cambia de categoría
  useEffect(() => {
    if (prevCategoriaId.current === categoriaId) return
    prevCategoriaId.current = categoriaId
    setValue("atributos", {})
    setVariantes([])
    setConVariantes(false)
    respaldoVariantes.current = []
  }, [categoriaId, setValue])

  const margen = useMemo(
    () => margenPct(Number(precioVenta), Number(precioCosto ?? 0)),
    [precioCosto, precioVenta],
  )
  const tono = margen === null ? "idle" : margen < 0 ? "bad" : margen < 30 ? "warn" : "ok"
  const TONO = {
    idle: { badge: "is-off",  label: "Sin calcular" },
    bad:  { badge: "is-bad",  label: "Pérdida" },
    warn: { badge: "is-warn", label: "Margen bajo" },
    ok:   { badge: "is-ok",   label: "Margen sano" },
  }[tono]
  const costoSupera = margen !== null && Number(precioCosto) > Number(precioVenta)

  const variantesSinNombre = conVariantes ? variantes.filter((v) => !v.nombre.trim()).length : 0
  const faltanVariantes    = conVariantes && variantes.length === 0
  const totalErrores       = Object.keys(errors).length + variantesSinNombre + (faltanVariantes ? 1 : 0)

  const estado =
    estatus === "pausado"
      ? { cls: "is-off", label: "Pausado", hint: "No aparece en el POS." }
      : stockTotal === 0
        ? { cls: "is-bad", label: "Agotado", hint: "Se calcula solo: el stock total es 0." }
        : { cls: "is-ok", label: "Disponible", hint: "Se puede vender en el POS." }

  function autoSku() {
    setValue("sku", generarSku(categoriaId, categoriasProducto), { shouldValidate: intentado })
  }

  function alternarVariantes() {
    if (conVariantes) {
      respaldoVariantes.current = variantes
      setVariantes([])
      setConVariantes(false)
    } else {
      setVariantes(respaldoVariantes.current.length > 0 ? respaldoVariantes.current : [varianteVacia()])
      setConVariantes(true)
    }
  }

  async function subirArchivo(file: File) {
    if (!TIPOS_IMAGEN.includes(file.type)) {
      setErrorImagen({ titulo: "Formato no admitido", detalle: "Usa una imagen JPG, PNG o WebP." })
      return
    }
    if (file.size > MAX_BYTES) {
      setErrorImagen({ titulo: `La imagen pesa ${formatMB(file.size)}`, detalle: "El máximo es 4 MB. Elige otro archivo o redúcela." })
      return
    }
    setErrorImagen(null)
    setSubiendo({ nombre: file.name, bytes: file.size })
    try {
      const { signedUrl, publicUrl, configured } = await generarURLFirmaSubida({
        fileName:    file.name,
        contentType: file.type,
      })
      if (!configured || !signedUrl) {
        setErrorImagen({ titulo: "No se pudo subir la imagen", detalle: "El almacenamiento de imágenes (R2) no está configurado." })
        return
      }
      const res = await fetch(signedUrl, {
        method:  "PUT",
        body:    file,
        headers: { "Content-Type": file.type },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setValue("imagenUrl", publicUrl, { shouldDirty: true })
      setPreview(publicUrl)
      setArchivo({ nombre: file.name, bytes: file.size })
    } catch {
      setErrorImagen({ titulo: "Error al subir la imagen", detalle: "Revisa tu conexión e intenta de nuevo." })
    } finally {
      setSubiendo(null)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function quitarImagen() {
    setPreview(null)
    setArchivo(null)
    setValue("imagenUrl", "", { shouldDirty: true })
  }

  function pausarAhora() {
    if (!productoId) return
    startPausa(async () => {
      const res = await cambiarEstatusProducto(productoId, "pausado").catch(() => null)
      if (!res?.ok) {
        setErrorServidor(res?.error ?? "No se pudo pausar el producto.")
        return
      }
      setValue("estatus", "pausado")
      toast("Producto pausado: ya no aparece en el POS")
      router.refresh()
    })
  }

  async function onSubmit(values: ProductoInput) {
    if (variantesSinNombre > 0 || faltanVariantes) return
    setErrorServidor("")

    const vars = (conVariantes ? variantes : []).map((v) => ({
      id:          v.id,
      nombre:      v.nombre.trim(),
      sku:         v.sku || "",
      atributos:   v.atributos,
      stock:       v.stock,
      stockMinimo: v.stockMinimo,
    }))

    const res = await (productoId ? actualizarProducto(productoId, values, vars) : crearProducto(values, vars)).catch(() => null)
    if (!res?.ok) {
      setErrorServidor(res?.error ?? "No se pudo guardar el producto. Intenta de nuevo.")
      return
    }
    setGuardado(true)
    router.replace(`/inventario/${res.data.productoId}`)
  }

  const ocupado = isSubmitting || guardado
  const textoGuardar = guardado ? "Guardado" : isSubmitting ? "Guardando…" : "Guardar producto"

  // ── helpers de accesibilidad ──
  const err = (campo: keyof ProductoInput) => errors[campo]?.message as string | undefined
  const a11y = (id: string, campo: keyof ProductoInput, conHint = false) => ({
    id,
    "aria-invalid": Boolean(err(campo)),
    "aria-describedby": err(campo) ? `${id}-error` : conHint ? `${id}-hint` : undefined,
  })

  return (
    <>
      <header className="nx-pagehead">
        <div style={{ minWidth: 0 }}>
          <nav className="t-small inv-crumb" aria-label="Ruta">
            <Link href="/inventario" className="nx-link">Inventario</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{migas ?? (esEdicion ? "Editar" : "Nuevo producto")}</span>
          </nav>
          <h1 className="t-h1" style={{ marginTop: 2 }}>{titulo ?? (esEdicion ? "Editar producto" : "Nuevo producto")}</h1>
        </div>
        <div className="nx-pagehead-actions inv-form-head-actions">
          <Link href={destinoCancelar} className="nx-btn nx-btn-secondary">Cancelar</Link>
          <button type="submit" form={FORM_ID} className="nx-btn nx-btn-primary" disabled={ocupado}>
            {guardado ? <Check size={20} aria-hidden="true" /> : <Save size={20} aria-hidden="true" />}
            {textoGuardar}
          </button>
        </div>
      </header>

      <div className="page inv-form-page">
        <form
          id={FORM_ID}
          noValidate
          onSubmit={(e) => { setIntentado(true); return handleSubmit(onSubmit)(e) }}
          className="nx-col gap-20"
        >
          {intentado && totalErrores > 0 && (
            <div className="nx-alert is-bad" role="alert">
              <AlertCircle size={22} aria-hidden="true" style={{ flex: "none" }} />
              <div>
                <div className="ttl">Revisa {totalErrores} {totalErrores === 1 ? "campo" : "campos"} antes de guardar</div>
                <div className="txt">Los campos con error están marcados en rojo.</div>
              </div>
            </div>
          )}
          {errorServidor && (
            <div className="nx-alert is-bad" role="alert">
              <AlertCircle size={22} aria-hidden="true" style={{ flex: "none" }} />
              <div><div className="ttl">No se pudo guardar</div><div className="txt">{errorServidor}</div></div>
            </div>
          )}

          <div className="inv-form-grid">
            {/* ── Columna principal ── */}
            <div className="nx-col gap-16">

              <section className="nx-card nx-col gap-20 inv-form-card" style={{ padding: 24 }} aria-labelledby="h-info">
                <h2 className="t-h2" id="h-info">Información</h2>

                <Field id="p-nombre" label="Nombre" required error={err("nombre")}>
                  <input
                    className={`nx-input ${err("nombre") ? "is-error" : ""}`}
                    {...register("nombre")}
                    {...a11y("p-nombre", "nombre")}
                    placeholder="Ej. Blusa de lino blanca"
                    autoFocus={!esEdicion}
                  />
                </Field>

                <Field id="p-sku" label="SKU" required error={err("sku")} hint="Código único del producto. “Sugerir” genera uno a partir de la categoría.">
                  <div className="nx-row gap-8">
                    <input
                      className={`nx-input nx-mono ${err("sku") ? "is-error" : ""}`}
                      style={{ fontSize: 15 }}
                      {...register("sku")}
                      {...a11y("p-sku", "sku", true)}
                      placeholder="BLU-000001"
                      autoCapitalize="characters"
                    />
                    <button type="button" className="nx-btn nx-btn-secondary inv-sku-btn" onClick={autoSku}>Sugerir</button>
                  </div>
                </Field>

                <Field id="p-desc" label="Descripción" error={err("descripcion")}>
                  <textarea
                    className={`nx-input ${err("descripcion") ? "is-error" : ""}`}
                    {...register("descripcion")}
                    {...a11y("p-desc", "descripcion")}
                    rows={3}
                    placeholder="Material, corte, cuidados…"
                  />
                </Field>

                <Field id="p-cat" label="Categoría" required error={err("categoriaId")}>
                  {categoriaFija ? (
                    <>
                      <input type="hidden" {...register("categoriaId")} />
                      <div id="p-cat" className="nx-input nx-row gap-8" style={{ background: "var(--nx-surface-2)", cursor: "default" }}>
                        <span className="nx-catdot" style={{ background: categoriaActual?.color ?? "var(--nx-accent)" }} aria-hidden="true" />
                        {categoriaActual?.nombre}
                      </div>
                    </>
                  ) : (
                    <div className="nx-select-wrap">
                      <select className={`nx-input ${err("categoriaId") ? "is-error" : ""}`} {...register("categoriaId")} {...a11y("p-cat", "categoriaId")}>
                        {categoriasProducto.length === 0 && <option value="">Elige una categoría</option>}
                        {categoriasProducto.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                      <span className="chev"><ChevronDown size={20} aria-hidden="true" /></span>
                    </div>
                  )}
                </Field>

                {atributosBase.length > 0 && (
                  <div className="nx-col gap-12">
                    <div className="nx-row gap-8" style={{ flexWrap: "wrap" }}>
                      <span className="t-small">Atributos de {categoriaActual?.nombre}:</span>
                      {atributosBase.map((a) => <span key={a} className="nx-attr">{a}</span>)}
                    </div>
                    <div className="inv-grid-2 inv-stack-m">
                      {atributosBase.map((atributo, i) => (
                        <Field key={atributo} id={`p-attr-${i}`} label={atributo}>
                          <input
                            id={`p-attr-${i}`}
                            className="nx-input"
                            {...register(`atributos.${atributo}`)}
                            placeholder={placeholderAtributo(atributo)}
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="nx-card nx-col gap-16 inv-form-card" style={{ padding: 24 }} aria-labelledby="h-precio">
                <h2 className="t-h2" id="h-precio">Precio y margen</h2>
                <div className="inv-grid-2">
                  <Field id="p-precio" label="Precio de venta" required error={err("precioVenta")}>
                    <div className="nx-affix">
                      <span className="pre" aria-hidden="true">$</span>
                      <input
                        className={`nx-input has-pre has-suf nx-num ${err("precioVenta") ? "is-error" : ""}`}
                        type="number" step="0.01" min="0" inputMode="decimal"
                        {...register("precioVenta", { valueAsNumber: true })}
                        {...a11y("p-precio", "precioVenta")}
                        placeholder="0.00"
                      />
                      <span className="suf" aria-hidden="true">MXN</span>
                    </div>
                  </Field>
                  <Field id="p-costo" label="Costo" error={err("precioCosto")}>
                    <div className="nx-affix">
                      <span className="pre" aria-hidden="true">$</span>
                      <input
                        className={`nx-input has-pre has-suf nx-num ${err("precioCosto") ? "is-error" : ""}`}
                        type="number" step="0.01" min="0" inputMode="decimal"
                        {...register("precioCosto", { valueAsNumber: true })}
                        {...a11y("p-costo", "precioCosto")}
                        placeholder="0.00"
                      />
                      <span className="suf" aria-hidden="true">MXN</span>
                    </div>
                  </Field>
                </div>
                <div className={`inv-margin is-${tono}`} aria-live="polite">
                  <div className="grow">
                    <div className="t-small">Margen</div>
                    <div className="inv-margin-val">{formatPct(margen)}</div>
                  </div>
                  <div className="grow">
                    <div className="t-small">Ganancia por pieza</div>
                    <div className="inv-margin-profit">{margen === null ? "—" : formatCurrency(Number(precioVenta) - Number(precioCosto || 0))}</div>
                  </div>
                  <span className={`nx-badge ${TONO.badge} inv-only-desktop`}>{TONO.label}</span>
                </div>
                {costoSupera && (
                  <span className="nx-error"><AlertCircle size={16} aria-hidden="true" />El costo supera el precio: venderías con pérdida.</span>
                )}
              </section>

              <section className="nx-card nx-col gap-16 inv-form-card" style={{ padding: 24 }} aria-labelledby="h-stock">
                <div className="nx-row gap-12">
                  <h2 className="t-h2 grow" id="h-stock">Variantes y stock</h2>
                  <div className="nx-num" style={{ textAlign: "right" }}>
                    <div className="t-small">Stock total</div>
                    <div className="t-h2">{stockTotal} <span className="t-small">uds</span></div>
                  </div>
                </div>

                <button type="button" className="nx-switchrow" role="switch" aria-checked={conVariantes} onClick={alternarVariantes}>
                  <span className="sw" aria-hidden="true" />
                  <span>
                    <span className="t-h3" style={{ display: "block" }}>Este producto tiene variantes</span>
                    <span className="t-small" style={{ display: "block" }}>Tallas o colores con stock, SKU y mínimo propios. El stock total es la suma.</span>
                  </span>
                </button>

                {conVariantes ? (
                  <>
                    <VariantesEditor variantes={variantes} onChange={setVariantes} skuBase={skuActual} intentado={intentado} />
                    {intentado && faltanVariantes && (
                      <span className="nx-error" role="alert"><AlertCircle size={16} aria-hidden="true" />Agrega al menos una variante o desactiva la opción.</span>
                    )}
                  </>
                ) : (
                  <div className="inv-grid-2">
                    <Field
                      id="p-stock"
                      label={esEdicion ? "Stock actual" : "Stock inicial"}
                      required={!esEdicion}
                      error={err("stock")}
                      hint={esEdicion ? "Para cambiarlo registra una entrada, salida o ajuste desde la ficha del producto." : undefined}
                    >
                      <input
                        className={`nx-input nx-num ${err("stock") ? "is-error" : ""}`}
                        type="number" min="0" inputMode="numeric"
                        readOnly={esEdicion}
                        {...register("stock", { valueAsNumber: true })}
                        {...a11y("p-stock", "stock", esEdicion)}
                        placeholder="0"
                      />
                    </Field>
                    <Field id="p-min" label="Stock mínimo" error={err("stockMinimo")} hint="Avisa cuando llegues a esta cantidad.">
                      <input
                        className={`nx-input nx-num ${err("stockMinimo") ? "is-error" : ""}`}
                        type="number" min="0" inputMode="numeric"
                        {...register("stockMinimo", { valueAsNumber: true })}
                        {...a11y("p-min", "stockMinimo", true)}
                        placeholder="3"
                      />
                    </Field>
                  </div>
                )}
              </section>
            </div>

            {/* ── Columna lateral ── */}
            <div className="nx-col gap-16">
              <section className="nx-card nx-col gap-12 inv-form-card" style={{ padding: 20 }} aria-labelledby="h-imagen">
                <h2 className="t-h2" id="h-imagen">Imagen</h2>
                <input
                  ref={fileRef}
                  id="imagen-upload"
                  type="file"
                  accept={TIPOS_IMAGEN.join(",")}
                  className="inv-drop-input"
                  tabIndex={-1}
                  aria-hidden="true"
                  disabled={Boolean(subiendo)}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void subirArchivo(f) }}
                />

                {subiendo ? (
                  <div className="nx-drop" style={{ cursor: "default", gap: 10 }} aria-live="polite">
                    <div className="nx-row gap-12" style={{ width: "100%" }}>
                      <div className="nx-thumb" style={{ width: 48, height: 48 }}><div className="nx-skel" style={{ width: "100%", height: "100%", borderRadius: 0 }} /></div>
                      <div className="grow" style={{ textAlign: "left" }}>
                        <div className="t-h3" style={{ wordBreak: "break-all" }}>{subiendo.nombre}</div>
                        <div className="t-small">{formatMB(subiendo.bytes)} · subiendo…</div>
                      </div>
                    </div>
                    <div className="nx-skel" style={{ width: "100%", height: 8, borderRadius: 999 }} aria-hidden="true" />
                  </div>
                ) : preview ? (
                  <div className="nx-col gap-12">
                    <div className="inv-preview">
                      <Image src={preview} alt="Vista previa de la foto del producto" fill sizes="340px" style={{ objectFit: "cover" }} />
                    </div>
                    {archivo && <div className="t-small nx-num">{archivo.nombre} · {formatMB(archivo.bytes)}</div>}
                    <div className="nx-row gap-8">
                      <button type="button" className="nx-btn nx-btn-secondary grow" onClick={() => fileRef.current?.click()}>Cambiar</button>
                      <button type="button" className="nx-btn nx-btn-ghost" onClick={quitarImagen}>Quitar</button>
                    </div>
                    {errorImagen && (
                      <span className="nx-error" role="alert"><AlertCircle size={16} aria-hidden="true" />{errorImagen.titulo}. {errorImagen.detalle}</span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`nx-drop ${errorImagen ? "is-error" : ""} ${arrastrando ? "is-drag" : ""}`}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
                    onDragLeave={() => setArrastrando(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setArrastrando(false)
                      const f = e.dataTransfer.files?.[0]
                      if (f) void subirArchivo(f)
                    }}
                    aria-describedby="imagen-hint"
                  >
                    {errorImagen ? (
                      <>
                        <AlertCircle size={32} strokeWidth={1.8} color="var(--nx-bad)" aria-hidden="true" />
                        <span className="t-h3" style={{ color: "var(--nx-bad-fg)" }} role="alert">{errorImagen.titulo}</span>
                        <span className="t-small" style={{ color: "var(--nx-bad-fg)" }}>{errorImagen.detalle}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={32} strokeWidth={1.8} aria-hidden="true" />
                        <span className="t-h3">Sube una foto</span>
                        <span className="t-small">Arrástrala aquí o elige un archivo</span>
                        <span className="t-small">JPG, PNG o WebP · máx. 4 MB</span>
                      </>
                    )}
                  </button>
                )}
                <span className="nx-hint" id="imagen-hint">Se recorta cuadrada en el POS y el inventario. Sin foto se usan las iniciales.</span>
                <input type="hidden" {...register("imagenUrl")} />
                {err("imagenUrl") && <span className="nx-error"><AlertCircle size={16} aria-hidden="true" />{err("imagenUrl")}</span>}
              </section>

              <section className="nx-card nx-col gap-12 inv-form-card" style={{ padding: 20 }} aria-labelledby="h-estatus-form">
                <h2 className="t-h2" id="h-estatus-form">Estatus</h2>
                <div className="nx-seg" role="group" aria-label="Estatus">
                  <button type="button" className={estatus === "disponible" ? "is-on" : ""} aria-pressed={estatus === "disponible"} onClick={() => setValue("estatus", "disponible", { shouldDirty: true })}>Disponible</button>
                  <button type="button" className={estatus === "pausado" ? "is-on" : ""} aria-pressed={estatus === "pausado"} onClick={() => setValue("estatus", "pausado", { shouldDirty: true })}>Pausado</button>
                </div>
                <div className="nx-row gap-8" style={{ flexWrap: "wrap" }}>
                  <span className={`nx-badge ${estado.cls}`}>{estado.label}</span>
                  <span className="t-small">{estado.hint}</span>
                </div>
              </section>

              {esEdicion && (
                <section className="nx-card nx-col gap-12 inv-form-card" style={{ padding: 20, borderColor: "var(--nx-bad-line)" }} aria-labelledby="h-zona-form">
                  <h2 className="t-h2" id="h-zona-form">Zona delicada</h2>
                  {estatus !== "pausado" && (
                    <button type="button" className="nx-btn nx-btn-secondary nx-btn-block" onClick={pausarAhora} disabled={pausando}>
                      {pausando ? "Pausando…" : "Pausar producto"}
                    </button>
                  )}
                  <button type="button" className="nx-btn nx-btn-danger-soft nx-btn-block" onClick={() => setEliminarAbierto(true)}>
                    <Trash2 size={18} aria-hidden="true" />
                    Eliminar producto
                  </button>
                  <span className="nx-hint">Eliminar borra también su historial de movimientos.</span>
                </section>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Barra fija de guardar (móvil) */}
      <div className="inv-savebar">
        <Link href={destinoCancelar} className="nx-btn nx-btn-secondary">Cancelar</Link>
        <button type="submit" form={FORM_ID} className="nx-btn nx-btn-primary nx-btn-lg grow" disabled={ocupado}>
          {textoGuardar}
        </button>
      </div>

      {eliminarAbierto && productoId && (
        <EliminarProductoDialog
          producto={{ id: productoId, nombre: watch("nombre") || "este producto", estatus: estatus }}
          onClose={() => setEliminarAbierto(false)}
          onDone={toast}
        />
      )}
    </>
  )
}

function Field({ id, label, required = false, error, hint, children }: {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="nx-field">
      <label className="nx-label" htmlFor={id}>{label}{required && <i aria-hidden="true">*</i>}</label>
      {children}
      {error ? (
        <span className="nx-error" id={`${id}-error`}><AlertCircle size={16} aria-hidden="true" />{error}</span>
      ) : hint ? (
        <span className="nx-hint" id={`${id}-hint`}>{hint}</span>
      ) : null}
    </div>
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
