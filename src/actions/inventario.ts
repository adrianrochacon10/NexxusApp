"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { productoSchema, stockSchema, type ProductoInput, type StockInput } from "@/lib/validations/producto.schema"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function crearProducto(input: ProductoInput) {
  const values = productoSchema.parse(input)
  const supabase = await createSupabaseServerClient()

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    const { error } = await supabase.from("productos").insert({
      user_id: user.id,
      nombre: values.nombre,
      descripcion: values.descripcion || null,
      categoria_id: values.categoriaId,
      precio_venta: values.precioVenta,
      precio_costo: values.precioCosto,
      stock: values.stock,
      stock_minimo: values.stockMinimo,
      imagen_url: values.imagenUrl || null,
      estatus: values.estatus,
      sku: values.sku,
    })

    if (error) {
      throw new Error(error.code === "23505" ? "Producto ya existe en tu inventario" : error.message)
    }
  }

  revalidatePath("/inventario")
  redirect("/inventario")
}

export async function actualizarStock(input: StockInput) {
  const values = stockSchema.parse(input)
  const supabase = await createSupabaseServerClient()

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    const { data: producto, error: productError } = await supabase
      .from("productos")
      .select("stock, stock_minimo")
      .eq("id", values.productoId)
      .single()

    if (productError || !producto) {
      throw new Error(productError?.message ?? "Producto no encontrado")
    }

    const stockAntes = producto.stock
    const stockDespues =
      values.tipo === "entrada"
        ? stockAntes + values.cantidad
        : values.tipo === "salida"
          ? stockAntes - values.cantidad
          : values.cantidad

    if (stockDespues < 0) {
      throw new Error("El stock no puede quedar negativo")
    }

    const estatus = stockDespues <= producto.stock_minimo ? "agotado" : "disponible"

    const { error: updateError } = await supabase
      .from("productos")
      .update({ stock: stockDespues, estatus })
      .eq("id", values.productoId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    const { error: movementError } = await supabase.from("movimientos_stock").insert({
      producto_id: values.productoId,
      user_id: user.id,
      tipo: values.tipo,
      cantidad: values.cantidad,
      stock_antes: stockAntes,
      stock_despues: stockDespues,
      notas: values.notas || null,
    })

    if (movementError) {
      throw new Error(movementError.message)
    }
  }

  revalidatePath("/inventario")
}
