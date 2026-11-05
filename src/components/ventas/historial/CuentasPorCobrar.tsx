"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { AbonoRapidoBtn } from "@/components/ventas/AbonoRapidoBtn"
import { abonoToast, type AbonoResultado, type AbonoTarget } from "@/components/ventas/VentaAcciones"
import { VentaToast, type ToastData } from "./VentaToast"
import {
  type VentaVM,
  clienteTexto,
  diasEntre,
  edadTexto,
  fechaRelativa,
  iniciales,
  porcentajeCobrado,
  productosTexto,
} from "./venta-data"

type Orden = "saldo" | "antigua"

const ORDENES: { id: Orden; label: string }[] = [
  { id: "saldo",   label: "Mayor saldo" },
  { id: "antigua", label: "Más antigua" },
]

export function CuentasPorCobrar({ cuentas, canceladas, hoy }: { cuentas: VentaVM[]; canceladas: VentaVM[]; hoy: string }) {
  const [orden, setOrden] = useState<Orden>("saldo")
  const [toast, setToast] = useState<ToastData | null>(null)
  const [liquidadas, setLiquidadas] = useState<{ id: string; folio: string; cliente: string | null; total: number }[]>([])
  const cerrarToast = useCallback(() => setToast(null), [])

  const abiertas = useMemo(() => {
    const ids = new Set(liquidadas.map((l) => l.id))
    const lista = cuentas.filter((c) => !ids.has(c.id))
    return lista.sort((a, b) =>
      orden === "saldo"
        ? b.saldo - a.saldo
        : `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`),
    )
  }, [cuentas, orden, liquidadas])

  function onRegistrado(venta: AbonoTarget, r: AbonoResultado) {
    setToast(abonoToast(venta, r))
    if (r.liquidada) {
      setLiquidadas((prev) => [{ id: venta.id, folio: venta.folio, cliente: venta.cliente, total: venta.total }, ...prev.filter((p) => p.id !== venta.id)])
    }
  }

  return (
    <>
      <div className="vx-sortbar" role="group" aria-label="Ordenar cuentas">
        <span className="t-small">Ordenar por</span>
        {ORDENES.map((o) => (
          <button key={o.id} type="button" className={`nx-chip ${orden === o.id ? "is-on" : ""}`} aria-pressed={orden === o.id} onClick={() => setOrden(o.id)}>
            {o.label}
          </button>
        ))}
      </div>

      {abiertas.length === 0 ? (
        <div className="nx-card nx-empty">
          <div className="nx-empty-ic" aria-hidden="true" style={{ background: "var(--nx-ok-bg)", color: "var(--nx-ok-fg)" }}><Check size={28} strokeWidth={2} /></div>
          <div className="ttl">Todo está cobrado</div>
          <div className="txt">No hay cuentas con saldo pendiente. Las ventas a crédito aparecerán aquí.</div>
        </div>
      ) : (
        <div className="vx-acc-grid">
          {abiertas.map((c) => {
            const dias = diasEntre(c.fecha, hoy)
            const n = c.pagos.length
            return (
              <section key={c.id} className="nx-card vx-acc" aria-label={`Cuenta ${c.folio}`}>
                <div className="nx-row gap-12" style={{ alignItems: "flex-start" }}>
                  <div className="nx-thumb vx-ini" aria-hidden="true">{iniciales(c.cliente)}</div>
                  <div className="grow">
                    <div className="t-h3 nx-ellipsis">{clienteTexto(c)}</div>
                    <div className="t-small nx-num">
                      <Link href={`/ventas/${c.id}`} className="vx-inline-link">{c.folio}</Link> · {fechaRelativa(c.fecha, hoy)} · {edadTexto(dias)}
                    </div>
                  </div>
                  <span className="nx-badge is-warn">{c.montoPagado > 0 ? "Parcial" : "Pendiente"}</span>
                </div>
                <div className="t-small nx-ellipsis">{productosTexto(c.lineas)}</div>
                <div className="nx-col gap-8">
                  <div className="nx-progress" role="progressbar" aria-label={`Cobrado de ${c.folio}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={porcentajeCobrado(c)}>
                    <i style={{ width: `${porcentajeCobrado(c)}%` }} />
                  </div>
                  <div className="nx-row nx-num" style={{ justifyContent: "space-between", gap: 12 }}>
                    <span className="t-small">Cobrado <b style={{ color: "var(--nx-ink)" }}>{formatCurrency(c.montoPagado)}</b> de {formatCurrency(c.total)}</span>
                    <span className="t-small" style={{ flex: "none" }}>{n === 0 ? "Sin pagos" : `${n} ${n === 1 ? "pago" : "pagos"}`}</span>
                  </div>
                </div>
                <div className="nx-row gap-12" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div className="t-small">Por cobrar</div>
                    <div className="nx-num vx-due">{formatCurrency(c.saldo)}</div>
                  </div>
                  <AbonoRapidoBtn venta={c} onRegistrado={onRegistrado} />
                </div>
              </section>
            )
          })}
        </div>
      )}

      {liquidadas.length > 0 && (
        <>
          <h2 className="t-cap vx-sec">Liquidadas en esta sesión</h2>
          <div className="vx-acc-grid">
            {liquidadas.map((l) => (
              <section key={l.id} className="nx-card vx-acc" aria-label={`Cuenta ${l.folio} liquidada`}>
                <div className="nx-row gap-12">
                  <div className="nx-thumb vx-ini" aria-hidden="true">{iniciales(l.cliente)}</div>
                  <div className="grow">
                    <div className="t-h3 nx-ellipsis">{clienteTexto(l)}</div>
                    <div className="t-small nx-num">{l.folio} · {formatCurrency(l.total)} cobrado completo</div>
                  </div>
                  <span className="nx-badge is-ok">Pagada</span>
                </div>
                <div className="nx-progress is-ok" aria-hidden="true"><i style={{ width: "100%" }} /></div>
              </section>
            ))}
          </div>
        </>
      )}

      {canceladas.length > 0 && (
        <>
          <h2 className="t-cap vx-sec">Canceladas · ya no admiten abonos</h2>
          <div className="vx-acc-grid">
            {canceladas.map((c) => (
              <section key={c.id} className="nx-card vx-acc is-dim" aria-label={`Cuenta ${c.folio} cancelada`}>
                <div className="nx-row gap-12">
                  <div className="nx-thumb vx-ini" aria-hidden="true" style={{ opacity: 0.6 }}>{iniciales(c.cliente)}</div>
                  <div className="grow">
                    <div className="t-h3 nx-ellipsis ink3">{clienteTexto(c)}</div>
                    <div className="t-small nx-num">
                      <Link href={`/ventas/${c.id}`} className="vx-inline-link">{c.folio}</Link> · {fechaRelativa(c.fecha, hoy)}
                    </div>
                  </div>
                  <span className="nx-badge is-bad">Cancelada</span>
                </div>
                <div className="t-small">
                  {c.motivoCancelacion ? `Motivo: ${c.motivoCancelacion}. ` : ""}Tenía {formatCurrency(c.saldo)} por cobrar al cancelarse.
                </div>
                <div className="nx-row gap-12" style={{ justifyContent: "space-between" }}>
                  <span className="t-small">No hay saldo por cobrar.</span>
                  <button type="button" className="nx-btn nx-btn-secondary" disabled>Registrar abono</button>
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <VentaToast toast={toast} onClose={cerrarToast} />
    </>
  )
}
