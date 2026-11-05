import "server-only"

import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireUser } from "@/server/auth/require-user"
import { AppError } from "@/server/errors/app-error"

export type BusinessRole = "admin"
type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>

export type BusinessContext = {
  supabase: SupabaseClient
  business: {
    id: string
    name: string
    slug: string | null
  }
  membership: {
    role: BusinessRole
  }
  user: {
    id: string
    email?: string
    nombre?: string
  }
}

export async function requireBusinessContext(): Promise<BusinessContext> {
  const { supabase, user } = await requireUser()

  const { data: membership, error: membershipError } = await supabase
    .from("business_memberships")
    .select("business_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    throw new AppError("INTERNAL_ERROR", "No se pudo cargar el negocio activo.", 500, false)
  }

  // Cuenta sin negocio (p. ej. recién confirmó su correo): que cree el suyo.
  if (!membership) {
    redirect("/bienvenida")
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("id", membership.business_id)
    .single()

  if (businessError || !business) {
    throw new AppError("NOT_FOUND", "No se encontro el negocio activo.", 404)
  }

  return {
    supabase,
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
    },
    membership: {
      role: membership.role as BusinessRole,
    },
    user: {
      id: user.id,
      email: user.email,
      nombre: typeof user.user_metadata?.nombre === "string" ? user.user_metadata.nombre : undefined,
    },
  }
}

