"use client"

import { useState } from "react"
import { PackagePlus } from "lucide-react"
import { actualizarStock } from "@/actions/inventario"
import type { TipoMovimientoStock } from "@/types/inventario.types"

interface StockActualizadorProps {
  productoId: string
}

export function StockActualizador({ productoId }: StockActualizadorProps) {
  const [tipo, setTipo] = useState<TipoMovimientoStock>("entrada")
  const [cantidad, setCantidad] = useState(1)
  const [notas, setNotas] = useState("")

  return (
    <form
      className="surface"
      action={async () => {
        await actualizarStock({ productoId, tipo, cantidad, notas })
      }}
      style={{ display: "grid", gap: 12, padding: 16 }}
    >
      <strong>Actualizar stock</strong>
      <select className="input" value={tipo} onChange={(event) => setTipo(event.target.value as TipoMovimientoStock)} aria-label="Tipo de movimiento">
        <option value="entrada">Entrada</option>
        <option value="salida">Salida</option>
        <option value="ajuste">Ajuste</option>
      </select>
      <input className="input" type="number" min={1} value={cantidad} onChange={(event) => setCantidad(Number(event.target.value))} aria-label="Cantidad" />
      <input className="input" value={notas} onChange={(event) => setNotas(event.target.value)} placeholder="Notas" aria-label="Notas" />
      <button className="button button-primary" type="submit">
        <PackagePlus size={17} aria-hidden="true" />
        Registrar movimiento
      </button>
    </form>
  )
}
