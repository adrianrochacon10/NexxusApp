import { Minus, Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { stockDisponible, type LineaTicket } from "./types"

interface TicketLineaProps {
  linea:    LineaTicket
  onDelta:  (delta: number) => void
  onQuitar: () => void
}

export function TicketLinea({ linea, onDelta, onQuitar }: TicketLineaProps) {
  const { producto, variante, cantidad } = linea
  const max     = stockDisponible(producto, variante)
  const enTope  = cantidad >= max
  const nombre  = variante ? `${producto.nombre}, talla ${variante.nombre}` : producto.nombre

  return (
    <div className="pos-line nx-col gap-8">
      <div className="nx-row gap-12">
        <div className="grow">
          <div className="t-h3 nx-ellipsis">{producto.nombre}</div>
          <div className="t-small nx-num">
            {variante ? `Talla ${variante.nombre} · ` : ""}{formatCurrency(producto.precio_venta)} c/u
          </div>
        </div>
        <div className="nx-num t-h3">{formatCurrency(producto.precio_venta * cantidad)}</div>
      </div>
      <div className="nx-row gap-8">
        <div className="nx-step" role="group" aria-label={`Cantidad de ${nombre}`}>
          <button type="button" aria-label="Quitar uno" disabled={cantidad <= 1} onClick={() => onDelta(-1)}>
            <Minus size={20} aria-hidden="true" />
          </button>
          <output aria-live="polite">{cantidad}</output>
          <button type="button" aria-label="Agregar uno" disabled={enTope} onClick={() => onDelta(1)}>
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>
        <span className="grow pos-line-limit">{enTope ? `Máx. ${max} en stock` : ""}</span>
        <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon" aria-label={`Quitar ${nombre} del ticket`} onClick={onQuitar}>
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
