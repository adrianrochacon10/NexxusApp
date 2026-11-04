import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CrearNegocioForm } from "@/components/auth/CrearNegocioForm"
import { requireUser } from "@/server/auth/require-user"

export const metadata: Metadata = { title: "Crea tu negocio · Nexxus" }
export const dynamic = "force-dynamic"

export default async function BienvenidaPage() {
  const { supabase, user } = await requireUser()

  const { data: membership } = await supabase
    .from("business_memberships")
    .select("business_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle()

  if (membership) redirect("/dashboard")

  const sugerido = typeof user.user_metadata?.negocio === "string" ? user.user_metadata.negocio : ""

  return <CrearNegocioForm sugerido={sugerido} />
}
