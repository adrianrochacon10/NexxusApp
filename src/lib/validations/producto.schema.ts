import { z } from "zod"

export const varianteSchema = z.object({
  id:          z.string().uuid().optional(),
  nombre:      z.string().trim().min(1, "El nombre de la variante es requerido").max(60),
  sku:         z.string().trim().max(60).optional().or(z.literal("")),
  atributos:   z.record(z.string(), z.string()).optional(),
  // Solo cuenta para variantes nuevas; el stock existente se cambia con movimientos.
  stock:       z.coerce.number().int().min(0, "El stock no puede ser negativo").max(100_000),
  stockMinimo: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo").max(100_000),
})

// variantes se manejan fuera del form con useState — no van en este schema
export const productoSchema = z.object({
  nombre:      z.string().trim().min(2, "El nombre es requerido").max(120),
  sku:         z.string().trim().min(2, "El SKU es requerido").max(60),
  descripcion: z.string().max(600).optional().or(z.literal("")),
  categoriaId: z.string().uuid("Selecciona una categoría"),
  precioVenta: z.coerce.number().positive("El precio de venta debe ser positivo").max(10_000_000),
  precioCosto: z.coerce.number().min(0, "El costo no puede ser negativo").max(10_000_000),
  // Stock inicial: solo se usa al crear. Para cambiarlo después se registra un movimiento.
  stock:       z.coerce.number().int().min(0, "El stock no puede ser negativo").max(100_000),
  stockMinimo: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo").max(100_000),
  imagenUrl:   z.string().url("URL inválida").optional().or(z.literal("")),
  // "Agotado" no se elige: se calcula cuando el stock llega a 0.
  estatus:     z.enum(["disponible", "pausado"]),
  atributos:   z.record(z.string(), z.string()).optional(),
})

export const stockSchema = z.object({
  productoId: z.string().uuid(),
  varianteId: z.string().uuid().optional(),
  tipo:       z.enum(["entrada", "salida", "ajuste"]),
  // entrada/salida: piezas que se mueven (> 0). ajuste: stock contado (>= 0).
  cantidad:   z.coerce.number().int().min(0).max(100_000),
  notas:      z.string().trim().max(300).optional().or(z.literal("")),
}).refine((v) => v.tipo === "ajuste" || v.cantidad > 0, { message: "La cantidad debe ser mayor a cero", path: ["cantidad"] })

export type ProductoInput = z.infer<typeof productoSchema>
export type VarianteInput = z.infer<typeof varianteSchema>
export type StockInput    = z.infer<typeof stockSchema>
