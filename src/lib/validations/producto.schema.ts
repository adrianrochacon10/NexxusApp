import { z } from "zod"

export const productoSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido").max(120),
  sku: z.string().min(2, "El SKU es requerido").max(60),
  descripcion: z.string().max(600).optional().or(z.literal("")),
  categoriaId: z.string().min(1, "Selecciona una categoria"),
  precioVenta: z.coerce.number().positive("El precio de venta debe ser positivo"),
  precioCosto: z.coerce.number().min(0, "El costo no puede ser negativo"),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  stockMinimo: z.coerce.number().int().min(0, "El stock minimo no puede ser negativo"),
  imagenUrl: z.string().url("URL invalida").optional().or(z.literal("")),
  estatus: z.enum(["disponible", "pausado", "agotado"]),
})

export const stockSchema = z.object({
  productoId: z.string().min(1),
  tipo: z.enum(["entrada", "salida", "ajuste"]),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor a cero"),
  notas: z.string().max(300).optional().or(z.literal("")),
})

export type ProductoInput = z.infer<typeof productoSchema>
export type StockInput = z.infer<typeof stockSchema>
