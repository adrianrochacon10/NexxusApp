import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  categorias as categoriasDemo,
  productos as productosDemo,
  ventas as ventasDemo,
  transacciones as transaccionesDemo,
} from "@/lib/demo-data"
import type { Categoria, Producto, ProductoVariante } from "@/types/inventario.types"
import type { Abono, Venta } from "@/types/ventas.types"
import type { Transaccion, FormaPago } from "@/types/finanzas.types"

// ─── Tipos de entrada ──────────────────────────────────────────────────────────

export interface NuevaCategoriaInput {
  nombre: string
  color: string
  atributosBase: string[]
}

export interface NuevaVarianteInput {
  nombre: string
  sku?: string
  atributos: Record<string, string>
  stock: number
  stockMinimo: number
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
  variantes?: NuevaVarianteInput[]
}

export interface NuevaVentaInput {
  lineas: {
    productoId: string
    varianteId?: string
    productoNombre: string
    varianteNombre?: string
    cantidad: number
    precioUnitario: number
  }[]
  pagoInicial?: {
    monto: number
    formaPago: FormaPago
  }
  cliente?: {
    nombre: string
    telefono?: string
  }
  notas?: string
}

export interface NuevoAbonoInput {
  ventaId: string
  monto: number
  formaPago: "efectivo" | "tarjeta" | "transferencia"
  notas?: string
}

export interface CancelacionInput {
  ventaId: string
  motivo: string
}

// ─── Estado del store ──────────────────────────────────────────────────────────

interface AppStore {
  categorias:    Categoria[]
  productos:     Producto[]
  ventas:        Venta[]
  transacciones: Transaccion[]

  // Categorías
  crearCategoria:    (input: NuevaCategoriaInput) => void
  eliminarCategoria: (id: string) => void

  // Productos
  crearProducto:     (input: NuevoProductoInput) => void
  actualizarProducto:(id: string, cambios: Partial<NuevoProductoInput>) => void
  eliminarProducto:  (id: string) => void

  // Variantes
  agregarVariante:   (productoId: string, variante: NuevaVarianteInput) => void
  actualizarVariante:(productoId: string, varianteId: string, cambios: Partial<NuevaVarianteInput>) => void
  eliminarVariante:  (productoId: string, varianteId: string) => void

  // Ventas
  registrarVenta:     (input: NuevaVentaInput) => Venta
  registrarAbono:     (input: NuevoAbonoInput) => void
  cancelarVenta:      (input: CancelacionInput) => void

  // Reset
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

function calcularEstatusVariante(stock: number, stockMinimo: number): ProductoVariante["estatus"] {
  if (stock === 0) return "agotado"
  return "disponible"
}

function calcularStockProducto(variantes: ProductoVariante[]): number {
  return variantes.reduce((s, v) => s + v.stock, 0)
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
        set((s) => ({ categorias: s.categorias.filter((c) => c.id !== id) }))
      },

      // ── Productos ───────────────────────────────────────────────────────────

