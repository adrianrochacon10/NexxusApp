import { Minus, PackagePlus, Plus, Tag, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { ProductoFoto } from "./ProductoFoto"
import { maximoLinea, precioLinea, type LineaTicket } from "./types"

interface TicketLineaProps {
  linea:         LineaTicket
  onDelta:       (delta: number) => void
  onQuitar:      () => void
  onEditarPrecio?: () => void
}

export function TicketLinea({ linea, onDelta, onQuitar, onEditarPrecio }: TicketLineaProps) {
  const { cantidad } = linea
  const libre   = linea.tipo === "libre"
  const max     = maximoLinea(linea)
  const enTope  = cantidad >= max
  const precio  = precioLinea(linea)
  const titulo  = libre ? linea.descripcion : linea.producto.nombre
  const nombre  = libre ? linea.descripcion : linea.variante ? `${titulo}, talla ${linea.variante.nombre}` : titulo
  const ajuste  = libre ? undefined : linea.ajuste
  const lista   = libre ? undefined : linea.producto.precio_venta

  return (
    <div className="pos-line nx-col gap-8">
      <div className="nx-row gap-12">
        {libre ? (
          <div className="pos-foto pos-line-ph" aria-hidden="true"><PackagePlus size={20} /></div>
        ) : (
          <ProductoFoto
            nombre={linea.producto.nombre}
            imagenUrl={linea.producto.imagen_url}
            sizes="44px"
            className="pos-line-ph"
          />
        )}
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="t-h3 nx-ellipsis">{titulo}</div>
          <div className="t-small nx-num">
            {libre ? "Sin registrar · " : linea.variante ? `Talla ${linea.variante.nombre} · ` : ""}
            {ajuste && lista !== undefined && <s className="pos-line-lista">{formatCurrency(lista)}</s>}
            {formatCurrency(precio)} c/u
          </div>
          {ajuste && <div className="pos-line-motivo nx-ellipsis" title={ajuste.motivo}>{ajuste.motivo}</div>}
        </div>
        <div className="nx-num t-h3">{formatCurrency(precio * cantidad)}</div>
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
        <span className="grow pos-line-limit">{enTope && !libre ? `Máx. ${max} en stock` : ""}</span>
        {onEditarPrecio && (
          <button
            type="button"
            className={`nx-btn nx-btn-sm ${ajuste ? "nx-btn-secondary pos-line-precio is-on" : "nx-btn-ghost pos-line-precio"}`}
            aria-label={`Cambiar precio de ${nombre}`}
            onClick={onEditarPrecio}
          >
            <Tag size={16} aria-hidden="true" />
            <span>{ajuste ? "Ajustado" : "Precio"}</span>
          </button>
        )}
        <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon" aria-label={`Quitar ${nombre} del ticket`} onClick={onQuitar}>
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
