import { z } from "zod"

const uuid = z.string().uuid("Identificador inválido")

// El precio NO viaja desde el cliente: lo pone la base de datos.
export const lineaVentaSchema = z.object({
  productoId: uuid,
  varianteId: uuid.optional(),
  cantidad:   z.number().int().min(1).max(999),
}).strict()

export const nuevaVentaSchema = z.object({
  lineas: z.array(lineaVentaSchema).min(1, "El ticket está vacío.").max(100),
  pagoInicial: z.object({
    monto:     z.number().min(0).max(10_000_000),
    formaPago: z.enum(["efectivo", "transferencia", "tarjeta", "adeudo"]),
  }).strict().optional(),
  cliente: z.object({
    nombre:   z.string().trim().min(2, "Escribe el nombre del cliente.").max(120),
    telefono: z.string().trim().max(30).optional(),
  }).strict().optional(),
  notas:          z.string().trim().max(500).optional(),
  idempotencyKey: uuid,
}).strict()

export const abonoSchema = z.object({
  ventaId:        uuid,
  monto:          z.number().positive("El abono debe ser mayor a $0.00.").max(10_000_000),
  formaPago:      z.enum(["efectivo", "transferencia", "tarjeta"]),
  idempotencyKey: uuid,
}).strict()

export const cancelacionSchema = z.object({
  ventaId: uuid,
  motivo:  z.string().trim().min(3, "Escribe el motivo de la cancelación.").max(300),
}).strict()

export type NuevaVentaInput = z.infer<typeof nuevaVentaSchema>
export type AbonoInput      = z.infer<typeof abonoSchema>
