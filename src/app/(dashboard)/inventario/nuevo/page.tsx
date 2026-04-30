import { ProductoForm } from "@/components/inventario/ProductoForm"
import { Navbar } from "@/components/shared/Navbar"

export default function NuevoProductoPage() {
  return (
    <>
      <Navbar title="Nuevo producto" subtitle="Crea un producto con precio, stock inicial e imagen." />
      <div className="page">
        <ProductoForm />
      </div>
    </>
  )
}
