"use client"

import { DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"

export function AbonoRapidoBtn({ ventaId, saldoPendiente }: { ventaId: string; saldoPendiente: number }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className="button button-primary"
      onClick={() => router.push(`/ventas/${ventaId}`)}
      style={{ fontSize: 13, padding: "0 14px", whiteSpace: "nowrap" }}
    >
      <DollarSign size={14} aria-hidden="true" />
      Abonar
    </button>
  )
}
