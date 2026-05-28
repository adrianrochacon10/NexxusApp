"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Ban, Plus, User } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/shared/Navbar"
import { EstatusPagoBadge, EstatusOperativoBadge } from "@/components/ventas/EstatusPagoBadge"
import { formatCurrency } from "@/lib/utils"
import { useStore } from "@/lib/store"

const FORMAS_PAGO_ABONO = [
  { value: "efectivo"      as const, label: "Efectivo"      },
  { value: "tarjeta"       as const, label: "Tarjeta"        },
  { value: "transferencia" as const, label: "Transferencia"  },
]

export default function VentaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const { ventas, registrarAbono, cancelarVenta } = useStore()

  const venta = ventas.find((v) => v.id === id)

  const [montoAbono,    setMontoAbono]    = useState("")
  const [formaAbono,    setFormaAbono]    = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo")
  const [notasAbono,    setNotasAbono]    = useState("")
  const [guardandoAbo,  setGuardandoAbo]  = useState(false)
  const [mostrarAbono,  setMostrarAbono]  = useState(false)

  const [mostrarCancel, setMostrarCancel] = useState(false)
  const [motivoCancel,  setMotivoCancel]  = useState("")
  const [cancelando,    setCancelando]    = useState(false)

  if (!venta) {
    return (
      <>
        <Navbar title="Venta no encontrada" hideActions />
        <div className="page">
          <p style={{ color: "var(--text-secondary)" }}>Esta venta no existe.</p>
          <Link href="/ventas" className="button" style={{ marginTop: 16, width: "fit-content" }}>
            <ArrowLeft size={15} aria-hidden="true" /> Volver a ventas
          </Link>
        </div>
      </>
    )
  }

  const cancelada = venta.estatusOperativo === "cancelada"
  const pagada    = venta.estatusPago === "pagada"

  async function handleAbono() {
    const monto = parseFloat(montoAbono)
    if (!monto || monto <= 0 || monto > venta!.saldoPendiente) return
    setGuardandoAbo(true)
    registrarAbono({ ventaId: venta!.id, monto, formaPago: formaAbono, notas: notasAbono.trim() || undefined })
    setGuardandoAbo(false)
    setMontoAbono("")
    setNotasAbono("")
    setMostrarAbono(false)
  }

  async function handleCancelar() {
    if (!motivoCancel.trim()) return
    setCancelando(true)
    cancelarVenta({ ventaId: venta!.id, motivo: motivoCancel.trim() })
    setCancelando(false)
    setMostrarCancel(false)
  }

  return (
    <>
      <Navbar title={venta.folio} subtitle="Detalle de venta, abonos y acciones." hideActions />
      <div className="page" style={{ display: "grid", gap: 18, maxWidth: 860 }}>

        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/ventas" className="button" style={{ padding: "0 12px", flexShrink: 0 }} aria-label="Volver">
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <EstatusPagoBadge estatus={venta.estatusPago} />
            <EstatusOperativoBadge estatus={venta.estatusOperativo} />
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {venta.fecha} · {venta.hora}
            </span>
          </div>
        </div>

        {/* Banner cancelada */}
        {cancelada && (
          <div style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(155,74,74,0.35)", background: "rgba(155,74,74,0.08)", color: "var(--error)", fontSize: 13 }}>
            <strong>Venta cancelada.</strong>{venta.motivoCancelacion ? ` Motivo: ${venta.motivoCancelacion}` : ""}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>

          {/* Columna principal */}
          <div style={{ display: "grid", gap: 14 }}>

            {/* Líneas */}
            <section className="surface" style={{ padding: 20, display: "grid", gap: 14 }}>
              <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Productos</h2>
              {venta.lineas.map((linea, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, paddingBottom: 12, borderBottom: "1px solid var(--border-subtle)" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {linea.productoNombre}
                      {linea.varianteNombre && (
                        <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: 6 }}>— {linea.varianteNombre}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      {linea.cantidad} × {formatCurrency(linea.precioUnitario)}
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: 15 }}>{formatCurrency(linea.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                <span className="font-mono" style={{ fontSize: 20 }}>{formatCurrency(venta.total)}</span>
              </div>
            </section>

            {/* Abonos */}
            {venta.abonos.length > 0 && (
              <section className="surface" style={{ padding: 20, display: "grid", gap: 10 }}>
                <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Abonos</h2>
                {venta.abonos.map((abono) => (
                  <div key={abono.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "monospace" }}>{abono.fecha}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{abono.formaPago.charAt(0).toUpperCase() + abono.formaPago.slice(1)}</div>
                      {abono.notas && <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{abono.notas}</div>}
                    </div>
                    <span className="font-mono" style={{ fontSize: 15, color: "var(--success)" }}>+{formatCurrency(abono.monto)}</span>
                  </div>
                ))}
              </section>
            )}

            {/* Formulario de abono */}
            {!cancelada && !pagada && (
              <section className="surface" style={{ padding: 20, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h2 className="font-display" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Registrar abono</h2>
                  <button
                    type="button"
                    className="button"
                    onClick={() => setMostrarAbono((v) => !v)}
                    style={{ color: mostrarAbono ? "var(--text-secondary)" : "var(--accent-gold)", borderColor: mostrarAbono ? "var(--border-subtle)" : "rgba(201,168,76,0.3)" }}
                  >
                    <Plus size={15} aria-hidden="true" />
                    {mostrarAbono ? "Cancelar" : "Nuevo abono"}
                  </button>
                </div>

                {mostrarAbono && (
                  <div style={{ display: "grid", gap: 10, padding: 14, borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <label style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                        Monto *
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-tertiary)" }}>$</span>
                          <input
                            className="input"
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={venta.saldoPendiente}
                            value={montoAbono}
                            onChange={(e) => setMontoAbono(e.target.value)}
                            style={{ paddingLeft: 22, fontSize: 13 }}
                            autoFocus
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                          Máx: {formatCurrency(venta.saldoPendiente)}
                        </span>
                      </label>
                      <label style={{ display: "grid", gap: 6, fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                        Forma de pago
                        <select className="input" value={formaAbono} onChange={(e) => setFormaAbono(e.target.value as typeof formaAbono)} style={{ fontSize: 13 }}>
                          {FORMAS_PAGO_ABONO.map((fp) => (
                            <option key={fp.value} value={fp.value}>{fp.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <input
                      className="input"
                      value={notasAbono}
                      onChange={(e) => setNotasAbono(e.target.value)}
                      placeholder="Notas opcionales…"
                      style={{ fontSize: 13 }}
                    />
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={handleAbono}
                      disabled={guardandoAbo || !parseFloat(montoAbono) || parseFloat(montoAbono) > venta.saldoPendiente}
                      style={{ minHeight: 40 }}
                    >
                      {guardandoAbo ? "Registrando…" : "Confirmar abono"}
                    </button>
                  </div>
                )}
              </section>
            )}

          </div>

          {/* Columna lateral */}
          <div style={{ display: "grid", gap: 14 }}>

            {/* Resumen de pago */}
            <section className="surface elevated" style={{ padding: 20, display: "grid", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>Resumen</h3>
              <Row label="Total"      value={formatCurrency(venta.total)} />
              <Row label="Cobrado"    value={formatCurrency(venta.montoPagado)} color="var(--success)" />
              {venta.saldoPendiente > 0 && (
                <Row label="Saldo"    value={formatCurrency(venta.saldoPendiente)} color="var(--warning)" />
              )}
              <div style={{ height: 1, background: "var(--border-subtle)" }} />
              <Row label="Forma de pago" value={venta.formaPago.charAt(0).toUpperCase() + venta.formaPago.slice(1)} />
            </section>

            {/* Cliente */}
            {venta.cliente && (
              <section className="surface elevated" style={{ padding: 20, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <User size={14} color="var(--text-secondary)" aria-hidden="true" />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Cliente</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{venta.cliente.nombre}</div>
                {venta.cliente.telefono && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{venta.cliente.telefono}</div>
                )}
              </section>
            )}

            {/* Notas */}
            {venta.notas && (
              <section className="surface elevated" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Notas</div>
                <p style={{ margin: 0, fontSize: 13 }}>{venta.notas}</p>
              </section>
            )}

            {/* Cancelar venta */}
            {!cancelada && (
              <section className="surface elevated" style={{ padding: 20, display: "grid", gap: 10 }}>
                {!mostrarCancel ? (
                  <button
                    type="button"
                    className="button"
                    onClick={() => setMostrarCancel(true)}
                    style={{ color: "var(--error)", borderColor: "rgba(155,74,74,0.3)", justifyContent: "center" }}
                  >
                    <Ban size={14} aria-hidden="true" />
                    Cancelar venta
                  </button>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--error)" }}>
                      Esta acción no se puede deshacer. La venta quedará bloqueada.
                    </p>
                    <textarea
                      className="input"
                      rows={2}
                      value={motivoCancel}
                      onChange={(e) => setMotivoCancel(e.target.value)}
                      placeholder="Motivo de cancelación *"
                      style={{ fontSize: 13, resize: "none" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button type="button" className="button" onClick={() => setMostrarCancel(false)} style={{ justifyContent: "center" }}>
                        Volver
                      </button>
                      <button
                        type="button"
                        className="button"
                        onClick={handleCancelar}
                        disabled={cancelando || !motivoCancel.trim()}
                        style={{ color: "var(--error)", borderColor: "rgba(155,74,74,0.3)", justifyContent: "center" }}
                      >
                        {cancelando ? "Cancelando…" : "Confirmar"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
      <span className="font-mono" style={{ fontSize: 14, color: color ?? "var(--text-primary)" }}>{value}</span>
    </div>
  )
}
