/**
 * STORE DE PRUEBA — Zustand + localStorage
 *
 * Este store es temporal para desarrollo sin backend.
 * Cuando se integre Supabase, cada acción (crearProducto, etc.)
 * se reemplaza por una llamada al server action correspondiente
 * y este archivo se elimina.
 *
 * Reemplazos futuros:
 *   crearCategoria  → actions/inventario.ts → crearCategoria()
 *   crearProducto   → actions/inventario.ts → crearProducto()
 *   registrarVenta  → actions/ventas.ts     → registrarVenta()
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  categorias as categoriasDemo,
  productos as productosDemo,
  ventas as ventasDemo,
  transacciones as transaccionesDemo,
} from "@/lib/demo-data"
import type { Categoria, Producto } from "@/types/inventario.types"
import type { Venta } from "@/types/ventas.types"
import type { Transaccion } from "@/types/finanzas.types"

// ─── Tipos de entrada ──────────────────────────────────────────────────────────

export interface NuevaCategoriaInput {
  nombre: string
  color: string
  atributosBase: string[]
}

export interface NuevoProductoInput {
  nombre: string
  categoriaId: string
  descripcion?: string
  sku: string
  precioVenta: number
  precioCosto: number
  stock: number
  stockMinimo: number
  estatus: "disponible" | "pausado" | "agotado"
  imagenUrl?: string
  atributos?: Record<string, string>
}

export interface NuevaVentaInput {
  lineas: { productoId: string; productoNombre: string; cantidad: number; precioUnitario: number }[]
  formaPago: "efectivo" | "tarjeta" | "transferencia" | "adeudo"
}

// ─── Estado del store ──────────────────────────────────────────────────────────

interface AppStore {
  categorias:    Categoria[]
  productos:     Producto[]
  ventas:        Venta[]
  transacciones: Transaccion[]

  // Categorías
  crearCategoria: (input: NuevaCategoriaInput) => void
  eliminarCategoria: (id: string) => void

  // Productos
  crearProducto: (input: NuevoProductoInput) => void
  actualizarProducto: (id: string, cambios: Partial<NuevoProductoInput>) => void
  eliminarProducto: (id: string) => void

  // Ventas
  registrarVenta: (input: NuevaVentaInput) => Venta

  // Reset (útil para pruebas)
  resetDemoData: () => void
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generarId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function generarFolio(ventas: Venta[]) {
  const n = ventas.length + 1
  return `VNT-${String(n).padStart(4, "0")}`
}

function fechaHoy() {
  return new Date().toISOString().split("T")[0]
}

function horaAhora() {
  return new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      categorias:    categoriasDemo,
      productos:     productosDemo,
      ventas:        ventasDemo,
      transacciones: transaccionesDemo,

      // ── Categorías ──────────────────────────────────────────────────────────

      crearCategoria(input) {
        const nueva: Categoria = {
          id:            generarId("cat"),
          nombre:        input.nombre,
          tipo:          "producto",
          color:         input.color,
          atributosBase: input.atributosBase.filter(Boolean),
        }
        set((s) => ({ categorias: [...s.categorias, nueva] }))
      },

      eliminarCategoria(id) {
        set((s) => ({
          categorias: s.categorias.filter((c) => c.id !== id),
        }))
      },

      // ── Productos ───────────────────────────────────────────────────────────

      crearProducto(input) {
        const categoria = get().categorias.find((c) => c.id === input.categoriaId)
        if (!categoria) return

        const nuevo: Producto = {
          id:          generarId("prod"),
          nombre:      input.nombre,
          descripcion: input.descripcion,
          categoria,
          precioVenta: input.precioVenta,
          precioCosto: input.precioCosto,
          stock:       input.stock,
          stockMinimo: input.stockMinimo,
          estatus:     input.estatus,
          imagenUrl:   input.imagenUrl,
          sku:         input.sku,
          atributos:   input.atributos,
          createdAt:   fechaHoy(),
        }
        set((s) => ({ productos: [...s.productos, nuevo] }))
      },

      actualizarProducto(id, cambios) {
        set((s) => ({
          productos: s.productos.map((p) => {
            if (p.id !== id) return p
            const categoria = cambios.categoriaId
              ? (s.categorias.find((c) => c.id === cambios.categoriaId) ?? p.categoria)
              : p.categoria
            return { ...p, ...cambios, categoria }
          }),
        }))
      },

      eliminarProducto(id) {
        set((s) => ({ productos: s.productos.filter((p) => p.id !== id) }))
      },

      // ── Ventas ──────────────────────────────────────────────────────────────

      registrarVenta(input) {
        const { ventas, productos, transacciones, categorias } = get()

        const lineas = input.lineas.map((l) => ({
          ...l,
          subtotal: l.cantidad * l.precioUnitario,
        }))
        const total = lineas.reduce((s, l) => s + l.subtotal, 0)

        const nuevaVenta: Venta = {
          id:        generarId("venta"),
          folio:     generarFolio(ventas),
          fecha:     fechaHoy(),
          hora:      horaAhora(),
          lineas,
          total,
          formaPago: input.formaPago,
        }

        // Descontar stock de cada producto
        const productosActualizados = productos.map((p) => {
          const linea = input.lineas.find((l) => l.productoId === p.id)
          if (!linea) return p
          const nuevoStock = Math.max(0, p.stock - linea.cantidad)
          return {
            ...p,
            stock:   nuevoStock,
            estatus: nuevoStock === 0 ? ("agotado" as const) : p.estatus,
          }
        })

        // Registrar transacción de ingreso
        const catVentas = categorias.find((c) => c.tipo === "ingreso") ?? categorias[0]
        const nuevaTrx: Transaccion = {
          id:        generarId("trx"),
          fecha:     fechaHoy(),
          concepto:  `Venta ${nuevaVenta.folio}`,
          categoria: catVentas,
          cantidad:  lineas.reduce((s, l) => s + l.cantidad, 0),
          formaPago: input.formaPago,
          monto:     total,
          tipo:      "ingreso",
        }

        set({
          ventas:        [nuevaVenta, ...ventas],
          productos:     productosActualizados,
          transacciones: [nuevaTrx, ...transacciones],
        })

        return nuevaVenta
      },

      // ── Reset ───────────────────────────────────────────────────────────────

      resetDemoData() {
        set({
          categorias:    categoriasDemo,
          productos:     productosDemo,
          ventas:        ventasDemo,
          transacciones: transaccionesDemo,
        })
      },
    }),
    {
      name: "nexxuz-demo-store", // clave en localStorage
    },
  ),
)
