"use client"

import { useState } from "react"
import { AlertCircle, Minus, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PosDialog } from "./PosDialog"
import { parseMonto, type LineaLibre } from "./types"

interface ArticuloLibreDialogProps {
  onAdd:   (linea: LineaLibre) => void
  onClose: () => void
}

/** Agrega al ticket un artículo que no está en inventario (sobrecargo). */
export function ArticuloLibreDialog({ onAdd, onClose }: ArticuloLibreDialogProps) {
  const [descripcion, setDescripcion] = useState("")
  const [precio,      setPrecio]      = useState("")
  const [cantidad,    setCantidad]    = useState(1)
  const [intentado,   setIntentado]   = useState(false)

  const valor = parseMonto(precio)
  const descErr = intentado && descripcion.trim().length < 2 ? "Describe el artículo (ej. Playera negra M)." : ""
  const precioErr =
    precio.trim() === "" ? (intentado ? "Escribe el precio." : "") :
    isNaN(valor) || valor < 0 ? "Escribe un precio válido." :
    valor > 10_000_000 ? "El precio es demasiado alto." : ""

  function agregar() {
    setIntentado(true)
    if (descripcion.trim().length < 2 || precio.trim() === "" || isNaN(valor) || valor < 0 || valor > 10_000_000) return
    onAdd({
      tipo:        "libre",
      id:          crypto.randomUUID(),
      descripcion: descripcion.trim().slice(0, 120),
      precio:      Math.round(valor * 100) / 100,
      cantidad,
    })
  }

  return (
    <PosDialog
      titulo="Artículo sin registrar"
      subtitulo="Se agrega a la venta sin tocar el inventario."
      onClose={onClose}
      onSubmit={agregar}
      pie={
        <>
          <button type="button" className="nx-btn nx-btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="nx-btn nx-btn-primary">
            Agregar{!isNaN(valor) && valor > 0 ? ` · ${formatCurrency(valor * cantidad)}` : ""}
          </button>
        </>
      }
    >
      <div className="nx-field">
        <label className="nx-label" htmlFor="pos-libre-desc">Descripción<i>*</i></label>
        <input
          id="pos-libre-desc"
          className={`nx-input${descErr ? " is-error" : ""}`}
          placeholder="Ej. Playera negra oversize M"
          maxLength={120}
          autoComplete="off"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          aria-invalid={!!descErr}
          aria-describedby={descErr ? "pos-libre-desc-err" : undefined}
        />
        {descErr && (
          <span className="nx-error" id="pos-libre-desc-err"><AlertCircle size={16} aria-hidden="true" /><span>{descErr}</span></span>
        )}
      </div>

      <div className="pos-libre-row">
        <div className="nx-field">
          <label className="nx-label" htmlFor="pos-libre-precio">Precio por pieza<i>*</i></label>
          <div className="nx-affix">
            <span className="pre">$</span>
            <input
              id="pos-libre-precio"
              className={`nx-input has-pre nx-num${precioErr ? " is-error" : ""}`}
              inputMode="decimal"
              placeholder="0.00"
              autoComplete="off"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              aria-invalid={!!precioErr}
              aria-describedby={precioErr ? "pos-libre-precio-err" : undefined}
            />
          </div>
        </div>
        <div className="nx-field">
          <span className="nx-label" id="pos-libre-cant">Cantidad</span>
          <div className="nx-step" role="group" aria-labelledby="pos-libre-cant">
            <button type="button" aria-label="Quitar uno" disabled={cantidad <= 1} onClick={() => setCantidad((c) => c - 1)}>
              <Minus size={20} aria-hidden="true" />
            </button>
            <output aria-live="polite">{cantidad}</output>
            <button type="button" aria-label="Agregar uno" disabled={cantidad >= 999} onClick={() => setCantidad((c) => c + 1)}>
              <Plus size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {precioErr && (
        <span className="nx-error" id="pos-libre-precio-err" style={{ marginTop: -4 }}>
          <AlertCircle size={16} aria-hidden="true" /><span>{precioErr}</span>
        </span>
      )}
    </PosDialog>
  )
}
