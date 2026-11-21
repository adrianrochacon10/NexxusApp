"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { productoSchema, varianteSchema, stockSchema, type ProductoInput, type VarianteInput, type StockInput } from "@/lib/validations/producto.schema"
import { requireBusinessContext } from "@/server/business/business-context"
import { AppError } from "@/server/errors/app-error"
import { runAction, unwrap, type ActionResult } from "@/server/actions/result"

// Productos, variantes y stock solo se escriben vía funciones SQL
// (guardar_producto, ajustar_stock, cambiar_estatus_producto): ahí viven las
// reglas de stock no negativo, bitácora de movimientos y suma de variantes.

function revalidarInventario(productoId?: string) {
  revalidatePath("/inventario", "layout")
  revalidatePath("/ventas/nueva")
  revalidatePath("/dashboard")
  if (productoId) revalidatePath(`/inventario/${productoId}`)
}

async function guardarProducto(productoId: string | null, input: ProductoInput, variantes: VarianteInput[]) {
  const values = productoSchema.parse(input)
  const vars = z.array(varianteSchema).max(60).parse(variantes)
  const { supabase, business } = await requireBusinessContext()

  const id = unwrap(await supabase.rpc("guardar_producto", {
    p_business_id: business.id,
    p_producto_id: productoId as string, // null = crear
    p_datos: {
      nombre:        values.nombre,
      descripcion:   values.descripcion || null,
      categoria_id:  values.categoriaId,
      precio_venta:  values.precioVenta,
      precio_costo:  values.precioCosto,
      stock_minimo:  values.stockMinimo,
      imagen_url:    values.imagenUrl || null,
      estatus:       values.estatus,
      sku:           values.sku || null,
      atributos:     values.atributos ?? {},
      stock_inicial: values.stock,
    },
    p_variantes: vars.map((v) => ({
      id:            v.id ?? null,
      nombre:        v.nombre,
      sku:           v.sku || null,
      atributos:     v.atributos ?? {},
      stock_minimo:  v.stockMinimo,
      stock_inicial: v.stock,
    })),
  })) as string

  revalidarInventario(id)
  return { productoId: id }
}

export async function crearProducto(input: ProductoInput, variantes: VarianteInput[] = []): Promise<ActionResult<{ productoId: string }>> {
  return runAction(() => guardarProducto(null, input, variantes))
}

export async function actualizarProducto(id: string, input: ProductoInput, variantes: VarianteInput[] = []): Promise<ActionResult<{ productoId: string }>> {
  return runAction(() => guardarProducto(z.string().uuid().parse(id), input, variantes))
}

/** Entrada, salida o ajuste (conteo) de un producto o una de sus variantes. */
export async function ajustarStock(input: StockInput): Promise<ActionResult<{ stock: number }>> {
  return runAction(async () => {
    const values = stockSchema.parse(input)
    const { supabase, business } = await requireBusinessContext()

    const stock = unwrap(await supabase.rpc("ajustar_stock", {
      p_business_id: business.id,
      p_producto_id: values.productoId,
      p_variante_id: (values.varianteId ?? null) as string,
      p_tipo:        values.tipo,
      p_cantidad:    values.cantidad,
      p_notas:       values.notas || undefined,
    })) as number

    revalidarInventario(values.productoId)
    return { stock }
  })
}

export async function cambiarEstatusProducto(id: string, estatus: "disponible" | "pausado"): Promise<ActionResult> {
  return runAction(async () => {
    const productoId = z.string().uuid().parse(id)
    const nuevo = z.enum(["disponible", "pausado"]).parse(estatus)
    const { supabase, business } = await requireBusinessContext()

    unwrap(await supabase.rpc("cambiar_estatus_producto", {
      p_business_id: business.id,
      p_producto_id: productoId,
      p_estatus:     nuevo,
    }))

    revalidarInventario(productoId)
  })
}

/** Borra el producto y su historial de movimientos. Las ventas conservan su detalle. */
export async function eliminarProducto(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const productoId = z.string().uuid().parse(id)
    const { supabase, business } = await requireBusinessContext()

    const producto = unwrap(await supabase
      .from("productos")
      .delete()
      .eq("id", productoId)
      .eq("business_id", business.id)
      .select("imagen_url")
      .maybeSingle())

    if (!producto) throw new AppError("NOT_FOUND", "Producto no encontrado.", 404)

    if (producto.imagen_url) {
      // import dinámico: el SDK de R2 no entra al bundle del cliente
      const { deleteR2Object } = await import("@/lib/cloudflare/r2")
      await deleteR2Object(producto.imagen_url).catch((err) => console.error("[r2] no se borró la imagen", err))
    }

    revalidarInventario()
  })
}
