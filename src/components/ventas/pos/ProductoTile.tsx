import { formatCurrency, getInitials } from "@/lib/utils"
import { nivelStock, stockTotal, type ProductoPos } from "./types"

interface ProductoTileProps {
  producto: ProductoPos
  onPick:   (producto: ProductoPos) => void
}

/** Tile de catálogo (escritorio/tablet) que se vuelve fila de lista en móvil vía pos.css. */
export function ProductoTile({ producto, onPick }: ProductoTileProps) {
  const total  = stockTotal(producto)
  const nivel  = nivelStock(total, producto.stock_minimo)
  const agotado = nivel === "out"
  const precio = formatCurrency(producto.precio_venta)

  const variantesTxt = producto.variantes.length > 0
    ? `Tallas ${producto.variantes.map((v) => v.nombre).join(" · ")}`
    : "Talla única"

  const badge =
    nivel === "out" ? { cls: "is-bad",  txt: "Agotado" } :
    nivel === "low" ? { cls: "is-warn", txt: `Quedan ${total}` } :
                      { cls: "is-ok",   txt: `${total} disp.` }

  return (
    <button
      type="button"
      className={`nx-tile pos-tile${agotado ? " is-out" : nivel === "low" ? " is-low" : ""}`}
      disabled={agotado}
      onClick={() => onPick(producto)}
      aria-label={`${producto.nombre}, ${precio}${agotado ? ", agotado" : nivel === "low" ? `, quedan ${total}` : ""}`}
    >
      <span className="pos-tile-sku nx-mono ink3">{producto.sku ?? " "}</span>
      <span className="pos-tile-av nx-avatar" aria-hidden="true">{getInitials(producto.nombre)}</span>
      <span className="pos-tile-nm nm t-h3">{producto.nombre}</span>
      <span className="pos-tile-vh t-small">
        {variantesTxt}
        {producto.sku && <span className="pos-tile-vh-sku"> · {producto.sku}</span>}
      </span>
      <span className="pos-tile-pr pr nx-num t-h3">{precio}</span>
      <span className={`pos-tile-bd nx-badge ${badge.cls}`}>{badge.txt}</span>
    </button>
  )
}
