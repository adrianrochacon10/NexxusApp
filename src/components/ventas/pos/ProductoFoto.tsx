import Image from "next/image"
import { getInitials } from "@/lib/utils"

interface ProductoFotoProps {
  nombre:    string
  imagenUrl: string | null
  /** Ancho aproximado en px para que next/image elija el tamaño correcto. */
  sizes:     string
  className?: string
}

/** Foto del producto que llena su contenedor; si no hay foto, muestra sus iniciales. */
export function ProductoFoto({ nombre, imagenUrl, sizes, className = "" }: ProductoFotoProps) {
  return (
    <span className={`pos-foto ${className}`} aria-hidden="true">
      {imagenUrl
        ? <Image src={imagenUrl} alt="" fill sizes={sizes} className="pos-foto-img" />
        : <span className="pos-foto-ini">{getInitials(nombre)}</span>}
    </span>
  )
}
