import type { Transaccion } from "@/types/finanzas.types"
import type { Categoria, MovimientoStock, Producto } from "@/types/inventario.types"

export const categorias: Categoria[] = [
  { id: "cat-1", nombre: "Fragancias", tipo: "producto", color: "#c9a84c" },
  { id: "cat-2", nombre: "Accesorios", tipo: "producto", color: "#4a6b9b" },
  { id: "cat-3", nombre: "Cuidado personal", tipo: "producto", color: "#4a9b6f" },
  { id: "cat-4", nombre: "Empaques premium", tipo: "producto", color: "#9b7a4a" },
  { id: "cat-5", nombre: "Ventas", tipo: "ingreso", color: "#4a9b6f" },
  { id: "cat-6", nombre: "Transporte", tipo: "gasto", color: "#9b7a4a" },
  { id: "cat-7", nombre: "Publicidad", tipo: "gasto", color: "#9b4a4a" },
]

export const productos: Producto[] = [
  {
    id: "prod-1",
    nombre: "Eau Noir 50ml",
    descripcion: "Fragancia premium de alta rotacion.",
    categoria: categorias[0],
    precioVenta: 1290,
    precioCosto: 640,
    stock: 18,
    stockMinimo: 8,
    imagenUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80",
    estatus: "disponible",
    sku: "NX-FRA-001",
    createdAt: "2026-04-05",
  },
  {
    id: "prod-2",
    nombre: "Set Atelier",
    descripcion: "Kit de regalo con empaque negro mate.",
    categoria: categorias[1],
    precioVenta: 890,
    precioCosto: 410,
    stock: 4,
    stockMinimo: 6,
    imagenUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80",
    estatus: "agotado",
    sku: "NX-ACC-014",
    createdAt: "2026-04-10",
  },
  {
    id: "prod-3",
    nombre: "Velvet Travel Case",
    descripcion: "Estuche para distribuidores y venta mostrador.",
    categoria: categorias[1],
    precioVenta: 540,
    precioCosto: 260,
    stock: 32,
    stockMinimo: 10,
    estatus: "disponible",
    sku: "NX-ACC-022",
    createdAt: "2026-04-18",
  },
  {
    id: "prod-4",
    nombre: "Silk Body Oil",
    descripcion: "Aceite corporal para venta premium.",
    categoria: categorias[2],
    precioVenta: 680,
    precioCosto: 290,
    stock: 14,
    stockMinimo: 7,
    estatus: "disponible",
    sku: "NX-CP-008",
    createdAt: "2026-04-20",
  },
  {
    id: "prod-5",
    nombre: "Caja Ritual Black",
    descripcion: "Empaque rigido para sets de regalo.",
    categoria: categorias[3],
    precioVenta: 180,
    precioCosto: 70,
    stock: 48,
    stockMinimo: 20,
    estatus: "disponible",
    sku: "NX-EMP-003",
    createdAt: "2026-04-23",
  },
]

export const movimientosStock: MovimientoStock[] = [
  { id: "mov-1", productoId: "prod-1", tipo: "entrada", cantidad: 20, stockAntes: 0, stockDespues: 20, notas: "Carga inicial", createdAt: "2026-04-05" },
  { id: "mov-2", productoId: "prod-1", tipo: "salida", cantidad: 2, stockAntes: 20, stockDespues: 18, notas: "Venta mostrador", createdAt: "2026-04-21" },
  { id: "mov-3", productoId: "prod-2", tipo: "entrada", cantidad: 6, stockAntes: 0, stockDespues: 6, notas: "Compra proveedor", createdAt: "2026-04-10" },
  { id: "mov-4", productoId: "prod-2", tipo: "salida", cantidad: 2, stockAntes: 6, stockDespues: 4, notas: "Paquete promocional", createdAt: "2026-04-22" },
]

export const transacciones: Transaccion[] = [
  { id: "trx-1", fecha: "2026-04-26", concepto: "Venta Eau Noir", categoria: categorias[4], cantidad: 3, formaPago: "tarjeta", monto: 3870, tipo: "ingreso", productoId: "prod-1" },
  { id: "trx-2", fecha: "2026-04-24", concepto: "Campana Meta Ads", categoria: categorias[6], cantidad: 1, formaPago: "tarjeta", monto: 1450, tipo: "gasto" },
  { id: "trx-3", fecha: "2026-04-22", concepto: "Envios regionales", categoria: categorias[5], cantidad: 1, formaPago: "transferencia", monto: 760, tipo: "gasto" },
  { id: "trx-4", fecha: "2026-04-18", concepto: "Venta Set Atelier", categoria: categorias[4], cantidad: 4, formaPago: "efectivo", monto: 3560, tipo: "ingreso", productoId: "prod-2" },
  { id: "trx-5", fecha: "2026-04-15", concepto: "Anticipo distribuidor", categoria: categorias[4], cantidad: 1, formaPago: "transferencia", monto: 6200, tipo: "ingreso" },
]

export const graficaMensual = [
  { nombre: "Nov", ingresos: 18000, gastos: 9200 },
  { nombre: "Dic", ingresos: 24200, gastos: 11800 },
  { nombre: "Ene", ingresos: 22100, gastos: 10700 },
  { nombre: "Feb", ingresos: 28600, gastos: 12200 },
  { nombre: "Mar", ingresos: 31200, gastos: 14600 },
  { nombre: "Abr", ingresos: 34700, gastos: 15900 },
]
