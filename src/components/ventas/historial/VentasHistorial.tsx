"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CircleX, PlusCircle, Search } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { AbonoDialog, CancelarVentaDialog, abonoToast, consumirAvisoCancelacion } from "@/components/ventas/VentaAcciones"
import { VentaDrawer } from "./VentaDrawer"
import { VentaToast, type ToastData } from "./VentaToast"
import {
  ESTADO_BADGE,
  type VentaVM,
  admiteAbono,
  clienteTexto,
  estadoVisual,
  fechaGrupo,
  formaPagoLabel,
  horaCorta,
  productosTexto,
} from "./venta-data"

type Filtro = "todas" | "saldo" | "pagadas" | "canceladas"

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todas",      label: "Todas" },
  { id: "saldo",      label: "Con saldo" },
  { id: "pagadas",    label: "Pagadas" },
  { id: "canceladas", label: "Canceladas" },
]

function coincideFiltro(v: VentaVM, f: Filtro) {
  const e = estadoVisual(v)
  if (f === "saldo") return e === "parcial" || e === "pendiente"
  if (f === "pagadas") return e === "pagada"
  if (f === "canceladas") return e === "cancelada"
  return true
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

export function VentasHistorial({ ventas, hoy }: { ventas: VentaVM[]; hoy: string }) {
  const [q, setQ] = useState("")
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [detalleId, setDetalleId] = useState<string | null>(null)
  const [abonoId, setAbonoId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const cerrarToast = useCallback(() => setToast(null), [])

  const porId = useMemo(() => new Map(ventas.map((v) => [v.id, v])), [ventas])
  const detalle = detalleId ? porId.get(detalleId) ?? null : null
  const abono = abonoId ? porId.get(abonoId) ?? null : null
  const cancel = cancelId ? porId.get(cancelId) ?? null : null

  // Tras cancelar, el servidor redirige a /ventas: mostramos el aviso al ver la venta ya cancelada.
  useEffect(() => {
    const aviso = consumirAvisoCancelacion()
    if (!aviso) return
    const v = porId.get(aviso.id)
    if (v?.estatus === "cancelada") {
      setToast({ title: `${aviso.folio} cancelada`, text: "La venta quedó bloqueada y ya no admite abonos." })
      setCancelId((id) => (id === aviso.id ? null : id))
    }
  }, [porId])

  const grupos = useMemo(() => {
    const texto = normalizar(q.trim())
    const map = new Map<string, { total: number; rows: VentaVM[] }>()
    for (const v of ventas) {
      let g = map.get(v.fecha)
      if (!g) { g = { total: 0, rows: [] }; map.set(v.fecha, g) }
      // El total del día no depende del filtro
      if (v.estatus === "activa") g.total += v.montoPagado
      if (!coincideFiltro(v, filtro)) continue
      if (texto) {
        const hay = normalizar([v.folio, v.cliente ?? "", v.telefono ?? "", ...v.lineas.map((l) => `${l.nombre} ${l.variante ?? ""}`)].join(" "))
        if (!hay.includes(texto)) continue
      }
      g.rows.push(v)
    }
    return [...map.entries()]
      .filter(([, g]) => g.rows.length > 0)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([fecha, g]) => ({ fecha, label: fechaGrupo(fecha, hoy), ...g }))
  }, [ventas, q, filtro, hoy])

  const limpiar = () => { setQ(""); setFiltro("todas") }

  return (
    <>
      <div className="vx-toolbar">
        <div className="nx-affix vx-search">
          <span className="ic" aria-hidden="true"><Search size={20} /></span>
          <input
            type="search"
            className="nx-input has-ic"
            aria-label="Buscar venta"
            placeholder="Folio, cliente o producto"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="vx-chips" role="group" aria-label="Filtrar por estado">
          {FILTROS.map((f) => (
            <button key={f.id} type="button" className={`nx-chip ${filtro === f.id ? "is-on" : ""}`} aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {grupos.length === 0 ? (
        <div className="nx-card nx-empty">
          <div className="nx-empty-ic" aria-hidden="true"><Search size={28} strokeWidth={1.8} /></div>
          <div className="ttl">No hay ventas con ese filtro</div>
          <div className="txt">Prueba con otro folio, cliente o estado.</div>
          <button type="button" className="nx-btn nx-btn-secondary" onClick={limpiar}>Limpiar filtros</button>
        </div>
      ) : (
        <>
          {/* Escritorio / tableta: tabla agrupada por día */}
          <div className="nx-table-wrap vx-only-desk">
            <table className="nx-table vx-table">
              <colgroup>
                <col style={{ width: 112 }} /><col /><col style={{ width: 150 }} /><col style={{ width: 120 }} />
                <col style={{ width: 120 }} /><col style={{ width: 116 }} /><col style={{ width: 120 }} /><col style={{ width: 104 }} />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Folio</th><th scope="col">Productos</th><th scope="col">Cliente</th><th scope="col">Pago</th>
                  <th scope="col" className="r">Cobrado</th><th scope="col" className="r">Saldo</th><th scope="col">Estado</th>
                  <th scope="col" className="r">Acciones</th>
                </tr>
              </thead>
              {grupos.map((g) => (
                <tbody key={g.fecha}>
                  <tr className="grp">
                    <th scope="colgroup" colSpan={8} className="vx-grp-cell">
                      <span>{g.label}</span>
                      <span className="nx-num">Cobrado {formatCurrency(g.total)}</span>
                    </th>
                  </tr>
                  {g.rows.map((v) => {
                    const estado = estadoVisual(v)
                    const can = estado === "cancelada"
                    const badge = ESTADO_BADGE[estado]
                    const conSaldo = !can && v.saldo > 0.004
                    const puedeAbonar = admiteAbono(v)
                    return (
                      <tr key={v.id} className={`vx-row ${can ? "is-cancelled" : ""}`} onClick={() => setDetalleId(v.id)}>
                        <td>
                          <button type="button" className="vx-rowlink nx-mono" aria-label={`Ver detalle de la venta ${v.folio}`} onClick={(e) => { e.stopPropagation(); setDetalleId(v.id) }}>
                            {v.folio}
                          </button>
                          <div className="t-small nx-num">{horaCorta(v.hora)}</div>
                        </td>
                        <td><div className="nx-ellipsis" title={productosTexto(v.lineas)}>{productosTexto(v.lineas) || "—"}</div></td>
                        <td><div className="nx-ellipsis">{clienteTexto(v)}</div></td>
                        <td className="ink2">{formaPagoLabel(v.formaPagoInicial)}</td>
                        <td className="r nx-num"><b className="amt">{formatCurrency(v.montoPagado)}</b></td>
                        <td className="r nx-num" style={{ color: conSaldo ? "var(--nx-warn-fg)" : "var(--nx-ink-3)" }}>
                          <b>{conSaldo ? formatCurrency(v.saldo) : "—"}</b>
                        </td>
                        <td><span className={`nx-badge ${badge.cls}`}>{badge.label}</span></td>
                        <td className="r">
                          <div className="nx-row" style={{ justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="nx-iconbtn"
                              aria-label={`Registrar abono a ${v.folio}`}
                              title={puedeAbonar ? "Registrar abono" : can ? "Venta cancelada" : "Venta pagada"}
                              disabled={!puedeAbonar}
                              onClick={(e) => { e.stopPropagation(); setAbonoId(v.id) }}
                            >
                              <PlusCircle size={22} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="nx-iconbtn danger"
                              aria-label={`Cancelar venta ${v.folio}`}
                              title={can ? "Venta ya cancelada" : "Cancelar venta"}
                              disabled={can}
                              onClick={(e) => { e.stopPropagation(); setCancelId(v.id) }}
                            >
                              <CircleX size={22} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              ))}
            </table>
          </div>

          {/* Móvil: lista agrupada */}
          <div className="nx-list vx-only-mob">
            {grupos.map((g) => (
              <section key={g.fecha} aria-label={g.label}>
                <div className="nx-group"><span>{g.label}</span><span className="nx-num">Cobrado {formatCurrency(g.total)}</span></div>
                {g.rows.map((v) => {
                  const estado = estadoVisual(v)
                  const can = estado === "cancelada"
                  const badge = ESTADO_BADGE[estado]
                  const conSaldo = !can && v.saldo > 0.004
                  return (
                    <button key={v.id} type="button" className={`vx-rowb ${can ? "is-cancelled" : ""}`} onClick={() => setDetalleId(v.id)}>
                      <div className="grow">
                        <div className="nx-row gap-8">
                          <b className="nx-mono">{v.folio}</b>
                          <span className={`nx-badge ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <div className="t-h3 vx-rowb-client">{clienteTexto(v)}</div>
                        <div className="t-small nx-ellipsis">{productosTexto(v.lineas)}</div>
                      </div>
                      <div className="nx-num" style={{ textAlign: "right", flex: "none" }}>
                        <div className="t-h3 amt">{formatCurrency(v.total)}</div>
                        <div className="t-small" style={{ color: conSaldo ? "var(--nx-warn-fg)" : "var(--nx-ink-3)" }}>
                          {can ? "Cancelada" : conSaldo ? `Debe ${formatCurrency(v.saldo)}` : horaCorta(v.hora)}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </section>
            ))}
          </div>
        </>
      )}

      {detalle && (
        <VentaDrawer
          venta={detalle}
          hoy={hoy}
          onClose={() => setDetalleId(null)}
          onAbonar={() => setAbonoId(detalle.id)}
          onCancelar={() => setCancelId(detalle.id)}
          escapeDisabled={!!abono || !!cancel}
        />
      )}

      {abono && (
        <AbonoDialog
          key={abono.id}
          venta={abono}
          onClose={() => setAbonoId(null)}
          onSuccess={(r) => { setAbonoId(null); setToast(abonoToast(abono, r)) }}
        />
      )}

      {cancel && cancel.estatus === "activa" && (
        <CancelarVentaDialog key={cancel.id} venta={cancel} onClose={() => setCancelId(null)} />
      )}

      <VentaToast toast={toast} onClose={cerrarToast} />
    </>
  )
}