      crearProducto(input) {
        const categoria = get().categorias.find((c) => c.id === input.categoriaId)
        if (!categoria) return

        const variantesNuevas: ProductoVariante[] = (input.variantes ?? []).map((v) => ({
          id:          generarId("var"),
          productoId:  generarId("prod"),
          nombre:      v.nombre,
          sku:         v.sku,
          atributos:   v.atributos,
          stock:       v.stock,
          stockMinimo: v.stockMinimo,
          estatus:     calcularEstatusVariante(v.stock, v.stockMinimo),
        }))

        const tieneVariantes = variantesNuevas.length > 0
        const stockFinal     = tieneVariantes ? calcularStockProducto(variantesNuevas) : input.stock

        const nuevoId = generarId("prod")
        const variantesConId = variantesNuevas.map((v) => ({ ...v, productoId: nuevoId }))

        const nuevo: Producto = {
          id:          nuevoId,
          nombre:      input.nombre,
          descripcion: input.descripcion,
          categoria,
          precioVenta: input.precioVenta,
          precioCosto: input.precioCosto,
          stock:       stockFinal,
          stockMinimo: tieneVariantes ? variantesNuevas.reduce((s, v) => s + v.stockMinimo, 0) : input.stockMinimo,
          estatus:     tieneVariantes ? (stockFinal === 0 ? "agotado" : "disponible") : input.estatus,
          imagenUrl:   input.imagenUrl,
          sku:         input.sku,
          atributos:   input.atributos,
          variantes:   variantesConId.length > 0 ? variantesConId : undefined,
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

      // ── Variantes ───────────────────────────────────────────────────────────

      agregarVariante(productoId, variante) {
        set((s) => ({
          productos: s.productos.map((p) => {
            if (p.id !== productoId) return p
            const nueva: ProductoVariante = {
              id:          generarId("var"),
              productoId,
              nombre:      variante.nombre,
              sku:         variante.sku,
              atributos:   variante.atributos,
              stock:       variante.stock,
              stockMinimo: variante.stockMinimo,
              estatus:     calcularEstatusVariante(variante.stock, variante.stockMinimo),
            }
            const variantes = [...(p.variantes ?? []), nueva]
            return { ...p, variantes, stock: calcularStockProducto(variantes) }
          }),
        }))
      },

      actualizarVariante(productoId, varianteId, cambios) {
        set((s) => ({
          productos: s.productos.map((p) => {
            if (p.id !== productoId) return p
            const variantes = (p.variantes ?? []).map((v) => {
              if (v.id !== varianteId) return v
              const updated = { ...v, ...cambios }
              return { ...updated, estatus: calcularEstatusVariante(updated.stock, updated.stockMinimo) }
            })
            return { ...p, variantes, stock: calcularStockProducto(variantes) }
          }),
        }))
      },

      eliminarVariante(productoId, varianteId) {
        set((s) => ({
          productos: s.productos.map((p) => {
            if (p.id !== productoId) return p
            const variantes = (p.variantes ?? []).filter((v) => v.id !== varianteId)
            return { ...p, variantes, stock: calcularStockProducto(variantes) }
          }),
        }))
      },

      // ── Ventas ──────────────────────────────────────────────────────────────

      registrarVenta(input) {
        const { ventas, productos, transacciones, categorias } = get()

        const lineas = input.lineas.map((l) => ({
          ...l,
          subtotal: l.cantidad * l.precioUnitario,
        }))
        const total = lineas.reduce((s, l) => s + l.subtotal, 0)

        const montoPagado    = input.pagoInicial?.monto ?? 0
        const saldoPendiente = Math.max(0, total - montoPagado)
        const estatusPago    = saldoPendiente === 0 ? "pagada" : montoPagado > 0 ? "parcial" : "pendiente"
        const formaPago      = input.pagoInicial?.formaPago ?? "adeudo"

        const nuevaVenta: Venta = {
          id:               generarId("venta"),
          folio:            generarFolio(ventas),
          fecha:            fechaHoy(),
          hora:             horaAhora(),
          lineas,
          total,
          montoPagado,
          saldoPendiente,
          estatusPago:      estatusPago as Venta["estatusPago"],
          estatusOperativo: "activa",
          abonos:           [],
          formaPago,
          cliente:          input.cliente,
          notas:            input.notas,
        }

        // Descontar stock (por variante si aplica, si no por producto)
        const productosActualizados = productos.map((p) => {
          const lineasProducto = input.lineas.filter((l) => l.productoId === p.id)
          if (lineasProducto.length === 0) return p

          // Si el producto tiene variantes, descontar por variante
          if (p.variantes && p.variantes.length > 0) {
            const variantes = p.variantes.map((v) => {
              const linea = lineasProducto.find((l) => l.varianteId === v.id)
              if (!linea) return v
              const nuevoStock = Math.max(0, v.stock - linea.cantidad)
              return { ...v, stock: nuevoStock, estatus: nuevoStock === 0 ? ("agotado" as const) : v.estatus }
            })
            const stockTotal = calcularStockProducto(variantes)
            return { ...p, variantes, stock: stockTotal, estatus: stockTotal === 0 ? ("agotado" as const) : p.estatus }
          }

          // Sin variantes: descontar stock directo
          const totalCantidad = lineasProducto.reduce((s, l) => s + l.cantidad, 0)
          const nuevoStock    = Math.max(0, p.stock - totalCantidad)
          return { ...p, stock: nuevoStock, estatus: nuevoStock === 0 ? ("agotado" as const) : p.estatus }
        })

        // Registrar transacción si hubo pago inicial
        const nuevasTrx: Transaccion[] = []
        if (montoPagado > 0) {
          const catVentas = categorias.find((c) => c.tipo === "ingreso") ?? categorias[0]
          nuevasTrx.push({
            id:        generarId("trx"),
            fecha:     fechaHoy(),
            concepto:  `Venta ${nuevaVenta.folio}`,
            categoria: catVentas,
            cantidad:  lineas.reduce((s, l) => s + l.cantidad, 0),
            formaPago,
            monto:     montoPagado,
            tipo:      "ingreso",
          })
        }

        set({
          ventas:        [nuevaVenta, ...ventas],
          productos:     productosActualizados,
          transacciones: [...nuevasTrx, ...transacciones],
        })

        return nuevaVenta
      },

      registrarAbono(input) {
        const { ventas, transacciones, categorias } = get()
        const venta = ventas.find((v) => v.id === input.ventaId)
        if (!venta || venta.estatusOperativo === "cancelada") return

        const nuevoAbono: Abono = {
          id:        generarId("abono"),
          ventaId:   input.ventaId,
          monto:     input.monto,
          formaPago: input.formaPago,
          fecha:     fechaHoy(),
          hora:      horaAhora(),
          notas:     input.notas,
        }

        const nuevoMontoPagado    = venta.montoPagado + input.monto
        const nuevoSaldo          = Math.max(0, venta.total - nuevoMontoPagado)
        const nuevoEstatusPago    = nuevoSaldo === 0 ? "pagada" : "parcial"

        const catVentas = categorias.find((c) => c.tipo === "ingreso") ?? categorias[0]
        const nuevaTrx: Transaccion = {
          id:        generarId("trx"),
          fecha:     fechaHoy(),
          concepto:  `Abono ${venta.folio} — ${input.formaPago}`,
          categoria: catVentas,
          cantidad:  1,
          formaPago: input.formaPago,
          monto:     input.monto,
          tipo:      "ingreso",
        }

        set({
          ventas: ventas.map((v) =>
            v.id !== input.ventaId ? v : {
              ...v,
              abonos:          [...v.abonos, nuevoAbono],
              montoPagado:     nuevoMontoPagado,
              saldoPendiente:  nuevoSaldo,
              estatusPago:     nuevoEstatusPago as Venta["estatusPago"],
            }
          ),
          transacciones: [nuevaTrx, ...transacciones],
        })
      },

      cancelarVenta(input) {
        const { ventas } = get()
        set({
          ventas: ventas.map((v) =>
            v.id !== input.ventaId ? v : {
              ...v,
              estatusOperativo:  "cancelada" as const,
              motivoCancelacion: input.motivo,
            }
          ),
        })
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
    { name: "nexxuz-demo-store-v2" },
  ),
)
