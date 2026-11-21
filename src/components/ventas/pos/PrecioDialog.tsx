"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PosDialog } from "./PosDialog"
import { parseMonto, type AjustePrecio, type LineaInventario } from "./types"

const MOTIVOS = ["Buen Fin", "Descuento cliente frecuente", "Precio de mayoreo", "Defecto en la prenda"]

interface PrecioDialogProps {
  linea:   LineaInventario
  onSave:  (ajuste: AjustePrecio | undefined) => void
  onClose: () => void
}

/** Cambia el precio unitario de una línea del ticket y pide el motivo. */
export function PrecioDialog({ linea, onSave, onClose }: PrecioDialogProps) {
  const lista = linea.producto.precio_venta
  const [precio, setPrecio] = useState(linea.ajuste ? String(linea.ajuste.precio) : "")
  const [motivo, setMotivo] = useState(linea.ajuste?.motivo ?? "")
  const [intentado, setIntentado] = useState(false)

  const valor    = parseMonto(precio)
  const cambia   = !isNaN(valor) && Math.round(valor * 100) !== Math.round(lista * 100)
  const precioErr =
    precio.trim() === "" ? (intentado ? "Escribe el nuevo precio." : "") :
    isNaN(valor)         ? "Escribe un precio válido." :
    valor < 0            ? "El precio no puede ser negativo." :
    valor > 10_000_000   ? "El precio es demasiado alto." : ""
  const motivoErr = intentado && cambia && motivo.trim().length < 3 ? "Escribe por qué cambió el precio." : ""

  const diferencia = cambia && !precioErr ? valor - lista : 0
  const nombre = linea.variante ? `${linea.producto.nombre} · Talla ${linea.variante.nombre}` : linea.producto.nombre

  function guardar() {
    setIntentado(true)
    if (precio.trim() === "" || precioErr) return
    if (!cambia) { onSave(undefined); return }
    if (motivo.trim().length < 3) return
    onSave({ precio: Math.round(valor * 100) / 100, motivo: motivo.trim() })
  }

  return (
    <PosDialog
      titulo="Cambiar precio"
      subtitulo={<span className="nx-num">{nombre} · Lista {formatCurrency(lista)}</span>}
      onClose={onClose}
      onSubmit={guardar}
      pie={
        <>
          {linea.ajuste && (
            <button type="button" className="nx-btn nx-btn-ghost" style={{ marginRight: "auto" }} onClick={() => onSave(undefined)}>
              Precio de lista
            </button>
          )}
          <button type="button" className="nx-btn nx-btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="nx-btn nx-btn-primary">Aplicar</button>
        </>
      }
    >
      <div className="nx-field">
        <label className="nx-label" htmlFor="pos-precio">Nuevo precio por pieza</label>
        <div className="nx-affix">
          <span className="pre">$</span>
          <input
            id="pos-precio"
            className={`nx-input has-pre nx-num${precioErr ? " is-error" : ""}`}
            inputMode="decimal"
            placeholder={lista.toFixed(2)}
            autoComplete="off"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            aria-invalid={!!precioErr}
            aria-describedby="pos-precio-msg"
          />
        </div>
        {precioErr ? (
          <span className="nx-error" id="pos-precio-msg"><AlertCircle size={16} aria-hidden="true" /><span>{precioErr}</span></span>
        ) : (
          <span className="nx-hint nx-num" id="pos-precio-msg">
            {diferencia < 0
              ? `Descuento de ${formatCurrency(-diferencia)} por pieza (${Math.round((-diferencia / (lista || 1)) * 100)}%)`
              : diferencia > 0
                ? `${formatCurrency(diferencia)} arriba del precio de lista`
                : "Igual al precio de lista"}
          </span>
        )}
      </div>

      <div className="nx-field">
        <label className="nx-label" htmlFor="pos-motivo">Motivo del cambio{cambia && <i>*</i>}</label>
        <input
          id="pos-motivo"
          className={`nx-input${motivoErr ? " is-error" : ""}`}
          placeholder="Ej. Buen Fin, cliente frecuente…"
          maxLength={200}
          autoComplete="off"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          aria-invalid={!!motivoErr}
          aria-describedby={motivoErr ? "pos-motivo-err" : undefined}
        />
        {motivoErr && (
          <span className="nx-error" id="pos-motivo-err"><AlertCircle size={16} aria-hidden="true" /><span>{motivoErr}</span></span>
        )}
        <div className="pos-motivos" role="group" aria-label="Motivos frecuentes">
          {MOTIVOS.map((m) => (
            <button
              key={m}
              type="button"
              className={`nx-chip${motivo === m ? " is-on" : ""}`}
              aria-pressed={motivo === m}
              onClick={() => setMotivo(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </PosDialog>
  )
}
