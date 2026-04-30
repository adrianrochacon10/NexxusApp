"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const authSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
  nombre: z.string().min(2).optional(),
})

export async function login(formData: FormData) {
  const values = authSchema.omit({ nombre: true }).parse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  const supabase = await createSupabaseServerClient()

  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) {
      throw new Error(error.message)
    }
  }

  redirect("/dashboard")
}

export async function register(formData: FormData) {
  const values = authSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
    nombre: formData.get("nombre"),
  })
  const supabase = await createSupabaseServerClient()

  if (supabase) {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          nombre: values.nombre,
        },
      },
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  redirect("/dashboard")
}
