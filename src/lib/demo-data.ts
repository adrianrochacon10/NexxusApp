import type { Transaccion } from "@/types/finanzas.types"
import type { Categoria, MovimientoStock, Producto } from "@/types/inventario.types"
import type { Venta } from "@/types/ventas.types"

// ─── Categorías ────────────────────────────────────────────────────────────────

export const categorias: Categoria[] = [
  {
    id: "cat-playeras",
    nombre: "Playeras",
    tipo: "producto",
    color: "#4a6b9b",
    atributosBase: ["Talla", "Color", "Marca", "Tipo de tela"],
  },
  {
    id: "cat-perfumes",
    nombre: "Perfumes",
    tipo: "producto",
    color: "#c9a84c",
    atributosBase: ["Mililitros", "Aroma", "Género", "Marca"],
  },
  { id: "cat-ventas",      nombre: "Ventas",      tipo: "ingreso", color: "#4a9b6f" },
  { id: "cat-transporte",  nombre: "Transporte",  tipo: "gasto",   color: "#9b7a4a" },
  { id: "cat-publicidad",  nombre: "Publicidad",  tipo: "gasto",   color: "#9b4a4a" },
  { id: "cat-inventario",  nombre: "Inventario",  tipo: "gasto",   color: "#4a6b9b" },
]

// ─── Productos ─────────────────────────────────────────────────────────────────

export const productos: Producto[] = [
  {
    id: "prod-1",
    nombre: "Playera Básica Blanca",
    descripcion: "Playera de algodón 100% corte regular, alta rotación.",
    categoria: categorias[0],
    precioVenta: 280,
    precioCosto: 120,
    stock: 24,
    stockMinimo: 10,
    imagenUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80",
    estatus: "disponible",
    sku: "PLA-000001",
    atributos: { Talla: "M", Color: "Blanco", Marca: "Nexxuz", "Tipo de tela": "Algodón" },
    createdAt: "2026-04-01",
  },
  {
    id: "prod-2",
    nombre: "Playera Básica Negra",
    descripcion: "Playera de algodón 100% corte regular.",
    categoria: categorias[0],
    precioVenta: 280,
    precioCosto: 120,
    stock: 18,
    stockMinimo: 10,
    imagenUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80",
    estatus: "disponible",
    sku: "PLA-000002",
    atributos: { Talla: "L", Color: "Negro", Marca: "Nexxuz", "Tipo de tela": "Algodón" },
    createdAt: "2026-04-01",
  },
  {
    id: "prod-3",
    nombre: "Playera Premium Oversized",
    descripcion: "Corte oversized, tela french terry.",
    categoria: categorias[0],
    precioVenta: 450,
    precioCosto: 210,
    stock: 6,
    stockMinimo: 8,
    imagenUrl: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=600&q=80",
    estatus: "disponible",
    sku: "PLA-000003",
    atributos: { Talla: "XL", Color: "Gris", Marca: "Nexxuz", "Tipo de tela": "French Terry" },
    createdAt: "2026-04-10",
  },
  {
    id: "prod-4",
    nombre: "Playera Gráfica Vol.1",
    descripcion: "Estampado exclusivo colección primavera.",
    categoria: categorias[0],
    precioVenta: 380,
    precioCosto: 160,
    stock: 0,
    stockMinimo: 5,
    estatus: "agotado",
    sku: "PLA-000004",
    atributos: { Talla: "S", Color: "Blanco", Marca: "Nexxuz", "Tipo de tela": "Algodón" },
    createdAt: "2026-04-15",
  },
  {
    id: "prod-5",
    nombre: "Noir Intense 100ml",
    descripcion: "Fragancia masculina con notas de oud y cedro.",
    categoria: categorias[1],
    precioVenta: 1490,
    precioCosto: 680,
    stock: 14,
    stockMinimo: 5,
    imagenUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80",
    estatus: "disponible",
    sku: "PER-000001",
    atributos: { Mililitros: 100, Aroma: "Amaderado", Género: "Masculino", Marca: "Maison N" },
    createdAt: "2026-04-05",
  },
  {
    id: "prod-6",
    nombre: "Rose Gold 50ml",
    descripcion: "Fragancia femenina floral con notas de rosa y almizcle.",
    categoria: categorias[1],
    precioVenta: 990,
    precioCosto: 420,
    stock: 9,
    stockMinimo: 4,
    imagenUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80",
    estatus: "disponible",
    sku: "PER-000002",
    atributos: { Mililitros: 50, Aroma: "Floral", Género: "Femenino", Marca: "Maison N" },
    createdAt: "2026-04-05",
  },
  {
    id: "prod-7",
    nombre: "Aqua Sport 200ml",
    descripcion: "Fragancia unisex fresca para uso diario.",
    categoria: categorias[1],
    precioVenta: 750,
    precioCosto: 310,
    stock: 3,
    stockMinimo: 6,
    imagenUrl: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=600&q=80",
    estatus: "disponible",
    sku: "PER-000003",
    atributos: { Mililitros: 200, Aroma: "Acuático", Género: "Unisex", Marca: "Aqua Lab" },
    createdAt: "2026-04-12",
  },
  {
    id: "prod-8",
    nombre: "Velvet Oud 30ml",
    descripcion: "Concentrado de nicho, larga duración.",
    categoria: categorias[1],
    precioVenta: 2200,
    precioCosto: 1100,
    stock: 5,
    stockMinimo: 3,
    imagenUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
    estatus: "disponible",
    sku: "PER-000004",
    atributos: { Mililitros: 30, Aroma: "Oriental", Género: "Unisex", Marca: "Maison N" },
    createdAt: "2026-04-20",
  },
]

