"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireUser } from "@/server/auth/require-user"
import { AppError } from "@/server/errors/app-error"
import { fail, runAction, unwrap, type ActionResult } from "@/server/actions/result"

const email    = z.string().trim().toLowerCase().email("Escribe un correo válido.")
const password = z.string().min(8, "La contraseña necesita al menos 8 caracteres.").max(72)

const loginSchema = z.object({ email, password: z.string().min(1, "Escribe tu contraseña.") })

const registerSchema = z.object({
  nombre:  z.string().trim().min(2, "Escribe tu nombre.").max(80),
  negocio: z.string().trim().min(2, "Escribe el nombre de tu negocio.").max(80),
  email,
  password,
})

async function supabaseOrThrow() {
  const supabase = await createSupabaseServerClient()
  if (!supabase) throw new AppError("CONFIGURATION_ERROR", "Supabase no está configurado.", 500, false)
  return supabase
}

export async function login(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") })
  // Mensaje genérico: no revela si el correo existe.
  if (!parsed.success) return fail("Correo o contraseña incorrectos.")

  const result = await runAction(async () => {
    const supabase = await supabaseOrThrow()
    const { error } = await supabase.auth.signInWithPassword(parsed.data)
    if (error) {
      throw new AppError(
        "UNAUTHORIZED",
        error.code === "email_not_confirmed"
          ? "Confirma tu correo antes de entrar. Revisa tu bandeja de entrada."
          : "Correo o contraseña incorrectos.",
        401,
      )
    }
  })
  if (!result.ok) return result
  redirect("/dashboard")
}

/**
 * Crea la cuenta y su negocio. Si Supabase pide confirmar el correo no hay
 * sesión todavía: el negocio se crea al entrar por primera vez (/bienvenida).
 */
export async function register(formData: FormData): Promise<ActionResult<{ confirmarCorreo: boolean }>> {
  const result = await runAction(async () => {
    const values = registerSchema.parse({
      nombre:   formData.get("nombre"),
      negocio:  formData.get("negocio"),
      email:    formData.get("email"),
      password: formData.get("password"),
    })
    const supabase = await supabaseOrThrow()

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { nombre: values.nombre, negocio: values.negocio } },
    })
    if (error) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.code === "weak_password" ? "Elige una contraseña más segura." : "No pudimos crear la cuenta. Si ya tienes una, inicia sesión.",
        400,
      )
    }

    if (!data.session) return { confirmarCorreo: true }

    unwrap(await supabase.rpc("crear_negocio", { p_nombre: values.negocio }))
    return { confirmarCorreo: false }
  })

  if (result.ok && !result.data.confirmarCorreo) redirect("/dashboard")
  return result
}

/** Para cuentas sin negocio (p. ej. tras confirmar el correo). */
export async function crearNegocio(formData: FormData): Promise<ActionResult> {
  const result = await runAction(async () => {
    const nombre = z.string().trim().min(2, "Escribe el nombre de tu negocio.").max(80).parse(formData.get("negocio"))
    const { supabase } = await requireUser()
    unwrap(await supabase.rpc("crear_negocio", { p_nombre: nombre }))
  })
  if (!result.ok) return result
  redirect("/dashboard")
}

export async function logout() {
  const supabase = await createSupabaseServerClient()

  if (supabase) {
    await supabase.auth.signOut()
  }

  redirect("/login")
}
