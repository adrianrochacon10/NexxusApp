/** Forma serializada de ActionResult (src/server/actions/result.ts), usable en el cliente. */
export type ClientActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

/**
 * Para código cliente con try/catch: convierte `{ ok: false }` en excepción
 * con el mensaje (ya seguro) del servidor, y devuelve `data` en éxito.
 */
export function exigirOk<T>(res: ClientActionResult<T>): T {
  if (!res.ok) throw new Error(res.error)
  return res.data
}
