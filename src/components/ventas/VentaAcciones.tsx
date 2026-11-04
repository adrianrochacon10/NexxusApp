"use client"

import { useCallback, useId, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Ban, Check, ChevronDown, Plus, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { registrarAbono, cancelarVenta } from "@/actions/ventas"
import { exigirOk } from "@/lib/action-result"
import { useOverlay } from "@/components/ventas/historial/useOverlay"
import { VentaToast, type ToastData } from "@/components/ventas/historial/VentaToast"
import {
  type FormaPagoAbono,
  type VentaVM,
  admiteAbono,
  clienteTexto,
  fechaRelativa,
  horaCorta,
  hoyISO,
  productosTexto,
} from "@/components/ventas/historial/venta-data"

const FORMAS_PAGO_ABONO: { value: FormaPagoAbono; label: string }[] = [
  { value: "efectivo",      label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta",       label: "Tarjeta" },
]

function mensajeError(err: unknown, fallback: string) {
  if (err instanceof Error && err.message && !err.message.includes("NEXT_")) return err.message
  return fallback
}

/* ============================================================
   Registrar abono
   ============================================================ */

export type AbonoTarget = Pick<VentaVM, "id" | "folio" | "cliente" | "total" | "montoPagado" | "saldo">

export interface AbonoResultado {
  monto: number
  saldoRestante: number
  liquidada: boolean
}

export function abonoToast(venta: AbonoTarget, r: AbonoResultado): ToastData {
  return r.liquidada
    ? { title: `${venta.folio} liquidada`, text: "La venta pasó a Pagada." }
    : { title: "Abono registrado", text: `Saldo pendiente de ${clienteTexto(venta)}: ${formatCurrency(r.saldoRestante)}` }
}

function parseMonto(valor: string) {
  const n = parseFloat(valor.replace(/[$,\s]/g, ""))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

export function AbonoDialog({
  venta,
  onClose,
  onSuccess,
}: {
  venta: AbonoTarget
  onClose: () => void
  onSuccess: (r: AbonoResultado) => void
}) {
  const router = useRouter()
  const uid = useId()
  const [monto, setMonto] = useState("")
  const [forma, setForma] = useState<FormaPagoAbono>("efectivo")
  const [guardando, setGuardando] = useState(false)
  const [errorServidor, setErrorServidor] = useState("")
  // Una llave por diálogo: si se reintenta tras un error de red no se cobra dos veces
  const [llaveAbono] = useState(() => crypto.randomUUID())
  const close = useCallback(() => { if (!guardando) onClose() }, [guardando, onClose])
  const inputRef = useOverlay<HTMLInputElement>(close)

  const saldo = Math.max(0, venta.saldo)
  const valor = parseMonto(monto)
  let error = ""
  let hint = ""
  if (monto.trim() === "") hint = "Escribe cuánto abona el cliente."
  else if (Number.isNaN(valor) || valor <= 0) error = "Escribe un monto mayor a $0.00."
  else if (valor > saldo + 0.004) error = `El abono (${formatCurrency(valor)}) supera el saldo pendiente. Máximo: ${formatCurrency(saldo)}.`
  else hint = saldo - valor < 0.005
    ? "El saldo quedará en $0.00 y la venta pasará a Pagada."
    : `Saldo restante después del abono: ${formatCurrency(saldo - valor)}.`

  const bloqueado = guardando || monto.trim() === "" || !!error

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (bloqueado) return
    setGuardando(true)
    setErrorServidor("")
    try {
      // El servidor vuelve a validar el monto contra el saldo real
      exigirOk(await registrarAbono({ ventaId: venta.id, monto: valor, formaPago: forma, idempotencyKey: llaveAbono }))
      const restante = Math.max(0, Math.round((saldo - valor) * 100) / 100)
      onSuccess({ monto: valor, saldoRestante: restante, liquidada: restante < 0.005 })
      router.refresh()
    } catch (err) {
      setErrorServidor(mensajeError(err, "No se pudo registrar el abono. Intenta de nuevo."))
      setGuardando(false)
    }
  }

  const ids = { title: `${uid}-t`, monto: `${uid}-m`, msg: `${uid}-msg`, forma: `${uid}-f` }

  return (
    <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <form className="nx-modal vx-modal" role="dialog" aria-modal="true" aria-labelledby={ids.title} style={{ maxWidth: 420 }} onSubmit={handleSubmit} noValidate>
        <div className="vx-grab" aria-hidden="true" />
        <div className="nx-modal-head">
          <div className="grow">
            <div className="nx-modal-title" id={ids.title}>Registrar abono</div>
            <div className="nx-modal-sub">{venta.folio} · {clienteTexto(venta)}</div>
          </div>
          <button type="button" className="nx-close vx-close-44" aria-label="Cerrar" onClick={close}><X size={20} aria-hidden="true" /></button>
        </div>

        <div className="nx-modal-body">
          <div className="vx-sum3">
            <div><div className="t-small">Total</div><div className="nx-num t-h3">{formatCurrency(venta.total)}</div></div>
            <div><div className="t-small">Cobrado</div><div className="nx-num t-h3">{formatCurrency(venta.montoPagado)}</div></div>
            <div><div className="t-small">Saldo</div><div className="nx-num t-h3" style={{ color: "var(--nx-warn-fg)" }}>{formatCurrency(saldo)}</div></div>
          </div>

          <div className="nx-field">
            <label className="nx-label" htmlFor={ids.monto}>Monto del abono</label>
            <div className="nx-affix">
              <span className="pre" aria-hidden="true">$</span>
              <input
                ref={inputRef}
                id={ids.monto}
                className={`nx-input has-pre nx-num ${error ? "is-error" : ""}`}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={ids.msg}
                disabled={guardando}
              />
            </div>
            <span id={ids.msg} aria-live="polite">
              {error ? (
                <span className="nx-error"><AlertCircle size={16} aria-hidden="true" /><span>{error}</span></span>
              ) : (
                <span className="nx-hint" style={{ color: "var(--nx-ink-2)" }}>{hint}</span>
              )}
            </span>
          </div>

          <div className="nx-row gap-8" style={{ flexWrap: "wrap" }}>
            <button type="button" className="nx-chip" onClick={() => setMonto(saldo.toFixed(2))} disabled={guardando}>
              Liquidar saldo · {formatCurrency(saldo)}
            </button>
          </div>

          {/* Escritorio: select · Móvil: segmentado */}
          <div className="nx-field vx-only-desk">
            <label className="nx-label" htmlFor={ids.forma}>Forma de pago</label>
            <div className="nx-select-wrap">
              <select id={ids.forma} className="nx-input" value={forma} onChange={(e) => setForma(e.target.value as FormaPagoAbono)} disabled={guardando}>
                {FORMAS_PAGO_ABONO.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <span className="chev" aria-hidden="true"><ChevronDown size={20} /></span>
            </div>
          </div>
          <div className="nx-field vx-only-mob">
            <span className="nx-label" id={`${ids.forma}-seg`}>Forma de pago</span>
            <div className="nx-seg" role="group" aria-labelledby={`${ids.forma}-seg`}>
              {FORMAS_PAGO_ABONO.map((f) => (
                <button key={f.value} type="button" className={forma === f.value ? "is-on" : ""} aria-pressed={forma === f.value} onClick={() => setForma(f.value)} disabled={guardando}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {errorServidor && (
            <div className="nx-alert is-bad" role="alert">
              <AlertCircle size={18} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
              <div className="txt" style={{ marginTop: 0 }}>{errorServidor}</div>
            </div>
          )}
        </div>

        <div className="nx-modal-foot vx-foot">
          <button type="button" className="nx-btn nx-btn-ghost" onClick={close} disabled={guardando}>Cancelar</button>
          <button type="submit" className="nx-btn nx-btn-primary vx-foot-main" disabled={bloqueado}>
            {guardando ? "Registrando…" : "Registrar abono"}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ============================================================
   Cancelar venta
   ============================================================ */

export type CancelarTarget = Pick<VentaVM, "id" | "folio" | "cliente" | "fecha" | "hora" | "total" | "montoPagado" | "lineas">

const AVISO_CANCELACION = "nx:venta-cancelada"

/** Lee (y borra) el aviso que deja el modal al cancelar; `cancelarVenta` redirige a /ventas. */
export function consumirAvisoCancelacion(): { id: string; folio: string } | null {
  try {
    const raw = window.sessionStorage.getItem(AVISO_CANCELACION)
    if (!raw) return null
    window.sessionStorage.removeItem(AVISO_CANCELACION)
    const data = JSON.parse(raw) as { id?: unknown; folio?: unknown }
    return typeof data.id === "string" && typeof data.folio === "string" ? { id: data.id, folio: data.folio } : null
  } catch {
    return null
  }
}

function guardarAviso(v: { id: string; folio: string } | null) {
  try {
    if (v) window.sessionStorage.setItem(AVISO_CANCELACION, JSON.stringify(v))
    else window.sessionStorage.removeItem(AVISO_CANCELACION)
  } catch { /* almacenamiento no disponible: solo se pierde el aviso */ }
}

export function CancelarVentaDialog({
  venta,
  onClose,
  onSuccess,
}: {
  venta: CancelarTarget
  onClose: () => void
  onSuccess?: () => void
}) {
  const router = useRouter()
  const uid = useId()
  const [motivo, setMotivo] = useState("")
  const [intentado, setIntentado] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [errorServidor, setErrorServidor] = useState("")
  const close = useCallback(() => { if (!cancelando) onClose() }, [cancelando, onClose])
  const keepRef = useOverlay<HTMLButtonElement>(close)

  const faltaMotivo = intentado && !motivo.trim()

  async function handleCancelar() {
    if (!motivo.trim()) { setIntentado(true); return }
    setCancelando(true)
    setErrorServidor("")
    guardarAviso({ id: venta.id, folio: venta.folio })
    try {
      exigirOk(await cancelarVenta(venta.id, motivo.trim()))
      onSuccess?.()
      router.refresh()
    } catch (err) {
      guardarAviso(null)
      setErrorServidor(mensajeError(err, "No se pudo cancelar la venta. Intenta de nuevo."))
      setCancelando(false)
    }
  }

  const ids = { title: `${uid}-t`, motivo: `${uid}-r`, err: `${uid}-e` }
  const piezas = venta.lineas.reduce((a, l) => a + l.cantidad, 0)

  return (
    <div className="nx-overlay nx-scrim" onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="nx-modal vx-modal" role="alertdialog" aria-modal="true" aria-labelledby={ids.title} style={{ maxWidth: 440 }}>
        <div className="vx-grab" aria-hidden="true" />
        <div className="nx-modal-head">
          <div className="grow">
            <div className="nx-modal-title" id={ids.title}>Cancelar venta {venta.folio}</div>
            <div className="nx-modal-sub">
              {clienteTexto(venta)} · {fechaRelativa(venta.fecha, hoyISO())} {horaCorta(venta.hora)} · {formatCurrency(venta.total)}
            </div>
          </div>
          <button type="button" className="nx-close vx-close-44" aria-label="Cerrar" onClick={close}><X size={20} aria-hidden="true" /></button>
        </div>

        <div className="nx-modal-body">
          <div className="nx-alert is-warn" style={{ padding: "12px 14px", flexDirection: "column", gap: 8 }}>
            <div className="nx-row gap-8" style={{ alignItems: "flex-start" }}>
              <Ban size={18} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
              <span className="vx-alert-line">La venta queda bloqueada y ya no admitirá abonos.</span>
            </div>
            <div className="nx-row gap-8" style={{ alignItems: "flex-start" }}>
              <Check size={18} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
              <span className="vx-alert-line">
                Se devuelve el stock: {piezas} {piezas === 1 ? "pieza" : "piezas"} ({productosTexto(venta.lineas) || "sin productos"}).
              </span>
            </div>
            {venta.montoPagado > 0 && (
              <div className="nx-row gap-8" style={{ alignItems: "flex-start" }}>
                <Check size={18} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
                <span className="vx-alert-line">
                  Se registra en Finanzas la devolución de {formatCurrency(venta.montoPagado)} cobrados.
                </span>
              </div>
            )}
            <div className="nx-row gap-8" style={{ alignItems: "flex-start" }}>
              <AlertCircle size={18} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
              <span className="vx-alert-line">Esta acción no se puede deshacer.</span>
            </div>
          </div>

          <div className="nx-field">
            <label className="nx-label" htmlFor={ids.motivo}>Motivo de la cancelación<i aria-hidden="true">*</i></label>
            <textarea
              id={ids.motivo}
              className={`nx-input ${faltaMotivo ? "is-error" : ""}`}
              placeholder="Ej. El cliente devolvió la prenda"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              aria-required="true"
              aria-invalid={faltaMotivo ? true : undefined}
              aria-describedby={faltaMotivo ? ids.err : undefined}
              disabled={cancelando}
              maxLength={500}
            />
            {faltaMotivo && (
              <span className="nx-error" id={ids.err}><AlertCircle size={16} aria-hidden="true" /><span>Escribe el motivo para cancelar la venta.</span></span>
            )}
          </div>

          {errorServidor && (
            <div className="nx-alert is-bad" role="alert">
              <AlertCircle size={18} aria-hidden="true" style={{ flex: "none", marginTop: 1 }} />
              <div className="txt" style={{ marginTop: 0 }}>{errorServidor}</div>
            </div>
          )}
        </div>

        <div className="nx-modal-foot vx-foot vx-foot-stack">
          <button ref={keepRef} type="button" className="nx-btn nx-btn-secondary" onClick={close} disabled={cancelando}>Conservar venta</button>
          <button type="button" className="nx-btn nx-btn-danger vx-foot-main" onClick={handleCancelar} disabled={cancelando}>
            {cancelando ? "Cancelando…" : "Cancelar venta"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Acciones en /ventas/[id]
   ============================================================ */

export function VentaDetalleAcciones({ venta }: { venta: VentaVM }) {
  const [abierto, setAbierto] = useState<"abono" | "cancelar" | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const cerrarToast = useCallback(() => setToast(null), [])
  const cancelada = venta.estatus === "cancelada"
  const puedeAbonar = admiteAbono(venta)

  return (
    <>
      <div className="nx-col gap-8">
        <button type="button" className="nx-btn nx-btn-primary nx-btn-block" disabled={!puedeAbonar} onClick={() => setAbierto("abono")}>
          <Plus size={18} aria-hidden="true" />
          Registrar abono
        </button>
        {!puedeAbonar && (
          <span className="nx-hint" style={{ textAlign: "center" }}>
            {cancelada ? "Una venta cancelada no admite abonos." : "Esta venta ya está pagada."}
          </span>
        )}
        <button type="button" className="nx-btn nx-btn-danger-soft nx-btn-block" disabled={cancelada} onClick={() => setAbierto("cancelar")}>
          <Ban size={18} aria-hidden="true" />
          Cancelar venta
        </button>
      </div>

      {abierto === "abono" && (
        <AbonoDialog
          venta={venta}
          onClose={() => setAbierto(null)}
          onSuccess={(r) => { setAbierto(null); setToast(abonoToast(venta, r)) }}
        />
      )}
      {abierto === "cancelar" && <CancelarVentaDialog venta={venta} onClose={() => setAbierto(null)} />}
      <VentaToast toast={toast} onClose={cerrarToast} />
    </>
  )
}