// ─── Movimientos de stock ───────────────────────────────────────────────────────

export const movimientosStock: MovimientoStock[] = [
  { id: "mov-1", productoId: "prod-1", tipo: "entrada",  cantidad: 30, stockAntes: 0,  stockDespues: 30, notas: "Carga inicial",         createdAt: "2026-04-01" },
  { id: "mov-2", productoId: "prod-1", tipo: "salida",   cantidad: 6,  stockAntes: 30, stockDespues: 24, notas: "Ventas mayo",            createdAt: "2026-05-15" },
  { id: "mov-3", productoId: "prod-5", tipo: "entrada",  cantidad: 20, stockAntes: 0,  stockDespues: 20, notas: "Carga inicial",         createdAt: "2026-04-05" },
  { id: "mov-4", productoId: "prod-5", tipo: "salida",   cantidad: 6,  stockAntes: 20, stockDespues: 14, notas: "Ventas mostrador",       createdAt: "2026-05-10" },
  { id: "mov-5", productoId: "prod-4", tipo: "salida",   cantidad: 12, stockAntes: 12, stockDespues: 0,  notas: "Agotado en evento",      createdAt: "2026-05-20" },
  { id: "mov-6", productoId: "prod-7", tipo: "entrada",  cantidad: 10, stockAntes: 0,  stockDespues: 10, notas: "Compra proveedor",       createdAt: "2026-04-12" },
  { id: "mov-7", productoId: "prod-7", tipo: "salida",   cantidad: 7,  stockAntes: 10, stockDespues: 3,  notas: "Ventas semana",          createdAt: "2026-05-18" },
  { id: "mov-8", productoId: "prod-3", tipo: "entrada",  cantidad: 10, stockAntes: 0,  stockDespues: 10, notas: "Compra inicial",         createdAt: "2026-04-10" },
  { id: "mov-9", productoId: "prod-3", tipo: "salida",   cantidad: 4,  stockAntes: 10, stockDespues: 6,  notas: "Ventas presenciales",    createdAt: "2026-05-12" },
]

// ─── Ventas ────────────────────────────────────────────────────────────────────

