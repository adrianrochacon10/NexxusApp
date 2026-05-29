"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { productoSchema, varianteSchema, stockSchema, type ProductoInput, type VarianteInput, type StockInput } from "@/lib/validations/producto.schema"
import { requireBusinessContext } from "@/server/business/business-context"

export async function crearProducto(input: ProductoInput, variantes: VarianteInput[] = []) {
  const values   = productoSchema.parse(input)
  const vars     = variantes.map((v) => varianteSchema.parse(v))
  const { supabase, business, user } = await requireBusinessContext()

  // Si hay variantes, el stock del producto = suma de stocks de variantes
  const stockProducto = vars.length > 0
    ? vars.reduce((s, v) => s + v.stock, 0)
    : values.stock

  const { data: producto, error } = await supabase.from("productos").insert({
    business_id:  business.id,
    user_id:      user.id,
    nombre:       values.nombre,
    descripcion:  values.descripcion || null,
    categoria_id: values.categoriaId,
    precio_venta: values.precioVenta,
    precio_costo: values.precioCosto,
    stock:        stockProducto,
    stock_minimo: values.stockMinimo,
    imagen_url:   values.imagenUrl || null,
    estatus:      stockProducto === 0 ? "agotado" : values.estatus,
    sku:          values.sku || null,
    atributos:    values.atributos || {},
  }).select("id").single()

  if (error || !producto) {
    throw new Error(error?.code === "23505" ? "Ya existe un producto con ese SKU en tu inventario." : (error?.message ?? "Error al crear el producto"))
  }

  // Insertar variantes si las hay
  if (vars.length > 0) {
    const { error: varError } = await supabase.from("producto_variantes").insert(
      vars.map((v) => ({
        business_id:  business.id,
        producto_id:  producto.id,
        nombre:       v.nombre,
        sku:          v.sku || null,
        atributos:    v.atributos || {},
        stock:        v.stock,
        stock_minimo: v.stockMinimo,
        estatus:      v.stock === 0 ? "agotado" : "disponible",
      }))
    )
    if (varError) throw new Error(varError.message)
  }

  revalidatePath("/inventario")
  redirect("/inventario")
}

export async function actualizarProducto(id: string, input: ProductoInput, variantes: VarianteInput[] = []) {
  const values = productoSchema.parse(input)
  const vars   = variantes.map((v) => varianteSchema.parse(v))
  const { supabase, business } = await requireBusinessContext()

  const stockProducto = vars.length > 0
    ? vars.reduce((s, v) => s + v.stock, 0)
    : values.stock

  const { error } = await supabase
    .from("productos")
    .update({
      nombre:       values.nombre,
      descripcion:  values.descripcion || null,
      categoria_id: values.categoriaId,
      precio_venta: values.precioVenta,
      precio_costo: values.precioCosto,
      stock:        stockProducto,
      stock_minimo: values.stockMinimo,
      imagen_url:   values.imagenUrl || null,
      estatus:      stockProducto === 0 ? "agotado" : values.estatus,
      sku:          values.sku || null,
      atributos:    values.atributos || {},
    })
    .eq("id", id)
    .eq("business_id", business.id)

  if (error) {
    throw new Error(error.code === "23505" ? "Ya existe un producto con ese SKU en tu inventario." : error.message)
  }

  // Reemplazar variantes: borrar las existentes e insertar las nuevas
  if (vars.length > 0) {
    await supabase.from("producto_variantes").delete().eq("producto_id", id)
    const { error: varError } = await supabase.from("producto_variantes").insert(
      vars.map((v) => ({
        business_id:  business.id,
        producto_id:  id,
        nombre:       v.nombre,
        sku:          v.sku || null,
        atributos:    v.atributos || {},
        stock:        v.stock,
        stock_minimo: v.stockMinimo,
        estatus:      v.stock === 0 ? "agotado" : "disponible",
      }))
    )
    if (varError) throw new Error(varError.message)
  } else {
    // Si se quitaron todas las variantes, borrarlas
    await supabase.from("producto_variantes").delete().eq("producto_id", id)
  }

  revalidatePath("/inventario")
  revalidatePath(`/inventario/${id}`)
  redirect(`/inventario/${id}`)
}

export async function actualizarStockVariante(varianteId: string, productoId: string, tipo: "entrada" | "salida" | "ajuste", cantidad: number, notas?: string) {
  const { supabase, business, user } = await requireBusinessContext()

  const { data: variante, error: varErr } = await supabase
    .from("producto_variantes")
    .select("stock, stock_minimo")
    .eq("id", varianteId)
    .eq("business_id", business.id)
    .single()

  if (varErr || !variante) throw new Error("Variante no encontrada")

  const stockAntes   = variante.stock
  const stockDespues =
    tipo === "entrada" ? stockAntes + cantidad :
    tipo === "salida"  ? stockAntes - cantidad :
    cantidad

  if (stockDespues < 0) throw new Error("El stock no puede quedar negativo")

  const estatus = stockDespues === 0 ? "agotado" : stockDespues <= variante.stock_minimo ? "agotado" : "disponible"

  await supabase.from("producto_variantes").update({ stock: stockDespues, estatus }).eq("id", varianteId)

  // Recalcular stock total del producto
  const { data: todasVariantes } = await supabase
    .from("producto_variantes")
    .select("stock")
    .eq("producto_id", productoId)
    .eq("business_id", business.id)

  const stockTotal = (todasVariantes ?? []).reduce((s, v) => s + v.stock, 0)
  await supabase.from("productos").update({
    stock:   stockTotal,
    estatus: stockTotal === 0 ? "agotado" : "disponible",
  }).eq("id", productoId)

  await supabase.from("movimientos_stock").insert({
    business_id:   business.id,
    producto_id:   productoId,
    variante_id:   varianteId,
    user_id:       user.id,
    tipo,
    cantidad,
    stock_antes:   stockAntes,
    stock_despues: stockDespues,
    notas:         notas || null,
  })

  revalidatePath(`/inventario/${productoId}`)
}

export async function eliminarProducto(id: string) {
  const { supabase, business } = await requireBusinessContext()

  // Obtener imagen_url antes de borrar
  const { data: producto } = await supabase
    .from("productos")
    .select("imagen_url")
    .eq("id", id)
    .eq("business_id", business.id)
    .single()

  const { error } = await supabase
    .from("productos")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id)

  if (error) throw new Error(error.message)

  // Borrar imagen de R2 si existe (import dinámico para no afectar bundle del cliente)
  if (producto?.imagen_url) {
    const { deleteR2Object } = await import("@/lib/cloudflare/r2")
    await deleteR2Object(producto.imagen_url).catch(() => {})
  }

  revalidatePath("/inventario")
  redirect("/inventario")
}

export async function cambiarEstatusProducto(id: string, estatus: "disponible" | "pausado" | "agotado") {
  const { supabase, business } = await requireBusinessContext()

  const { error } = await supabase
    .from("productos")
    .update({ estatus })
    .eq("id", id)
    .eq("business_id", business.id)

  if (error) throw new Error(error.message)

  revalidatePath(`/inventario/${id}`)
  revalidatePath("/inventario")
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
