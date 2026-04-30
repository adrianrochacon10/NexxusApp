import { notFound } from "next/navigation"
import { ProductoForm } from "@/components/inventario/ProductoForm"
import { Navbar } from "@/components/shared/Navbar"
import { productos } from "@/lib/demo-data"

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const producto = productos.find((item) => item.id === id)
  if (!producto) notFound()

  return (
    <>
      <Navbar title="Editar producto" subtitle={producto.nombre} />
      <div className="page">
        <ProductoForm
          defaultValues={{
            nombre: producto.nombre,
            sku: producto.sku,
            descripcion: producto.descripcion,
            categoriaId: producto.categoria.id,
            precioVenta: producto.precioVenta,
            precioCosto: producto.precioCosto,
            stock: producto.stock,
            stockMinimo: producto.stockMinimo,
            estatus: producto.estatus,
            imagenUrl: producto.imagenUrl,
          }}
        />
      </div>
    </>
  )
}