export const ventas: Venta[] = [
  {
    id: "venta-1",
    folio: "VNT-0001",
    fecha: "2026-05-27",
    hora: "09:14",
    lineas: [
      { productoId: "prod-5", productoNombre: "Noir Intense 100ml", cantidad: 1, precioUnitario: 1490, subtotal: 1490 },
    ],
    total: 1490,
    formaPago: "efectivo",
  },
  {
    id: "venta-2",
    folio: "VNT-0002",
    fecha: "2026-05-27",
    hora: "11:32",
    lineas: [
      { productoId: "prod-1", productoNombre: "Playera Básica Blanca", cantidad: 2, precioUnitario: 280, subtotal: 560 },
      { productoId: "prod-2", productoNombre: "Playera Básica Negra",  cantidad: 1, precioUnitario: 280, subtotal: 280 },
    ],
    total: 840,
    formaPago: "tarjeta",
  },
  {
    id: "venta-3",
    folio: "VNT-0003",
    fecha: "2026-05-27",
    hora: "14:05",
    lineas: [
      { productoId: "prod-6", productoNombre: "Rose Gold 50ml",  cantidad: 1, precioUnitario: 990,  subtotal: 990  },
      { productoId: "prod-8", productoNombre: "Velvet Oud 30ml", cantidad: 1, precioUnitario: 2200, subtotal: 2200 },
    ],
    total: 3190,
    formaPago: "transferencia",
  },
  {
    id: "venta-4",
    folio: "VNT-0004",
    fecha: "2026-05-26",
    hora: "10:20",
    lineas: [
      { productoId: "prod-3", productoNombre: "Playera Premium Oversized", cantidad: 3, precioUnitario: 450, subtotal: 1350 },
    ],
    total: 1350,
    formaPago: "efectivo",
  },
  {
    id: "venta-5",
    folio: "VNT-0005",
    fecha: "2026-05-26",
    hora: "16:48",
    lineas: [
      { productoId: "prod-5", productoNombre: "Noir Intense 100ml", cantidad: 2, precioUnitario: 1490, subtotal: 2980 },
      { productoId: "prod-7", productoNombre: "Aqua Sport 200ml",   cantidad: 1, precioUnitario: 750,  subtotal: 750  },
    ],
    total: 3730,
    formaPago: "tarjeta",
  },
  {
    id: "venta-6",
    folio: "VNT-0006",
    fecha: "2026-05-25",
    hora: "13:10",
    lineas: [
      { productoId: "prod-1", productoNombre: "Playera Básica Blanca", cantidad: 4, precioUnitario: 280, subtotal: 1120 },
    ],
    total: 1120,
    formaPago: "efectivo",
  },
]

// ─── Transacciones financieras ─────────────────────────────────────────────────

export const transacciones: Transaccion[] = [
  { id: "trx-1", fecha: "2026-05-27", concepto: "Venta VNT-0001 — Noir Intense ×1",     categoria: categorias[2], cantidad: 1, formaPago: "efectivo",      monto: 1490, tipo: "ingreso" },
  { id: "trx-2", fecha: "2026-05-27", concepto: "Venta VNT-0002 — Playeras ×3",         categoria: categorias[2], cantidad: 3, formaPago: "tarjeta",        monto: 840,  tipo: "ingreso" },
  { id: "trx-3", fecha: "2026-05-27", concepto: "Venta VNT-0003 — Perfumes ×2",         categoria: categorias[2], cantidad: 2, formaPago: "transferencia",  monto: 3190, tipo: "ingreso" },
  { id: "trx-4", fecha: "2026-05-26", concepto: "Venta VNT-0004 — Oversized ×3",        categoria: categorias[2], cantidad: 3, formaPago: "efectivo",       monto: 1350, tipo: "ingreso" },
  { id: "trx-5", fecha: "2026-05-26", concepto: "Venta VNT-0005 — Perfumes ×3",         categoria: categorias[2], cantidad: 3, formaPago: "tarjeta",        monto: 3730, tipo: "ingreso" },
  { id: "trx-6", fecha: "2026-05-25", concepto: "Venta VNT-0006 — Playeras ×4",         categoria: categorias[2], cantidad: 4, formaPago: "efectivo",       monto: 1120, tipo: "ingreso" },
  { id: "trx-7", fecha: "2026-05-25", concepto: "Campaña Meta Ads — Mayo",               categoria: categorias[4], cantidad: 1, formaPago: "tarjeta",        monto: 2800, tipo: "gasto"   },
  { id: "trx-8", fecha: "2026-05-22", concepto: "Envíos regionales semana 3",            categoria: categorias[3], cantidad: 1, formaPago: "efectivo",       monto: 640,  tipo: "gasto"   },
  { id: "trx-9", fecha: "2026-05-20", concepto: "Compra inventario — Playeras lote",     categoria: categorias[5], cantidad: 1, formaPago: "transferencia",  monto: 4800, tipo: "gasto"   },
  { id: "trx-10",fecha: "2026-05-18", concepto: "Compra inventario — Perfumes lote",     categoria: categorias[5], cantidad: 1, formaPago: "transferencia",  monto: 6200, tipo: "gasto"   },
]

// ─── Gráfica mensual ───────────────────────────────────────────────────────────

export const graficaMensual = [
  { nombre: "Dic", ingresos: 18200, gastos: 8400  },
  { nombre: "Ene", ingresos: 21500, gastos: 9800  },
  { nombre: "Feb", ingresos: 19800, gastos: 10200 },
  { nombre: "Mar", ingresos: 26400, gastos: 11600 },
  { nombre: "Abr", ingresos: 31200, gastos: 13800 },
  { nombre: "May", ingresos: 11720, gastos: 8240  },
]
