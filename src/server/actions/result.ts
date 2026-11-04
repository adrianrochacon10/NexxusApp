import "server-only"

import type { PostgrestError } from "@supabase/supabase-js"
import { ZodError } from "zod"
import { AppError } from "@/server/errors/app-error"

/**
 * Resultado de una Server Action. Las acciones devuelven errores en lugar de
 * lanzarlos: en producción Next oculta el mensaje de las excepciones y el
 * usuario solo vería un error genérico.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function ok(): ActionResult<void>
export function ok<T>(data: T): ActionResult<T>
export function ok<T>(data?: T): ActionResult<T | void> {
  return { ok: true, data }
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

const GENERICO = "No se pudo completar la operación. Intenta de nuevo."

// Violaciones de unicidad → mensaje según la restricción
const UNICOS: Record<string, string> = {
  productos_business_sku_uq: "Ya existe un producto con ese SKU.",
  producto_variantes_business_sku_uq: "Ya existe una variante con ese SKU.",
  producto_variantes_producto_id_nombre_key: "Hay dos variantes con el mismo nombre.",
  categorias_business_id_tipo_nombre_key: "Ya existe una categoría con ese nombre.",
}

function esPostgrestError(err: unknown): err is PostgrestError {
  return typeof err === "object" && err !== null && "code" in err && "message" in err
}

/**
 * Traduce un error a un mensaje seguro para el usuario.
 * - Mensajes que escriben nuestras funciones SQL (RAISE) se muestran tal cual.
 * - Errores internos de Postgres se registran y se cambian por uno genérico.
 */
export function mensajeDeError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues[0]?.message ?? "Datos inválidos."
  }
  if (err instanceof AppError) {
    return err.expose ? err.message : GENERICO
  }
  if (esPostgrestError(err)) {
    const { code, message, details } = err
    if (code === "23505") {
      const restriccion = Object.keys(UNICOS).find((k) => message.includes(k) || details?.includes(k))
      return restriccion ? UNICOS[restriccion] : "Ese registro ya existe."
    }
    if (code === "42501") {
      return message.startsWith("No tienes") || message.startsWith("Inicia") || message.startsWith("Esta categoría")
        ? message
        : "No tienes permiso para hacer esto."
    }
    if (code === "22P02" || code === "23502") return "Faltan datos o tienen un formato inválido."
    if (code === "23503") return "Ese registro está en uso y no se puede borrar."
    // 22023 / 23514 / P0002: validaciones de negocio con mensaje propio en español.
    // Los checks automáticos de Postgres dicen "violates …": esos no se exponen.
    if ((code === "22023" || code === "23514" || code === "P0002") && !message.includes("violates")) {
      return message
    }
  }
  console.error("[action]", err)
  return GENERICO
}

/** Ejecuta la acción y convierte cualquier error en `{ ok: false }`. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (err) {
    // redirect()/notFound() de Next usan excepciones: hay que dejarlas pasar.
    if (typeof err === "object" && err !== null && "digest" in err && typeof err.digest === "string" && /^NEXT_(REDIRECT|HTTP_ERROR|NOT_FOUND)/.test(err.digest)) {
      throw err
    }
    return { ok: false, error: mensajeDeError(err) }
  }
}

/** Lanza el error de Supabase para que runAction lo traduzca. */
export function unwrap<T>({ data, error }: { data: T; error: PostgrestError | null }): T {
  if (error) throw error
  return data
}
