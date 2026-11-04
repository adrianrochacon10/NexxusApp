import { formatCurrency } from "@/lib/utils"
import {
  type VentaVM,
  clienteTexto,
  estadoVisual,
  fechaHoraPago,
  formaPagoLabel,
  porcentajeCobrado,
} from "./venta-data"

/* Bloques del detalle de venta. Sin estado: se usan en el panel
   lateral del historial (client) y en /ventas/[id] (server). */

export function DetalleCancelada({ venta }: { venta: VentaVM }) {
  if (venta.estatus !== "cancelada") return null
  return (
    <div className="nx-alert is-bad" role="note" style={{ flexDirection: "column", gap: 4 }}>
      <div className="ttl">Venta cancelada</div>
      <div className="txt">
        {venta.motivoCancelacion ? `Motivo: ${venta.motivoCancelacion}. ` : ""}No admite más abonos.
      </div>
    </div>
  )
}

export function DetalleCliente({ venta }: { venta: VentaVM }) {
  return (
    <div>
      <div className="t-cap" style={{ marginBottom: 8 }}>Cliente</div>
      <div className="t-h3">{clienteTexto(venta)}</div>
      <div className="t-small nx-num">{venta.telefono ?? "Sin teléfono"}</div>
    </div>
  )
}

export function DetalleProductos({ venta }: { venta: VentaVM }) {
  return (
    <div>
      <div className="t-cap" style={{ marginBottom: 4 }}>Productos</div>
      <ul className="vx-lines">
        {venta.lineas.map((l) => (
          <li key={l.id} className="nx-row gap-12">
            <div className="grow">
              <div className="t-h3" style={{ fontSize: 14 }}>{l.nombre}</div>
              <div className="t-small nx-num">
                {l.variante ? `${l.variante} · ` : ""}{l.cantidad} × {formatCurrency(l.precio)}
              </div>
            </div>
            <span className="nx-num t-h3" style={{ fontSize: 14 }}>{formatCurrency(l.subtotal)}</span>
          </li>
        ))}
      </ul>
      <div className="nx-row" style={{ justifyContent: "space-between", paddingTop: 12 }}>
        <span className="t-small">Total</span>
        <span className="nx-num t-h2">{formatCurrency(venta.total)}</span>
      </div>
    </div>
  )
}

export function DetalleCobro({ venta }: { venta: VentaVM }) {
  const estado = estadoVisual(venta)
  const pct = estado === "cancelada" ? 0 : porcentajeCobrado(venta)
  const n = venta.pagos.length
  return (
    <div className="nx-col gap-8">
      <div className="nx-row" style={{ justifyContent: "space-between" }}>
        <span className="t-cap">Cobro</span>
        <span className="t-small nx-num">{n} {n === 1 ? "pago" : "pagos"}</span>
      </div>
      <div
        className={`nx-progress ${estado === "pagada" ? "is-ok" : ""}`}
        role="progressbar"
        aria-label="Porcentaje cobrado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="nx-row nx-num" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span className="t-small">Cobrado <b style={{ color: "var(--nx-ink)" }}>{formatCurrency(venta.montoPagado)}</b></span>
        <span className="t-small">
          Por cobrar <b style={{ color: "var(--nx-ink)" }}>{formatCurrency(venta.estatus === "cancelada" ? 0 : Math.max(0, venta.saldo))}</b>
        </span>
      </div>
    </div>
  )
}

export function DetallePagos({ venta }: { venta: VentaVM }) {
  const cancelada = venta.estatus === "cancelada"
  return (
    <div>
      <div className="t-cap" style={{ marginBottom: 4 }}>Pagos recibidos</div>
      {venta.pagos.length === 0 ? (
        <div className="t-small" style={{ padding: "8px 0" }}>Todavía no hay pagos. Toda la venta está pendiente.</div>
      ) : (
        <ul className="vx-lines">
          {venta.pagos.map((p, i) => (
            <li key={p.id} className="nx-row gap-12">
              <div className="grow">
                <div className="t-h3" style={{ fontSize: 14 }}>
                  {i === 0 && venta.formaPagoInicial ? "Pago inicial" : "Abono"}
                </div>
                <div className="t-small">
                  {[fechaHoraPago(p.createdAt), formaPagoLabel(p.formaPago)].filter(Boolean).join(" · ")}
                </div>
                {p.notas && <div className="t-small">{p.notas}</div>}
              </div>
              <span className={`nx-num t-h3 ${cancelada ? "vx-strike ink3" : ""}`} style={{ fontSize: 14 }}>
                {formatCurrency(p.monto)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DetalleNotas({ venta }: { venta: VentaVM }) {
  if (!venta.notas) return null
  return (
    <div>
      <div className="t-cap" style={{ marginBottom: 4 }}>Notas</div>
      <p className="t-small" style={{ color: "var(--nx-ink)" }}>{venta.notas}</p>
    </div>
  )
}
