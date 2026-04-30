import { z } from "zod"

export const transaccionSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  concepto: z.string().min(2, "El concepto es requerido").max(160),
  categoriaId: z.string().min(1, "Selecciona una categoria"),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor a cero"),
  formaPago: z.enum(["efectivo", "transferencia", "adeudo", "tarjeta"]),
  monto: z.coerce.number().positive("El monto debe ser positivo"),
  tipo: z.enum(["ingreso", "gasto", "transferencia"]),
  productoId: z.string().optional().or(z.literal("")),
  notas: z.string().max(400).optional().or(z.literal("")),
})

export type TransaccionInput = z.infer<typeof transaccionSchema>
