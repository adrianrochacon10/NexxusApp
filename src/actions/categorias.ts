"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireBusinessContext } from "@/server/business/business-context"

export interface NuevaCategoriaInput {
  nombre:        string
  tipo:          "producto" | "gasto" | "ingreso"
  color?:        string
  icono?:        string
  atributosBase: string[]
}

export async function crearCategoria(input: NuevaCategoriaInput) {
  const { supabase, business, user } = await requireBusinessContext()

  const { error } = await supabase.from("categorias").insert({
    business_id:    business.id,
    user_id:        user.id,
    nombre:         input.nombre.trim(),
    tipo:           input.tipo,
    color:          input.color || null,
    icono:          input.icono || null,
    atributos_base: input.atributosBase.filter(Boolean),
  })

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "Ya existe una categoría con ese nombre y tipo."
        : error.message
    )
  }

  revalidatePath("/inventario")
  revalidatePath("/inventario/categorias")
  redirect("/inventario")
}

export async function eliminarCategoria(id: string) {
  const { supabase, business } = await requireBusinessContext()

  const { error } = await supabase
    .from("categorias")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id)

  if (error) throw new Error(error.message)

  revalidatePath("/inventario")
  redirect("/inventario")
}
