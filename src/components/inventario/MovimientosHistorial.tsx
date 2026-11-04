"use client"

import { useState } from "react"
import { History } from "lucide-react"

export interface MovimientoFila {
  id:            string
  tipo:          "entrada" | "salida" | "ajuste" | "venta" | "cancelacion"
  cantidad:      number
  stock_antes:   number
  stock_despues: number
  notas:         string | null
  created_at:    string
  variante:      string | null
}

type Filtro = "todos" | MovimientoFila["tipo"]

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos",       label: "Todos" },
  { id: "venta",       label: "Ventas" },
  { id: "entrada",     label: "Entradas" },
  { id: "salida",      label: "Salidas" },
  { id: "ajuste",      label: "Ajustes" },
  { id: "cancelacion", label: "Cancelaciones" },
]

const TIPO: Record<MovimientoFila["tipo"], { cls: string; label: string }> = {
  venta:       { cls: "nx-type",          label: "Venta" },
  entrada:     { cls: "nx-badge is-ok",   label: "Entrada" },
  salida:      { cls: "nx-badge is-off",  label: "Salida" },
  ajuste:      { cls: "nx-badge is-warn", label: "Ajuste" },
  cancelacion: { cls: "nx-badge is-bad",  label: "Cancelación" },
}

const TZ = "America/Mexico_City"
const fmtDia = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, day: "numeric", month: "short" })
const fmtDiaAnio = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" })
const fmtHora = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
const fmtClave = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })

function etiquetaDia(iso: string): string {
  const fecha = new Date(iso)
  const clave = fmtClave.format(fecha)
  const hoy = new Date()
  if (clave === fmtClave.format(hoy)) return "Hoy"
  if (clave === fmtClave.format(new Date(hoy.getTime() - 86_400_000))) return "Ayer"
  return fecha.getFullYear() === hoy.getFullYear() ? fmtDia.format(fecha) : fmtDiaAnio.format(fecha)
}

function cambio(m: MovimientoFila): { texto: string; pos: boolean } {
  const diff = m.stock_despues - m.stock_antes
  if (diff > 0) return { texto: `+${diff}`, pos: true }
  if (diff < 0) return { texto: `−${Math.abs(diff)}`, pos: false }
  return { texto: "0", pos: false }
}

/** Historial de movimientos de stock con filtro por tipo. Tabla en escritorio, lista por día en móvil. */
export function MovimientosHistorial({ movimientos, limite }: { movimientos: MovimientoFila[]; limite?: number }) {
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const filas = movimientos.filter((m) => filtro === "todos" || m.tipo === filtro)
  const conVariante = movimientos.some((m) => m.variante)

  if (movimientos.length === 0) {
    return (
      <div className="nx-card nx-empty">
        <div className="nx-empty-ic"><History size={28} strokeWidth={1.8} aria-hidden="true" /></div>
        <div className="ttl">Producto sin movimientos</div>
        <div className="txt">Cuando vendas, repongas o ajustes stock, aparecerá aquí.</div>
      </div>
    )
  }

  // agrupar por día (ya vienen del más reciente al más antiguo)
  const grupos: { dia: string; filas: MovimientoFila[] }[] = []
  for (const m of filas) {
    const dia = etiquetaDia(m.created_at)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.dia === dia) ultimo.filas.push(m)
    else grupos.push({ dia, filas: [m] })
  }

  return (
    <section className="nx-col gap-12" aria-labelledby="h-historial">
      <div className="nx-row gap-8" style={{ flexWrap: "wrap" }}>
        <h2 className="t-h2 grow" id="h-historial">Historial de movimientos</h2>
        <span className="t-cap">Más recientes primero</span>
      </div>
      <div className="nx-row gap-8" style={{ flexWrap: "wrap" }} role="group" aria-label="Tipo de movimiento">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" className={`nx-chip ${filtro === f.id ? "is-on" : ""}`} aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {filas.length === 0 ? (
        <div className="nx-card nx-empty">
          <div className="nx-empty-ic"><History size={28} strokeWidth={1.8} aria-hidden="true" /></div>
          <div className="ttl">Sin movimientos de este tipo</div>
          <div className="txt">Prueba con otro filtro.</div>
          <button type="button" className="nx-btn nx-btn-secondary" onClick={() => setFiltro("todos")}>Ver todos</button>
        </div>
      ) : (
        <>
          <div className="nx-table-wrap inv-table-scroll inv-only-desktop">
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  {conVariante && <th>Variante</th>}
                  <th className="r">Cantidad</th>
                  <th className="r">Antes</th>
                  <th className="r">Después</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((m) => {
                  const c = cambio(m)
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="t-h3" style={{ fontSize: 14 }}>{etiquetaDia(m.created_at)}</div>
                        <div className="t-small nx-num">{fmtHora.format(new Date(m.created_at))}</div>
                      </td>
                      <td><span className={TIPO[m.tipo].cls}>{TIPO[m.tipo].label}</span></td>
                      {conVariante && <td className="nx-num">{m.variante ?? "—"}</td>}
                      <td className="r"><b className={c.pos ? "pos" : ""}>{c.texto}</b></td>
                      <td className="r ink3">{m.stock_antes}</td>
                      <td className="r"><b>{m.stock_despues}</b></td>
                      <td className="ink2" style={{ maxWidth: 260, whiteSpace: "normal" }}>{m.notas ?? "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="nx-list inv-only-mobile">
            {grupos.map((g) => (
              <div key={g.dia}>
                <div className="nx-group"><span>{g.dia}</span></div>
                {g.filas.map((m) => {
                  const c = cambio(m)
                  return (
                    <div key={m.id} className="nx-li">
                      <div className="grow">
                        <div className="nx-li-title">
                          <span className={TIPO[m.tipo].cls}>{TIPO[m.tipo].label}</span>
                          {m.variante && <> {m.variante}</>}
                        </div>
                        <div className="nx-li-meta">{fmtHora.format(new Date(m.created_at))}{m.notas ? ` · ${m.notas}` : ""}</div>
                      </div>
                      <div className="nx-li-end">
                        <span className={`nx-li-amt ${c.pos ? "pos" : ""}`}>{c.texto}</span>
                        <span className="t-small nx-num">{m.stock_antes} → {m.stock_despues}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {limite && movimientos.length >= limite && (
            <p className="t-small">Se muestran los últimos {limite} movimientos.</p>
          )}
        </>
      )}
    </section>
  )
}
