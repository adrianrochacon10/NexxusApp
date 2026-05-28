import "server-only"

import type { User } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AppError } from "@/server/errors/app-error"

export type AuthenticatedSession = {
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>
  user: User
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const supabase = await createSupabaseServerClient()

  if (!supabase) {
    throw new AppError(
      "CONFIGURATION_ERROR",
      "Supabase no esta configurado para ejecutar acciones de servidor.",
      500,
      false,
    )
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new AppError("UNAUTHORIZED", "No se pudo validar la sesion.", 401)
  }

  if (!user) {
    return null
  }

  return { supabase, user }
}

export async function requireUser(): Promise<AuthenticatedSession> {
  const session = await getAuthenticatedSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

