"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireBusinessContext } from "@/server/business/business-context"
import { runAction, unwrap, type ActionResult } from "@/server/actions/result"

const categoriaSchema = z.object({
  nombre:        z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(60),
  tipo:          z.enum(["producto", "gasto", "ingreso"]),
  color:         z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido.").optional(),
  icono:         z.string().max(40).optional(),
  atributosBase: z.array(z.string().trim().min(1).max(40)).max(12),
}).strict()

export type NuevaCategoriaInput = z.input<typeof categoriaSchema>

export async function crearCategoria(input: NuevaCategoriaInput): Promise<ActionResult<{ categoriaId: string }>> {
  return runAction(async () => {
    const values = categoriaSchema.parse({ ...input, atributosBase: input.atributosBase.filter(Boolean) })
    const { supabase, business } = await requireBusinessContext()

    const categoria = unwrap(await supabase.from("categorias").insert({
      business_id:    business.id,
      nombre:         values.nombre,
      tipo:           values.tipo,
      color:          values.color ?? null,
      icono:          values.icono ?? null,
      atributos_base: values.atributosBase,
    }).select("id").single())

    revalidatePath("/inventario", "layout")
    revalidatePath("/finanzas", "layout")
    if (!categoria) throw new Error("No se creó la categoría")
    return { categoriaId: categoria.id }
  })
}

export async function eliminarCategoria(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const categoriaId = z.string().uuid().parse(id)
    const { supabase, business } = await requireBusinessContext()

    unwrap(await supabase.from("categorias").delete().eq("id", categoriaId).eq("business_id", business.id))

    revalidatePath("/inventario", "layout")
    revalidatePath("/finanzas", "layout")
  })
}
