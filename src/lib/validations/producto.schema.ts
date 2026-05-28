import { z } from "zod"

export const varianteSchema = z.object({
  id:          z.string().optional(),
  nombre:      z.string().min(1, "El nombre de la variante es requerido"),
  sku:         z.string().optional().or(z.literal("")),
  atributos:   z.record(z.string(), z.string()).optional(),
  stock:       z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  stockMinimo: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo"),
})

// variantes se manejan fuera del form con useState — no van en este schema
export const productoSchema = z.object({
  nombre:      z.string().min(2, "El nombre es requerido").max(120),
  sku:         z.string().min(2, "El SKU es requerido").max(60),
  descripcion: z.string().max(600).optional().or(z.literal("")),
  categoriaId: z.string().min(1, "Selecciona una categoría"),
  precioVenta: z.coerce.number().positive("El precio de venta debe ser positivo"),
  precioCosto: z.coerce.number().min(0, "El costo no puede ser negativo"),
  stock:       z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  stockMinimo: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo"),
  imagenUrl:   z.string().url("URL inválida").optional().or(z.literal("")),
  estatus:     z.enum(["disponible", "pausado", "agotado"]),
  atributos:   z.record(z.string(), z.string()).optional(),
})

export const stockSchema = z.object({
  productoId: z.string().min(1),
  tipo:       z.enum(["entrada", "salida", "ajuste"]),
  cantidad:   z.coerce.number().int().positive("La cantidad debe ser mayor a cero"),
  notas:      z.string().max(300).optional().or(z.literal("")),
})

export type ProductoInput = z.infer<typeof productoSchema>
export type VarianteInput = z.infer<typeof varianteSchema>
export type StockInput    = z.infer<typeof stockSchema>
