import Image from "next/image"
import type { CSSProperties } from "react"
import { iniciales } from "@/components/inventario/inventario-utils"

interface ProductoThumbProps {
  nombre:     string
  imagenUrl?: string | null
  size?:      number
  className?: string
  style?:     CSSProperties
}

/** Miniatura cuadrada: foto del producto o sus iniciales. */
export function ProductoThumb({ nombre, imagenUrl, size = 44, className = "", style }: ProductoThumbProps) {
  return (
    <div className={`nx-thumb ${className}`} style={{ width: size, height: size, ...style }} aria-hidden="true">
      {imagenUrl ? (
        <Image src={imagenUrl} alt="" width={size} height={size} className="inv-thumb-img" />
      ) : (
        iniciales(nombre)
      )}
    </div>
  )
}
