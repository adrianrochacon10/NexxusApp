"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { productoSchema, stockSchema, type ProductoInput, type StockInput } from "@/lib/validations/producto.schema"
import { requireBusinessContext } from "@/server/business/business-context"

export async function crearProducto(input: ProductoInput) {
  const values = productoSchema.parse(input)
  const { supabase, business, user } = await requireBusinessContext()

  const { error } = await supabase.from("productos").insert({
    business_id:  business.id,
    user_id:      user.id,
    nombre:       values.nombre,
    descripcion:  values.descripcion || null,
    categoria_id: values.categoriaId,
    precio_venta: values.precioVenta,
    precio_costo: values.precioCosto,
    stock:        values.stock,
    stock_minimo: values.stockMinimo,
    imagen_url:   values.imagenUrl || null,
    estatus:      values.estatus,
    sku:          values.sku || null,
    atributos:    values.atributos || {},
  })

  if (error) {
    throw new Error(error.code === "23505" ? "Ya existe un producto con ese SKU en tu inventario." : error.message)
  }

  revalidatePath("/inventario")
  redirect("/inventario")
}

export async function actualizarProducto(id: string, input: ProductoInput) {
  const values = productoSchema.parse(input)
  const { supabase, business } = await requireBusinessContext()

  const { error } = await supabase
    .from("productos")
    .update({
      nombre:       values.nombre,
      descripcion:  values.descripcion || null,
      categoria_id: values.categoriaId,
      precio_venta: values.precioVenta,
      precio_costo: values.precioCosto,
      stock:        values.stock,
      stock_minimo: values.stockMinimo,
      imagen_url:   values.imagenUrl || null,
      estatus:      values.estatus,
      sku:          values.sku || null,
      atributos:    values.atributos || {},
    })
    .eq("id", id)
    .eq("business_id", business.id)

  if (error) {
    throw new Error(error.code === "23505" ? "Ya existe un producto con ese SKU en tu inventario." : error.message)
  }

  revalidatePath("/inventario")
  revalidatePath(`/inventario/${id}`)
  redirect(`/inventario/${id}`)
}

export async function eliminarProducto(id: string) {
  const { supabase, business } = await requireBusinessContext()

  const { error } = await supabase
    .from("productos")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id)

  if (error) throw new Error(error.message)

  revalidatePath("/inventario")
  redirect("/inventario")
}

export async function actualizarStock(input: StockInput) {
  const values = stockSchema.parse(input)
  const { supabase, business, user } = await requireBusinessContext()

  const { data: producto, error: productError } = await supabase
    .from("productos")
    .select("stock, stock_minimo")
    .eq("id", values.productoId)
    .eq("business_id", business.id)
    .single()

  if (productError || !producto) throw new Error(productError?.message ?? "Producto no encontrado")

  const stockAntes   = producto.stock
  const stockDespues =
    values.tipo === "entrada" ? stockAntes + values.cantidad :
    values.tipo === "salida"  ? stockAntes - values.cantidad :
    values.cantidad

  if (stockDespues < 0) throw new Error("El stock no puede quedar negativo")

  const estatus = stockDespues === 0 ? "agotado" : stockDespues <= producto.stock_minimo ? "agotado" : "disponible"

  await supabase.from("productos").update({ stock: stockDespues, estatus }).eq("id", values.productoId)

  await supabase.from("movimientos_stock").insert({
    business_id:   business.id,
    producto_id:   values.productoId,
    user_id:       user.id,
    tipo:          values.tipo,
    cantidad:      values.cantidad,
    stock_antes:   stockAntes,
    stock_despues: stockDespues,
    notas:         values.notas || null,
  })

  revalidatePath("/inventario")
  revalidatePath(`/inventario/${values.productoId}`)
}
