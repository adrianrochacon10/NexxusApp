"use client"

import { useState } from "react"
import { PackagePlus } from "lucide-react"
import { StockMovimientoDialog } from "@/components/inventario/StockActualizador"

interface Variante {
  id:           string
  nombre:       string
  sku:          string | null
  stock:        number
  stock_minimo: number
  estatus:      string
}

/** Stock por variante con acceso directo a registrar un movimiento de cada una. */
export function VariantesStockInline({
  variantes, productoId, productoNombre,
}: { variantes: Variante[]; productoId: string; productoNombre: string }) {
  const [varianteId, setVarianteId] = useState<string | null>(null)
  const stockTotal = variantes.reduce((s, v) => s + v.stock, 0)

  return (
    <section className="nx-card" aria-labelledby="h-variantes" style={{ overflow: "hidden" }}>
      <div className="nx-panel-head">
        <h2 className="t-h2" id="h-variantes">Variantes</h2>
        <span className="t-small nx-num"><b style={{ color: "var(--nx-ink)" }}>{stockTotal}</b> uds en total</span>
      </div>
      <div>
        {variantes.map((v) => {
          const agotada = v.stock <= 0
          const baja = !agotada && v.stock <= v.stock_minimo
          return (
            <div key={v.id} className={`nx-li ${baja ? "is-low" : ""}`} style={{ minHeight: 60, paddingRight: 8 }}>
              <div className="grow">
                <div className="nx-li-title">{v.nombre}</div>
                <div className="nx-li-meta nx-num">
                  {v.sku ? <span className="nx-mono" style={{ fontSize: 12 }}>{v.sku} · </span> : null}mín. {v.stock_minimo}
                </div>
              </div>
              <div className="nx-li-end">
                <span className="nx-li-amt">{v.stock} uds</span>
                {agotada ? <span className="nx-badge is-bad">Agotada</span> : baja ? <span className="nx-badge is-warn">Stock bajo</span> : null}
              </div>
              <button type="button" className="nx-iconbtn" aria-label={`Registrar movimiento de ${v.nombre}`} title="Registrar movimiento" onClick={() => setVarianteId(v.id)}>
                <PackagePlus size={20} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
      {varianteId && (
        <StockMovimientoDialog
          productoId={productoId}
          productoNombre={productoNombre}
          stockActual={stockTotal}
          variantes={variantes.map((v) => ({ id: v.id, nombre: v.nombre, stock: v.stock }))}
          varianteInicialId={varianteId}
          onClose={() => setVarianteId(null)}
        />
      )}
    </section>
  )
}
